// AWS Configuration for FitForge
// Copy this file to aws-config.js and fill in your values
// DO NOT COMMIT aws-config.js TO GIT

export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX',  // Your User Pool ID
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXX',  // Your App Client ID
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
      },
    }
  },
  API: {
    endpoint: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com'  // Your API endpoint
  }
};