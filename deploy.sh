#!/bin/bash

# Simple deployment script for FitForge
# Single user version with DynamoDB (practically free)

set -e

echo "🏋️ FitForge Deployment Script"
echo "=============================="

# Check for required tools
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required. Install it first." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required. Install Node.js first." >&2; exit 1; }

# Get Claude API key
read -p "Enter your Claude API key (sk-ant-...): " CLAUDE_API_KEY

# Deploy infrastructure
echo "📦 Deploying AWS infrastructure..."
aws cloudformation deploy \
  --template-file backend/deploy/serverless-simple.yaml \
  --stack-name fitforge \
  --parameter-overrides ClaudeApiKey=$CLAUDE_API_KEY \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --no-fail-on-empty-changeset

# Get stack outputs
echo "📋 Getting stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name fitforge --query 'Stacks[0].Outputs' --output json)

USER_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
CLIENT_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
API_ENDPOINT=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiEndpoint") | .OutputValue')
CLOUDFRONT_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendURL") | .OutputValue')

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
VITE_API_URL=$API_ENDPOINT
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$CLIENT_ID
EOF

# Build frontend
echo "🔨 Building frontend..."
npm install
npm run build

# Deploy frontend to S3
echo "☁️ Deploying frontend to S3..."
BUCKET_NAME="fitforge-frontend-$(aws sts get-caller-identity --query Account --output text)"
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Create CloudFront invalidation
echo "🚀 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$BUCKET_NAME')].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Set up Igor's user account
echo "👤 Setting up user account..."
read -s -p "Enter password for igor@barani.org (min 8 chars, upper, lower, number): " USER_PASSWORD
echo
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username igor@barani.org \
  --password "$USER_PASSWORD" \
  --permanent 2>/dev/null || true

# Deploy Lambda function
echo "⚡ Deploying Lambda function..."
cd backend
npm install
zip -r function.zip . -x "*.git*" -x "deploy/*" -x "*.md"
aws lambda update-function-code \
  --function-name fitforge-api \
  --zip-file fileb://function.zip \
  --no-cli-pager
cd ..

echo ""
echo "✅ Deployment complete!"
echo "========================"
echo ""
echo "🌐 Your app is available at: $CLOUDFRONT_URL"
echo "📧 Login with: igor@barani.org"
echo "🔑 Password: (the one you just set)"
echo ""
echo "📊 Estimated monthly cost: < $1 (likely free)"
echo ""
echo "💡 Tips:"
echo "  - The app data is stored in DynamoDB (serverless)"
echo "  - Claude API is the only real cost (~$0.01 per analysis)"
echo "  - Everything else should be within AWS free tier"
echo ""
echo "🔧 To update the app:"
echo "  - Frontend: npm run build && aws s3 sync dist/ s3://$BUCKET_NAME"
echo "  - Backend: cd backend && zip -r function.zip . && aws lambda update-function-code --function-name fitforge-api --zip-file fileb://function.zip"