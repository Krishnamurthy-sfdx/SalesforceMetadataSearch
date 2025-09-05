import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Default Salesforce OAuth endpoints
const DEFAULT_AUTH_HOST = 'https://login.salesforce.com';

// Generate redirect URI using custom scheme
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({
      scheme: 'http',
      path: 'oauth/callback'
    });
  } else {
    // For mobile, use custom scheme that matches app.json
    return AuthSession.makeRedirectUri({
      scheme: 'myapp', // This should match the scheme in app.json
      path: 'oauth/callback'
    });
  }
};

const SCOPES = ['api', 'refresh_token', 'openid', 'profile', 'email'];

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  issuedAt: number;
  expiresIn: number;
  authHost: string;
  instanceUrl: string;
  idToken?: string;
};

export type UserInfo = {
  id: string;
  username: string;
  email: string;
  orgName: string;
};

const TOKENS_KEY = 'salesforce_tokens_secure';
const OAUTH_CONFIG_KEY = 'salesforce_oauth_config_secure';

export interface OAuthConfig {
  clientId: string;
  instanceUrl?: string;
}

export async function saveOAuthConfig(config: OAuthConfig): Promise<void> {
  await SecureStore.setItemAsync(OAUTH_CONFIG_KEY, JSON.stringify(config));
}

export async function loadOAuthConfig(): Promise<OAuthConfig | null> {
  try {
    const stored = await SecureStore.getItemAsync(OAUTH_CONFIG_KEY);
    if (!stored) return null;
    
    // Check if the stored value looks like JSON
    if (!stored.startsWith('{') && !stored.startsWith('[')) {
      console.warn('Stored OAuth config does not appear to be JSON:', stored.substring(0, 50));
      await SecureStore.deleteItemAsync(OAUTH_CONFIG_KEY);
      return null;
    }
    
    try {
      const parsed = JSON.parse(stored);
      // Validate the parsed object has required properties
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      } else {
        console.warn('Parsed OAuth config is not a valid object');
        await SecureStore.deleteItemAsync(OAUTH_CONFIG_KEY);
        return null;
      }
    } catch (parseError) {
      console.error('Error parsing OAuth config JSON:', parseError);
      console.error('Stored value:', stored.substring(0, 100));
      // Clear corrupted data
      await SecureStore.deleteItemAsync(OAUTH_CONFIG_KEY);
      return null;
    }
  } catch (error) {
    console.error('Error loading OAuth config:', error);
    return null;
  }
}

export async function loginSalesforce(instanceUrl?: string): Promise<{ tokens: Tokens; userInfo: UserInfo }> {
  console.log('Starting PKCE OAuth flow');
  
  // Load OAuth configuration
  const oauthConfig = await loadOAuthConfig();
  if (!oauthConfig || !oauthConfig.clientId) {
    throw new Error('OAuth configuration not found. Please configure your Consumer Key first.');
  }

  // Use the configured instance URL or default to production
  const authHost = instanceUrl || oauthConfig.instanceUrl || DEFAULT_AUTH_HOST;
  console.log('Using auth host:', authHost);
  const redirectUri = getRedirectUri();
  
  console.log('Auth Host:', authHost);
  console.log('Redirect URI:', redirectUri);
  console.log('Client ID:', oauthConfig.clientId);

  // Create auth request with PKCE
  const request = new AuthSession.AuthRequest({
    clientId: oauthConfig.clientId,
    redirectUri,
    scopes: SCOPES,
    usePKCE: true, // This enables PKCE automatically
    extraParams: {
      prompt: 'login'
    }
  });

  // Update discovery endpoints to use the correct auth host
  const customDiscovery = {
    authorizationEndpoint: `${authHost}/services/oauth2/authorize`,
    tokenEndpoint: `${authHost}/services/oauth2/token`,
    revocationEndpoint: `${authHost}/services/oauth2/revoke`
  };

  // Load and validate params
  await request.makeAuthUrlAsync(customDiscovery);
  
  console.log('Opening auth session with URL:', request.url);

  // Open the auth screen
  const result = await request.promptAsync(customDiscovery);

  console.log('Auth session result:', result.type);

  if (result.type !== 'success' || !result.params?.code) {
    if (result.type === 'dismiss') {
      throw new Error('User cancelled authentication');
    }
    throw new Error('Authentication failed');
  }

  console.log('Authorization code received, exchanging for tokens...');

  // Exchange code for tokens with PKCE
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      code: result.params.code,
      clientId: oauthConfig.clientId,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier!,
      },
    },
    customDiscovery
  );

  console.log('Token exchange successful');

  // Extract instance URL from token response
  const responseInstanceUrl = (tokenResponse as any).params?.instance_url || (tokenResponse as any).instance_url;
  console.log('Token response instance URL:', responseInstanceUrl);
  
  // Use the provided instance URL or fall back to the response instance URL
  const finalInstanceUrl = instanceUrl || responseInstanceUrl || DEFAULT_AUTH_HOST;
  console.log('Final instance URL to use:', finalInstanceUrl);
  console.log('Response instance URL from token:', responseInstanceUrl);
  console.log('Provided instance URL:', instanceUrl);

  const tokens: Tokens = {
    accessToken: tokenResponse.accessToken!,
    refreshToken: tokenResponse.refreshToken!,
    idToken: tokenResponse.idToken,
    expiresIn: tokenResponse.expiresIn!,
    issuedAt: Date.now(),
    authHost,
    instanceUrl: finalInstanceUrl
  };

  // Get comprehensive user info including organization name
  const userInfo = await fetchUserInfo(finalInstanceUrl, tokenResponse.accessToken!);

  // Store tokens securely
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));

  return { tokens, userInfo };
}

export async function refreshSalesforceToken(): Promise<Tokens> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) throw new Error('Not authenticated');

  let existing: Tokens;
  try {
    existing = JSON.parse(raw);
  } catch (parseError) {
    console.error('Error parsing existing tokens JSON:', parseError);
    console.error('Raw value:', raw);
    // Clear corrupted data and throw error
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    throw new Error('Corrupted token data; please sign in again.');
  }
  const oauthConfig = await loadOAuthConfig();
  
  if (!oauthConfig) {
    throw new Error('OAuth configuration not found');
  }

  console.log('Refreshing access token...');

  const refreshBody = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: oauthConfig.clientId,
    refresh_token: existing.refreshToken
  }).toString();

  const resp = await fetch(`${existing.authHost}/services/oauth2/token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'Accept': 'application/json' 
    },
    body: refreshBody
  });

  if (!resp.ok) {
    // Tokens invalid → clear and bubble up
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    throw new Error('Refresh failed; please sign in again.');
  }

  const data = await resp.json();

  const updated: Tokens = {
    ...existing,
    accessToken: data.access_token,
    // Salesforce sometimes omits a new refresh_token; keep the old one
    refreshToken: data.refresh_token || existing.refreshToken,
    expiresIn: data.expires_in,
    issuedAt: Date.now(),
    instanceUrl: data.instance_url || existing.instanceUrl
  };

  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(updated));
  return updated;
}

export async function revokeSalesforceToken(): Promise<void> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return;
  
  let tokens: Tokens;
  try {
    tokens = JSON.parse(raw);
  } catch (parseError) {
    console.error('Error parsing tokens for revocation:', parseError);
    // Still clear the corrupted data
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    return;
  }
  
  const { accessToken, authHost } = tokens;

  // Revoke token on server
  try {
    await fetch(`${authHost}/services/oauth2/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: accessToken }).toString()
    });
  } catch (error) {
    console.warn('Failed to revoke token on server:', error);
  }

  // Clear local storage
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

export async function getStoredTokens(): Promise<Tokens | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKENS_KEY);
    if (!raw) return null;
    
    // Check if the stored value looks like JSON
    if (!raw.startsWith('{') && !raw.startsWith('[')) {
      console.warn('Stored tokens do not appear to be JSON:', raw.substring(0, 50));
      await SecureStore.deleteItemAsync(TOKENS_KEY);
      return null;
    }
    
    try {
      const parsed = JSON.parse(raw);
      // Validate the parsed object has required token properties
      if (typeof parsed === 'object' && parsed !== null && 
          typeof parsed.accessToken === 'string' && 
          typeof parsed.refreshToken === 'string') {
        return parsed;
      } else {
        console.warn('Parsed tokens object is missing required properties');
        await SecureStore.deleteItemAsync(TOKENS_KEY);
        return null;
      }
    } catch (parseError) {
      console.error('Error parsing tokens JSON:', parseError);
      console.error('Stored value:', raw.substring(0, 100));
      // Clear corrupted data
      await SecureStore.deleteItemAsync(TOKENS_KEY);
      return null;
    }
  } catch (error) {
    console.error('Error loading stored tokens:', error);
    return null;
  }
}

export function isTokenExpired(tokens: Tokens): boolean {
  const now = Date.now();
  const expiresAt = tokens.issuedAt + (tokens.expiresIn * 1000);
  // Add 5 minute buffer
  return now >= (expiresAt - 5 * 60 * 1000);
}

export async function fetchUserInfo(instanceUrl: string, accessToken: string): Promise<UserInfo> {
  try {
    console.log('Fetching user info from Salesforce...');
    console.log('Instance URL:', instanceUrl);
    console.log('Access Token present:', !!accessToken);
    
    // Validate inputs
    if (!instanceUrl || !accessToken) {
      throw new Error('Missing instanceUrl or accessToken');
    }
    
    // Clean instance URL
    const cleanInstanceUrl = instanceUrl.replace(/\/$/, '');
    
    // First, get user info from OAuth endpoint
    const userInfoUrl = `${cleanInstanceUrl}/services/oauth2/userinfo`;
    console.log('Fetching user info from:', userInfoUrl);
    
    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('User info response status:', userInfoResponse.status);
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info error response:', errorText);
      
      // Handle specific error cases
      if (userInfoResponse.status === 401 || userInfoResponse.status === 403) {
        throw new Error(`Failed to get user information: ${userInfoResponse.status}`);
      }
      
      throw new Error(`Failed to get user information: ${userInfoResponse.status} - ${errorText}`);
    }

    const userInfoData = await userInfoResponse.json();
    console.log('User info retrieved from OAuth endpoint:', {
      user_id: userInfoData.user_id,
      preferred_username: userInfoData.preferred_username,
      email: userInfoData.email,
      organization_id: userInfoData.organization_id
    });

    // Get organization name from the Organization object
    let orgName = userInfoData.organization_id || 'Unknown Organization'; // fallback to org ID
    
    try {
      const orgQuery = 'SELECT Name FROM Organization LIMIT 1';
      const orgUrl = `${cleanInstanceUrl}/services/data/v64.0/query/?q=${encodeURIComponent(orgQuery)}`;
      console.log('Fetching organization name from:', orgUrl);
      
      const orgResponse = await fetch(orgUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        if (orgData.records && orgData.records.length > 0 && orgData.records[0].Name) {
          orgName = orgData.records[0].Name;
          console.log('Organization name retrieved:', orgName);
        } else {
          console.log('No organization records found, using fallback');
        }
      } else {
        console.warn('Organization query failed with status:', orgResponse.status);
      }
    } catch (error) {
      console.warn('Failed to fetch organization name:', error);
    }

    const userInfo: UserInfo = {
      id: userInfoData.user_id || 'unknown',
      username: userInfoData.preferred_username || userInfoData.email || 'unknown',
      email: userInfoData.email || 'unknown',
      orgName: orgName,
    };

    console.log('User info processed successfully:', userInfo);
    return userInfo;
    
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}