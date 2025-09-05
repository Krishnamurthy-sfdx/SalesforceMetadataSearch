import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cloud, Lock, Settings, User, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";

import { useAuth } from "@/providers/auth-provider";

interface OAuthConfig {
  clientId: string;
  instanceUrl?: string;
}

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const { login, isAuthenticated, isLoading: authLoading, loadOAuthConfig: loadAuthConfig } = useAuth();

  const loadOAuthConfig = useCallback(async () => {
    try {
      const config = await loadAuthConfig();
      setOauthConfig(config);
    } catch (error) {
      console.error('Error loading OAuth config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [loadAuthConfig]);

  // Load OAuth config on mount
  useEffect(() => {
    loadOAuthConfig();
  }, [loadOAuthConfig]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('Login screen: User already authenticated, redirecting to tabs');
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, authLoading]);

  const handleLogin = async () => {
    if (!oauthConfig) {
      Alert.alert('Configuration Required', 'Please configure OAuth settings first by going to Settings.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(oauthConfig?.instanceUrl);
      if (success) {
        console.log('Login successful - redirecting to tabs');
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || "An unexpected error occurred during login";
      
      // Don't show alert for timeout or cancellation errors
      if (!errorMessage.includes('timeout') && !errorMessage.includes('cancel')) {
        Alert.alert("Login Error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSettings = () => {
    router.push('/(tabs)/settings');
  };

  const isOAuthConfigured = oauthConfig && oauthConfig.clientId;
  const canLogin = isOAuthConfigured;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Cloud size={48} color="#0176D3" />
            </View>
            <Text style={styles.title}>Salesforce Metadata Search</Text>
            <Text style={styles.subtitle}>
              Connect to your Salesforce org to explore metadata
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.credentialsSection}>
              <View style={styles.credentialsHeader}>
                <User size={20} color={isOAuthConfigured ? "#10B981" : "#F59E0B"} />
                <Text style={styles.credentialsTitle}>Salesforce Connection</Text>
              </View>
              
              <View style={styles.credentialsInputs}>
                {isLoadingConfig ? (
                  <Text style={styles.instructionText}>Loading configuration...</Text>
                ) : isOAuthConfigured ? (
                  <>
                    <Text style={styles.successText}>
                      ✅ OAuth Configuration Found
                    </Text>
                    <Text style={styles.instructionText}>
                      Instance URL: {oauthConfig?.instanceUrl || 'Not configured'}
                    </Text>
                    <Text style={styles.instructionText}>
                      Consumer Key: {oauthConfig?.clientId.substring(0, 20)}...
                    </Text>
                    <Text style={styles.demoSuggestionText}>
                      🚀 Ready to connect to your Salesforce org!
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.warningText}>
                      ⚠️ OAuth Setup Required
                    </Text>
                    <Text style={styles.instructionText}>
                      You need to configure your Consumer Key to connect to Salesforce.
                    </Text>
                    <TouchableOpacity style={styles.settingsButton} onPress={handleGoToSettings}>
                      <Settings size={16} color="#FFFFFF" />
                      <Text style={styles.settingsButtonText}>Go to Settings</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {isOAuthConfigured && (
              <View style={styles.domainSection}>
                <Text style={styles.label}>Salesforce Instance</Text>
                <View style={styles.domainDisplay}>
                  <Text style={styles.domainText}>{oauthConfig?.instanceUrl || 'Not configured'}</Text>
                </View>
                <Text style={styles.hint}>
                  Configured in Settings
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton, 
                (isLoading || !canLogin) && styles.loginButtonDisabled,
                isOAuthConfigured && styles.loginButtonSuccess
              ]}
              onPress={handleLogin}
              disabled={isLoading || !canLogin}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Lock size={20} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>
                    Connect to Salesforce
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {!isOAuthConfigured && (
              <View style={styles.warningNote}>
                <Text style={styles.warningNoteText}>
                  🚧 OAuth configuration required. Please go to Settings to configure your Consumer Key.
                </Text>
              </View>
            )}
            


            <View style={styles.securityNote}>
              <Text style={styles.securityText}>
                🚀 Uses OAuth 2.0 PKCE for secure Salesforce authentication.
              </Text>
              <Text style={styles.securityText}>
                🛡️ Your credentials are never stored in the app - only secure tokens.
              </Text>
              <Text style={styles.securityText}>
                ⚙️ All authentication happens through Salesforce&apos;s secure infrastructure.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#080707",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#706E6B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#080707",
    marginBottom: 8,
  },
  instanceButtons: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  instanceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  instanceButtonActive: {
    backgroundColor: "#0176D3",
    borderColor: "#0176D3",
  },
  instanceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#706E6B",
  },
  instanceButtonTextActive: {
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: "#706E6B",
    marginBottom: 20,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0176D3",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  securityNote: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#706E6B",
    lineHeight: 18,
  },
  demoNotice: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0176D3",
    alignItems: "center",
  },
  demoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0176D3",
    marginBottom: 4,
  },
  demoSubtext: {
    fontSize: 12,
    color: "#0176D3",
    textAlign: "center",
  },
  liveNotice: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
    alignItems: "center",
  },
  liveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 4,
  },
  liveSubtext: {
    fontSize: 12,
    color: "#10B981",
    textAlign: "center",
  },
  demoModeSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  demoModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  demoModeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#080707",
    flex: 1,
    marginLeft: 8,
  },
  demoModeDescription: {
    fontSize: 14,
    color: "#706E6B",
    lineHeight: 20,
  },
  credentialsSection: {
    marginBottom: 20,
  },
  credentialsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#080707",
    marginLeft: 8,
  },
  credentialsInputs: {
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#706E6B",
    lineHeight: 20,
    marginBottom: 4,
  },
  warningText: {
    fontWeight: "600",
    color: "#F59E0B",
  },
  demoSuggestionText: {
    fontWeight: "600",
    color: "#0176D3",
  },
  successText: {
    fontWeight: "600",
    color: "#10B981",
  },
  loginButtonSuccess: {
    backgroundColor: "#10B981",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0176D3",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 12,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  warningNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  warningNoteText: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
    textAlign: "center",
  },
  errorNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 11,
    color: "#DC2626",
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  successNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  successNoteText: {
    fontSize: 12,
    color: "#065F46",
    lineHeight: 18,
    textAlign: "center",
  },
  demoModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#0176D3",
    borderRadius: 6,
    alignItems: "center",
  },
  demoModeButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  domainSection: {
    marginBottom: 20,
  },
  domainDisplay: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  domainText: {
    fontSize: 14,
    color: "#0176D3",
    fontWeight: "600",
    textAlign: "center",
  },
  codeText: {
    fontSize: 13,
    color: "#0176D3",
    fontWeight: "600",
    backgroundColor: "#F0F9FF",
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    textAlign: "center",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});