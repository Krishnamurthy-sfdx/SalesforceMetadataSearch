import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

import {
  loginSalesforce,
  refreshSalesforceToken,
  revokeSalesforceToken,
  getStoredTokens,
  isTokenExpired,
  saveOAuthConfig as saveSecureOAuthConfig,
  loadOAuthConfig as loadSecureOAuthConfig,
  fetchUserInfo,
} from "@/services/auth";
import { TokenExpiredError } from "@/services/salesforce";

// Complete the auth session on web
WebBrowser.maybeCompleteAuthSession();

interface UserInfo {
  id: string;
  username: string;
  email: string;
  orgName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  instanceUrl: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    instanceUrl: null,
    userInfo: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const loadStoredAuth = useCallback(async () => {
    try {
      console.log('Auth Provider: Loading stored authentication...');
      // Check SecureStore for real tokens
      const tokens = await getStoredTokens();
      if (tokens) {
        console.log('Auth Provider: Found stored tokens');
        // Check if token is expired
        if (isTokenExpired(tokens)) {
          console.log('Token expired, attempting refresh...');
          try {
            const refreshedTokens = await refreshSalesforceToken();
            // Fetch user info after token refresh
            let userInfo: UserInfo | null = null;
            try {
              userInfo = await fetchUserInfo(refreshedTokens.instanceUrl, refreshedTokens.accessToken);
            } catch (error) {
              console.warn('Failed to fetch user info after token refresh:', error);
              // If still failing after refresh, clear tokens
              console.log('User info still failing after refresh, clearing tokens');
              await revokeSalesforceToken(); // Clear stored tokens
              setAuthState({
                accessToken: null,
                refreshToken: null,
                instanceUrl: null,
                userInfo: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
            
            setAuthState({
              accessToken: refreshedTokens.accessToken,
              refreshToken: refreshedTokens.refreshToken,
              instanceUrl: refreshedTokens.instanceUrl,
              userInfo,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear invalid tokens
            await revokeSalesforceToken();
            setAuthState({
              accessToken: null,
              refreshToken: null,
              instanceUrl: null,
              userInfo: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          // Fetch user info with existing valid tokens
          let userInfo: UserInfo | null = null;
          try {
            userInfo = await fetchUserInfo(tokens.instanceUrl, tokens.accessToken);
          } catch (error) {
            console.warn('Failed to fetch user info with existing tokens:', error);
            // If user info fetch fails with 403, the token might be invalid
            if (error instanceof Error && error.message.includes('403')) {
              console.log('Token appears invalid (403), attempting refresh...');
              try {
                const refreshedTokens = await refreshSalesforceToken();
                userInfo = await fetchUserInfo(refreshedTokens.instanceUrl, refreshedTokens.accessToken);
                setAuthState({
                  accessToken: refreshedTokens.accessToken,
                  refreshToken: refreshedTokens.refreshToken,
                  instanceUrl: refreshedTokens.instanceUrl,
                  userInfo,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } catch (refreshError) {
                console.error('Token refresh after 403 failed:', refreshError);
                // Clear invalid tokens and set as unauthenticated
                await revokeSalesforceToken(); // Clear stored tokens
                setAuthState({
                  accessToken: null,
                  refreshToken: null,
                  instanceUrl: null,
                  userInfo: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
                return;
              }
            } else {
              // For other errors, still clear tokens to be safe
              console.log('User info fetch failed with non-403 error, clearing tokens');
              await revokeSalesforceToken();
              setAuthState({
                accessToken: null,
                refreshToken: null,
                instanceUrl: null,
                userInfo: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
          }
          
          setAuthState({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            instanceUrl: tokens.instanceUrl,
            userInfo,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        console.log('Auth Provider: No stored tokens found');
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Auth Provider: Error loading auth:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);



  const logout = useCallback(async () => {
    try {
      // Revoke tokens from Salesforce
      await revokeSalesforceToken();
      
      setAuthState({
        accessToken: null,
        refreshToken: null,
        instanceUrl: null,
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);



  const login = useCallback(async (instanceUrl?: string): Promise<boolean> => {
    try {
      console.log('Starting login process');
      console.log('Instance URL provided:', instanceUrl);
      
      // Use secure OAuth flow
      console.log('Starting secure OAuth 2.0 PKCE flow');
      
      // Use the configured instance URL or default to production
      const targetInstanceUrl = instanceUrl || 'https://login.salesforce.com';
      console.log('Target instance URL:', targetInstanceUrl);
      
      const { tokens, userInfo } = await loginSalesforce(targetInstanceUrl);
      
      console.log('Login successful, tokens received');
      console.log('Final instance URL from tokens:', tokens.instanceUrl);
      
      const newAuthState = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        instanceUrl: tokens.instanceUrl,
        userInfo: {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          orgName: userInfo.orgName,
        },
        isAuthenticated: true,
        isLoading: false,
      };
      
      setAuthState(newAuthState);
      return true;
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      const alertMessage = `Unable to connect to Salesforce:\n\n${errorMessage}\n\n` +
        'This might be because:\n' +
        '• OAuth Connected App is not configured\n' +
        '• Consumer Key is incorrect\n' +
        '• Redirect URIs do not match\n\n' +
        'Please check your OAuth configuration.';
      
      Alert.alert('Login Failed', alertMessage, [{ text: 'OK' }]);
      
      throw error;
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith("cache_"));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Clear cache error:", error);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      // Clear all stored data including tokens and OAuth config
      await revokeSalesforceToken();
      await AsyncStorage.clear();
      
      setAuthState({
        accessToken: null,
        refreshToken: null,
        instanceUrl: null,
        userInfo: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Clear all data error:", error);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      console.log('Refreshing access token...');
      const refreshedTokens = await refreshSalesforceToken();
      
      // Fetch user info after token refresh
      let userInfo: UserInfo | null = null;
      try {
        userInfo = await fetchUserInfo(refreshedTokens.instanceUrl, refreshedTokens.accessToken);
      } catch (error) {
        console.warn('Failed to fetch user info after manual token refresh:', error);
      }
      
      const updatedAuthState = {
        ...authState,
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
        instanceUrl: refreshedTokens.instanceUrl,
        userInfo,
      };
      
      setAuthState(updatedAuthState);
      
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [authState, logout]);

  const reauthorize = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Starting re-authorization process...');
      
      // Load OAuth config
      const oauthConfig = await loadSecureOAuthConfig();
      if (!oauthConfig || !oauthConfig.clientId) {
        Alert.alert('Error', 'OAuth configuration not found. Please configure your Consumer Key first.');
        return false;
      }
      
      // Use the existing instance URL or the configured one
      const targetInstanceUrl = authState.instanceUrl || oauthConfig.instanceUrl || 'https://login.salesforce.com';
      
      const { tokens, userInfo } = await loginSalesforce(targetInstanceUrl);
      
      console.log('Re-authorization successful');
      
      const newAuthState = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        instanceUrl: tokens.instanceUrl,
        userInfo: {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          orgName: userInfo.orgName,
        },
        isAuthenticated: true,
        isLoading: false,
      };
      
      setAuthState(newAuthState);
      return true;
      
    } catch (error) {
      console.error('Re-authorization error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Re-authorization Failed', `Unable to re-authorize with Salesforce:\n\n${errorMessage}`);
      
      return false;
    }
  }, [authState.instanceUrl]);

  const handleTokenExpiredError = useCallback(async (error: Error): Promise<boolean> => {
    if (error instanceof TokenExpiredError) {
      console.log('Token expired, attempting automatic re-authorization...');
      
      try {
        // First try to refresh the token
        await refreshAccessToken();
        return true;
      } catch {
        console.log('Token refresh failed, prompting for re-authorization');
        
        return new Promise((resolve) => {
          Alert.alert(
            'Session Expired',
            'Your Salesforce session has expired. Would you like to re-authorize?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  logout();
                  resolve(false);
                },
              },
              {
                text: 'Re-authorize',
                onPress: async () => {
                  const success = await reauthorize();
                  resolve(success);
                },
              },
            ]
          );
        });
      }
    }
    return false;
  }, [refreshAccessToken, reauthorize, logout]);

  // OAuth configuration methods
  const saveOAuthConfig = useCallback(async (config: { clientId: string; instanceUrl?: string }) => {
    try {
      await saveSecureOAuthConfig(config);
    } catch (error) {
      console.error('Error saving OAuth config:', error);
      throw error;
    }
  }, []);

  const loadOAuthConfig = useCallback(async () => {
    try {
      return await loadSecureOAuthConfig();
    } catch (error) {
      console.error('Error loading OAuth config:', error);
      return null;
    }
  }, []);

  // Wrapper function for API calls that handles token expiration
  const withTokenHandling = useCallback(async (apiCall: () => Promise<any>): Promise<any> => {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        const success = await handleTokenExpiredError(error);
        if (success) {
          // Retry the API call with the new token
          return await apiCall();
        }
      }
      throw error;
    }
  }, [handleTokenExpiredError]);

  const contextValue = useMemo(() => ({
    ...authState,
    login,
    logout,
    clearCache,
    refreshAccessToken,
    reauthorize,
    handleTokenExpiredError,
    withTokenHandling,
    saveOAuthConfig,
    loadOAuthConfig,
  }), [authState, login, logout, clearCache, refreshAccessToken, reauthorize, handleTokenExpiredError, withTokenHandling, saveOAuthConfig, loadOAuthConfig]);

  return contextValue;
});