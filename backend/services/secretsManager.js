import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

let cachedSecrets = null;
let cacheExpiry = null;

/**
 * Retrieve secrets from AWS Secrets Manager with caching
 * Cache expires after 1 hour to allow for secret rotation
 */
export async function getSecrets() {
  // Check if we have valid cached secrets
  if (cachedSecrets && cacheExpiry && new Date() < cacheExpiry) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'fitforge-secrets',
      VersionStage: 'AWSCURRENT'
    });

    const response = await client.send(command);
    
    // Parse the secret string
    const secrets = JSON.parse(response.SecretString);
    
    // Cache the secrets for 1 hour
    cachedSecrets = secrets;
    cacheExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    return secrets;
  } catch (error) {
    console.error('Error retrieving secrets from AWS Secrets Manager:', error);
    
    // Fall back to environment variables if Secrets Manager fails
    // This allows local development without AWS
    if (process.env.CLAUDE_API_KEY) {
      console.log('Using environment variable fallback for API key');
      return {
        claudeApiKey: process.env.CLAUDE_API_KEY
      };
    }
    
    throw new Error('Unable to retrieve API keys');
  }
}

/**
 * Get the Claude API key specifically
 */
export async function getClaudeApiKey() {
  const secrets = await getSecrets();
  
  if (!secrets.claudeApiKey) {
    throw new Error('Claude API key not found in secrets');
  }
  
  return secrets.claudeApiKey;
}

/**
 * Clear the cache (useful for testing or after secret rotation)
 */
export function clearSecretsCache() {
  cachedSecrets = null;
  cacheExpiry = null;
}