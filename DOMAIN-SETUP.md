# Domain Setup Guide for FitForge

You have two options for deploying FitForge with your custom domain:

## Option 1: Subdirectory (barani.org/fitforge) ✅ Your Choice

This deploys the app at `https://barani.org/fitforge`

### Prerequisites
1. You own `barani.org` domain
2. Domain is either:
   - Managed by Route 53 (easiest)
   - Or you can create CNAME records with your DNS provider

### Automatic Deployment (if using Route 53)
```bash
./deploy-custom-domain.sh
```

### Manual Setup (if NOT using Route 53)

1. **Deploy to AWS:**
```bash
# Deploy infrastructure
./deploy-secure.sh

# Note the CloudFront distribution domain
# Example: d1234567890.cloudfront.net
```

2. **Configure your DNS:**

If barani.org is with **Cloudflare**:
- Go to Cloudflare Dashboard
- Add CNAME: `barani.org` → `d1234567890.cloudfront.net`
- Set Proxy status: DNS only (gray cloud)
- SSL/TLS: Full

If barani.org is with **GoDaddy/Namecheap/Other**:
- Add CNAME record:
  - Name: `@` or `barani.org`
  - Value: `d1234567890.cloudfront.net`
  - TTL: 3600

3. **Configure CloudFront:**
- Go to AWS Console → CloudFront
- Edit your distribution
- Add Alternate Domain Name (CNAME): `barani.org`
- Request/Import SSL certificate for `barani.org`

## Option 2: Subdomain (fitforge.barani.org) - Simpler!

This deploys the app at `https://fitforge.barani.org`

### Why Subdomain is Easier:
- ✅ Simpler routing (no path rewriting)
- ✅ Cleaner configuration
- ✅ Works better with PWAs
- ✅ Easier to manage multiple apps

### Setup:
1. **Update configuration:**
```bash
./deploy-subdomain.sh
```

2. **Deploy:**
```bash
./deploy-secure.sh
```

3. **Add DNS Record:**
- Type: CNAME
- Name: `fitforge`
- Value: `d1234567890.cloudfront.net`
- TTL: 3600

## SSL Certificate Setup

### For Route 53 Users (Automatic):
The deployment script handles this automatically using AWS Certificate Manager.

### For External DNS:
1. **Request Certificate in ACM:**
```bash
aws acm request-certificate \
  --domain-name barani.org \
  --subject-alternative-names "*.barani.org" \
  --validation-method DNS \
  --region us-east-1  # Must be us-east-1 for CloudFront
```

2. **Validate Domain Ownership:**
- ACM will provide CNAME records
- Add these to your DNS provider
- Wait for validation (5-30 minutes)

3. **Attach to CloudFront:**
- Edit CloudFront distribution
- Select the validated certificate
- Save changes

## Testing Your Deployment

1. **Check DNS Propagation:**
```bash
# Check if DNS is resolving
nslookup barani.org
dig barani.org

# Check globally
# Visit: https://www.whatsmydns.net/#A/barani.org
```

2. **Test the App:**
- Visit: https://barani.org/fitforge (or your chosen setup)
- Should redirect to login
- Login with: igor@barani.org

3. **Troubleshooting:**

If you get "Access Denied":
- Check S3 bucket policy
- Verify CloudFront origin settings
- Check if files are in `/fitforge/` directory in S3

If you get "404 Not Found":
- Check CloudFront behaviors
- Verify index.html is in correct S3 path
- Check error pages configuration

If DNS doesn't resolve:
- Wait up to 48 hours for propagation
- Verify DNS records are correct
- Check TTL settings

## Quick Commands

### Update Frontend Only:
```bash
npm run build
aws s3 sync dist/ s3://your-bucket/fitforge/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/fitforge/*"
```

### Check CloudFront Status:
```bash
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID \
  --query "Distribution.Status"
```

### Update DNS Record (Route 53):
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://dns-change.json
```

## Cost Breakdown for Custom Domain

- **Route 53 Hosted Zone**: $0.50/month (if using Route 53)
- **ACM Certificate**: FREE
- **CloudFront**: FREE (1TB transfer free tier)
- **S3**: ~$0.01/month
- **Everything else**: Same as before

**Total Additional Cost**: $0.50/month (only if using Route 53)

## Security Best Practices

1. **Use CloudFront Security Headers:**
```javascript
// Add to CloudFront Lambda@Edge
exports.handler = (event, context, callback) => {
  const response = event.Records[0].cf.response;
  response.headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }];
  response.headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];
  callback(null, response);
};
```

2. **Enable AWS WAF** (optional, adds cost)

3. **Set up CloudWatch Alarms:**
- 4xx errors > 10/minute
- 5xx errors > 5/minute
- Origin latency > 1000ms

## Support

If you need help with domain setup:
1. Check CloudFront logs in CloudWatch
2. Verify S3 bucket permissions
3. Test with `curl -I https://barani.org/fitforge`
4. Check browser developer console for errors