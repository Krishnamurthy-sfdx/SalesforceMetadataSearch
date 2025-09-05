import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Save, Info } from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';

interface OAuthConfig {
  clientId: string;
  instanceUrl: string;
}

export default function OAuthConfigScreen() {
  const { saveOAuthConfig, loadOAuthConfig } = useAuth();
  const [config, setConfig] = useState<OAuthConfig>({
    clientId: '',
    instanceUrl: 'https://login.salesforce.com',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const stored = await loadOAuthConfig();
      if (stored) {
        setConfig({
          clientId: stored.clientId,
          instanceUrl: stored.instanceUrl || 'https://login.salesforce.com',
        });
      }
    } catch (error) {
      console.error('Error loading OAuth config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadOAuthConfig]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = async () => {
    if (!config.clientId.trim()) {
      Alert.alert('Error', 'Consumer Key is required');
      return;
    }

    if (!config.instanceUrl.trim()) {
      Alert.alert('Error', 'Instance URL is required');
      return;
    }

    setIsSaving(true);
    try {
      await saveOAuthConfig(config);
      Alert.alert(
        'Success',
        'OAuth configuration saved successfully! You can now login to Salesforce from the Settings screen.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving OAuth config:', error);
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const showHelp = () => {
    Alert.alert(
      'OAuth Configuration Help',
      'To get your Consumer Key:\n\n' +
      '1. Go to Setup in your Salesforce org\n' +
      '2. Search for "App Manager"\n' +
      '3. Click "New Connected App"\n' +
      '4. Fill in basic information\n' +
      '5. Enable OAuth Settings\n' +
      '6. Add this callback URL:\n' +
      '   • myapp://oauth/callback\n' +
      '7. Select OAuth Scopes: api, refresh_token, openid\n' +
      '8. Enable PKCE (uncheck "Require Secret for Web Server Flow")\n' +
      '9. Save and get Consumer Key (no secret needed)',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'OAuth Configuration' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'OAuth Configuration',
          headerRight: () => (
            <TouchableOpacity onPress={showHelp} style={styles.helpButton}>
              <Info size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Salesforce Connected App</Text>
            <Text style={styles.infoText}>
              You need to create a Connected App in your Salesforce org to get the Consumer Key. This app uses PKCE for security, so no Consumer Secret is required.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Consumer Key *</Text>
              <TextInput
                style={styles.input}
                value={config.clientId}
                onChangeText={(text) => setConfig(prev => ({ ...prev, clientId: text }))}
                placeholder="Enter your Consumer Key"
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                textAlignVertical="top"
              />
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instance URL *</Text>
              <TextInput
                style={styles.input}
                value={config.instanceUrl}
                onChangeText={(text) => setConfig(prev => ({ ...prev, instanceUrl: text }))}
                placeholder="https://login.salesforce.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.helperText}>
                Use https://login.salesforce.com for production or https://test.salesforce.com for sandbox
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={saveConfig}
            disabled={isSaving}
          >
            <Save size={20} color="white" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  helpButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 48,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveIcon: {
    marginRight: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});