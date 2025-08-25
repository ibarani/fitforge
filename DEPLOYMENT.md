# FitForge Deployment Guide

## Architecture Overview

FitForge is deployed on AWS with the following components:
- **Frontend**: React app served from S3 + CloudFront
- **Authentication**: AWS Cognito
- **Backend API**: Lambda functions or ECS containers
- **Database**: RDS PostgreSQL
- **AI Analysis**: Claude API integration

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. Node.js 18+ installed
4. Claude API key from Anthropic

## Deployment Steps

### 1. Set Up AWS Infrastructure

Deploy the CloudFormation stack:

```bash
aws cloudformation create-stack \
  --stack-name fitforge-infrastructure \
  --template-body file://backend/deploy/aws-infrastructure.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=production \
  --capabilities CAPABILITY_IAM
```

Wait for stack creation to complete:
```bash
aws cloudformation wait stack-create-complete \
  --stack-name fitforge-infrastructure
```

Get the stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name fitforge-infrastructure \
  --query 'Stacks[0].Outputs'
```

### 2. Configure Cognito

1. Note the UserPoolId and UserPoolClientId from stack outputs
2. Create a Cognito domain:
```bash
aws cognito-idp create-user-pool-domain \
  --domain fitforge-auth \
  --user-pool-id YOUR_USER_POOL_ID
```

3. Create the initial user (igor@barani.org):
```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username igor@barani.org \
  --user-attributes Name=email,Value=igor@barani.org Name=name,Value="Igor Barani" \
  --temporary-password "TempPassword123!" \
  --message-action SUPPRESS
```

### 3. Set Up Database

1. Connect to RDS instance:
```bash
psql -h YOUR_RDS_ENDPOINT -U fitforgeadmin -d fitforge
```

2. Run the schema creation script:
```sql
\i backend/database/schema.sql
```

### 4. Deploy Backend API

Option A: Using Lambda Functions
```bash
cd backend
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name fitforge-api-production \
  --zip-file fileb://function.zip
```

Option B: Using ECS with Docker
```bash
# Build and push Docker image
docker build -t fitforge-backend .
docker tag fitforge-backend:latest YOUR_ECR_REPOSITORY_URL:latest
docker push YOUR_ECR_REPOSITORY_URL:latest

# Update ECS service
aws ecs update-service \
  --cluster fitforge-cluster \
  --service fitforge-api \
  --force-new-deployment
```

### 5. Deploy Frontend

1. Update environment variables:
```bash
cp .env.example .env
# Edit .env with your AWS resource IDs
```

2. Build the frontend:
```bash
npm install
npm run build
```

3. Deploy to S3:
```bash
aws s3 sync dist/ s3://fitforge-frontend-production \
  --delete \
  --cache-control "public, max-age=3600"
```

4. Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://api.fitforge.yourdomain.com
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=fitforge-auth.auth.us-east-1.amazoncognito.com
```

### Backend (.env)
```
DATABASE_URL=postgresql://fitforgeadmin:password@rds-endpoint:5432/fitforge
CLAUDE_API_KEY=sk-ant-XXXXXXXXXXXXX
FRONTEND_URL=https://fitforge.yourdomain.com
```

## Setting Up Claude API Integration

1. Get your API key from https://console.anthropic.com/
2. Store it in AWS Secrets Manager:
```bash
aws secretsmanager update-secret \
  --secret-id fitforge-claude-api-key-production \
  --secret-string '{"apiKey":"YOUR_CLAUDE_API_KEY"}'
```

## Monitoring

### CloudWatch Dashboards
Create dashboards to monitor:
- Lambda function invocations and errors
- RDS database connections and performance
- API Gateway requests and latency
- S3 and CloudFront traffic

### Alarms
Set up alarms for:
- Lambda errors > 1% of invocations
- RDS CPU > 80%
- API Gateway 4xx/5xx errors > 5%

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and deploy frontend
        run: |
          npm ci
          npm run build
          aws s3 sync dist/ s3://fitforge-frontend-production --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
      
      - name: Deploy backend
        run: |
          cd backend
          npm ci
          # Deploy Lambda or ECS based on your setup
```

## Security Best Practices

1. **Enable MFA** for Cognito users
2. **Use VPC endpoints** for private communication
3. **Enable RDS encryption** at rest
4. **Rotate secrets** regularly using Secrets Manager
5. **Enable CloudTrail** for audit logging
6. **Use WAF** on CloudFront and API Gateway
7. **Implement rate limiting** on API endpoints

## Backup and Recovery

1. **RDS Automated Backups**: 7-day retention configured
2. **Manual Snapshots**: Create before major updates
3. **S3 Versioning**: Enable on frontend bucket
4. **Database Exports**: Regular exports to S3

## Cost Optimization

1. Use **Reserved Instances** for RDS
2. Enable **S3 Intelligent Tiering**
3. Set up **Lambda cost alerts**
4. Use **CloudFront caching** effectively
5. Monitor with **AWS Cost Explorer**

## Troubleshooting

### Common Issues

1. **Cognito login fails**
   - Check User Pool configuration
   - Verify callback URLs match your domain
   - Check CORS settings

2. **Database connection errors**
   - Verify security group rules
   - Check VPC configuration
   - Ensure Lambda has VPC access

3. **Claude API errors**
   - Verify API key in Secrets Manager
   - Check rate limits
   - Monitor API usage

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS service health dashboard
3. Contact AWS support for infrastructure issues
4. Contact Anthropic support for Claude API issues