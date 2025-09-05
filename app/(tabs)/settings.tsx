import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { LogOut, User, Server, Info, RefreshCw, Settings2, Key, ChevronRight, ExternalLink, UserCircle, Globe, Building, RotateCcw } from "lucide-react-native";
import { useAuth } from "@/providers/auth-provider";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OAuthConfig {
  clientId: string;
  instanceUrl?: string;
}

export default function SettingsScreen() {
  const { userInfo, instanceUrl, logout, clearCache, login, reauthorize, isAuthenticated, loadOAuthConfig: loadAuthConfig } = useAuth();
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

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

  useEffect(() => {
    loadOAuthConfig();
  }, [loadOAuthConfig]);

  // Refresh OAuth config when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOAuthConfig();
    }, [loadOAuthConfig])
  );

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached metadata. You'll need to reload data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearCache();
            Alert.alert("Success", "Cache cleared successfully");
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Reset App Data",
      "This will clear ALL app data including OAuth configuration, tokens, and cache. You'll need to reconfigure the app. Use this if you're experiencing persistent issues.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All Data",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all AsyncStorage and SecureStore data
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              const SecureStore = await import('expo-secure-store');
              
              await AsyncStorage.clear();
              
              // Clear specific SecureStore keys
              try {
                await SecureStore.deleteItemAsync('salesforce_tokens_secure');
              } catch (e) { /* ignore */ }
              try {
                await SecureStore.deleteItemAsync('salesforce_oauth_config_secure');
              } catch (e) { /* ignore */ }
              
              Alert.alert(
                "Data Reset Complete", 
                "All app data has been cleared. The app will restart.",
                [{
                  text: "OK",
                  onPress: () => {
                    router.replace('/login');
                  }
                }]
              );
            } catch (error) {
              console.error('Error clearing all data:', error);
              Alert.alert('Error', 'Failed to clear all data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOAuthConfig = () => {
    router.push('/oauth-config');
  };

  const handleSalesforceLogin = async () => {
    if (!oauthConfig) {
      Alert.alert('Error', 'Please configure OAuth settings first');
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await login(oauthConfig.instanceUrl);
      if (success) {
        Alert.alert('Success', 'Successfully logged into Salesforce!');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already handled in the login function with Alert
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleReauthorize = async () => {
    setIsReauthorizing(true);
    try {
      const success = await reauthorize();
      if (success) {
        Alert.alert('Success', 'Successfully re-authorized with Salesforce!');
      }
    } catch (error) {
      console.error('Re-authorization failed:', error);
      // Error is already handled in the reauthorize function with Alert
    } finally {
      setIsReauthorizing(false);
    }
  };

  const isOAuthConfigured = oauthConfig && oauthConfig.clientId;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <UserCircle size={22} color="#1B96FF" />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Username</Text>
              <Text style={styles.cardValue}>{userInfo?.username || "N/A"}</Text>
            </View>
          </View>
          
          <View style={[styles.cardRow, styles.cardRowBorder]}>
            <Globe size={22} color="#1B96FF" />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Instance</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {instanceUrl || "N/A"}
              </Text>
            </View>
          </View>
          
          <View style={[styles.cardRow, styles.cardRowBorder]}>
            <Building size={22} color="#1B96FF" />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Organization</Text>
              <Text style={styles.cardValue}>{userInfo?.orgName || "N/A"}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.cardRow}
            onPress={handleOAuthConfig}
          >
            <Key size={22} color="#1B96FF" />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>OAuth Configuration</Text>
              <Text style={styles.cardDescription}>
                {isLoadingConfig ? 'Loading...' : 
                 isOAuthConfigured ? 'OAuth configured ✓' : 
                 'Configure Consumer Key for Salesforce connection'}
              </Text>
            </View>
            <ChevronRight size={20} color="#706E6B" />
          </TouchableOpacity>
          
          {isOAuthConfigured && !isAuthenticated && (
            <TouchableOpacity 
              style={[styles.cardRow, styles.cardRowBorder, isLoggingIn && styles.cardRowDisabled]}
              onPress={handleSalesforceLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator size={22} color="#1B96FF" />
              ) : (
                <ExternalLink size={22} color="#1B96FF" />
              )}
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, isLoggingIn && styles.disabledText]}>Login to Salesforce</Text>
                <Text style={[styles.cardDescription, isLoggingIn && styles.disabledText]}>
                  {isLoggingIn ? 'Connecting to Salesforce...' : 'Authenticate with your Salesforce org'}
                </Text>
              </View>
              {!isLoggingIn && <ChevronRight size={20} color="#706E6B" />}
            </TouchableOpacity>
          )}
          
          {isOAuthConfigured && isAuthenticated && (
            <TouchableOpacity 
              style={[styles.cardRow, styles.cardRowBorder, isReauthorizing && styles.cardRowDisabled]}
              onPress={handleReauthorize}
              disabled={isReauthorizing}
            >
              {isReauthorizing ? (
                <ActivityIndicator size={22} color="#1B96FF" />
              ) : (
                <RotateCcw size={22} color="#1B96FF" />
              )}
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, isReauthorizing && styles.disabledText]}>Re-authorize</Text>
                <Text style={[styles.cardDescription, isReauthorizing && styles.disabledText]}>
                  {isReauthorizing ? 'Re-authorizing with Salesforce...' : 'Refresh your Salesforce connection'}
                </Text>
              </View>
              {!isReauthorizing && <ChevronRight size={20} color="#706E6B" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardRow} onPress={handleClearCache}>
            <RefreshCw size={22} color="#1B96FF" />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Clear Cache</Text>
              <Text style={styles.cardDescription}>Clear cached metadata and force reload</Text>
            </View>
            <ChevronRight size={20} color="#706E6B" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cardRow, styles.cardRowBorder]} 
            onPress={handleClearAllData}
          >
            <RefreshCw size={22} color="#C23934" />
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: '#C23934' }]}>Reset App Data</Text>
              <Text style={styles.cardDescription}>Clear all data and logout (use if experiencing issues)</Text>
            </View>
            <ChevronRight size={20} color="#706E6B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={22} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Salesforce Metadata Search</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  header: {
    backgroundColor: "#1B96FF",
    padding: 24,
    paddingTop: 64,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#747474",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  cardRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardLabel: {
    fontSize: 13,
    color: "#747474",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardValue: {
    fontSize: 17,
    color: "#16325C",
    fontWeight: "600",
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 15,
    color: "#747474",
    marginTop: 4,
    fontWeight: "500",
    lineHeight: 20,
  },
  cardHint: {
    fontSize: 12,
    color: "#1B96FF",
    marginTop: 6,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  actionText: {
    fontSize: 17,
    color: "#16325C",
    marginLeft: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C23934",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#C23934",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 17,
    color: "#FFFFFF",
    marginLeft: 12,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    padding: 24,
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    color: "#747474",
    marginBottom: 6,
    fontWeight: "500",
  },
  versionText: {
    fontSize: 13,
    color: "#747474",
    fontWeight: "500",
  },
  cardRowDisabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: "#999",
  },
});