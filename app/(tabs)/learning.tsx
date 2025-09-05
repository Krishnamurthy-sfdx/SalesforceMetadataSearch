import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  Lock,

  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Code,
  Database,
  Search,
  FileText,
  Layers,
  Zap,
  Smartphone,
  Cloud,
  Settings,
  Users,
  BookOpen,
  Info,
  Server,
  Network,
  Eye,
  RefreshCw,
  Activity,
  Hash,
  Shuffle,
  Send,
  Check,
} from 'lucide-react-native';

type SectionType = 'overview' | 'oauth' | 'apis' | 'pkce' | 'architecture' | 'features' | 'security' | 'troubleshooting';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
  auth: string;
  purpose: string;
  example?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    endpoint: '/services/oauth2/authorize',
    description: 'OAuth Authorization Endpoint',
    auth: 'Client ID + PKCE',
    purpose: 'Initiate OAuth flow with PKCE challenge',
    example: 'Used to redirect user to Salesforce login'
  },
  {
    method: 'POST',
    endpoint: '/services/oauth2/token',
    description: 'Token Exchange Endpoint',
    auth: 'Authorization Code + PKCE Verifier',
    purpose: 'Exchange authorization code for access token',
    example: 'Returns access_token, refresh_token, instance_url'
  },
  {
    method: 'POST',
    endpoint: '/services/oauth2/revoke',
    description: 'Token Revocation',
    auth: 'Access Token',
    purpose: 'Revoke access token on logout',
    example: 'Invalidates the token on Salesforce side'
  },
  {
    method: 'GET',
    endpoint: '/services/oauth2/userinfo',
    description: 'User Information',
    auth: 'Bearer Token',
    purpose: 'Get authenticated user details',
    example: 'Returns user_id, email, organization info'
  },
  {
    method: 'GET',
    endpoint: '/services/data/v64.0/sobjects/',
    description: 'List All Objects',
    auth: 'Bearer Token',
    purpose: 'Retrieve all Salesforce objects',
    example: 'Returns Account, Contact, Custom Objects, etc.'
  },
  {
    method: 'GET',
    endpoint: '/services/data/v64.0/sobjects/{object}/describe/',
    description: 'Object Metadata',
    auth: 'Bearer Token',
    purpose: 'Get fields and metadata for specific object',
    example: 'Returns field types, relationships, picklist values'
  },
  {
    method: 'GET',
    endpoint: '/services/data/v64.0/query/',
    description: 'SOQL Query',
    auth: 'Bearer Token',
    purpose: 'Execute SOQL queries on data',
    example: 'SELECT Id, Name FROM Account LIMIT 10'
  },
  {
    method: 'GET',
    endpoint: '/services/data/v64.0/search/',
    description: 'SOSL Search',
    auth: 'Bearer Token',
    purpose: 'Search across multiple objects',
    example: 'FIND {John} IN ALL FIELDS RETURNING Account, Contact'
  },
  {
    method: 'GET',
    endpoint: '/services/data/v64.0/tooling/query/',
    description: 'Tooling API Query',
    auth: 'Bearer Token',
    purpose: 'Query metadata like Apex, Flows, Components',
    example: 'Access ApexClass, Flow, ValidationRule metadata'
  },
  {
    method: 'POST',
    endpoint: '/services/oauth2/token (refresh)',
    description: 'Token Refresh',
    auth: 'Refresh Token + Client ID',
    purpose: 'Get new access token using refresh token',
    example: 'Extends session without user re-authentication'
  }
];

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return '#10B981'; // Green
    case 'POST': return '#3B82F6'; // Blue
    case 'PUT': return '#F59E0B'; // Orange
    case 'DELETE': return '#EF4444'; // Red
    case 'PATCH': return '#8B5CF6'; // Purple
    default: return '#6B7280'; // Gray
  }
};

const getMethodIcon = (method: string) => {
  switch (method) {
    case 'GET': return Database;
    case 'POST': return Zap;
    case 'PUT': return FileText;
    case 'DELETE': return AlertCircle;
    case 'PATCH': return Code;
    default: return Globe;
  }
};

export default function LearningScreen() {
  const [expandedSections, setExpandedSections] = useState<Set<SectionType>>(new Set(['overview']));
  const [expandedApis, setExpandedApis] = useState<Set<number>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'guide' | 'reference'>('guide');

  const toggleSection = (section: SectionType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleApi = (index: number) => {
    const newExpanded = new Set(expandedApis);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedApis(newExpanded);
  };

  const renderSection = (title: string, section: SectionType, icon: React.ComponentType<any>, children: React.ReactNode) => {
    const isExpanded = expandedSections.has(section);
    const IconComponent = icon;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection(section)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <IconComponent size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          {isExpanded ? (
            <ChevronDown size={20} color="#8E8E93" />
          ) : (
            <ChevronRight size={20} color="#8E8E93" />
          )}
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.sectionContent}>
            {children}
          </View>
        )}
      </View>
    );
  };

  const renderOAuthFlow = () => (
    <View>
      <Text style={styles.flowTitle}>OAuth 2.0 with PKCE Authorization Flow</Text>
      
      <View style={styles.flowStep}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Mobile App Generates PKCE Challenge</Text>
          <Text style={styles.stepDescription}>
            • App creates a random code_verifier (43-128 characters){'\n'}
            • Generates code_challenge = SHA256(code_verifier){'\n'}
            • Stores code_verifier securely in app memory
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>code_verifier: &quot;dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&quot;</Text>
            <Text style={styles.codeText}>code_challenge: &quot;E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&quot;</Text>
          </View>
        </View>
      </View>

      <View style={styles.flowStep}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Redirect to Salesforce Authorization</Text>
          <Text style={styles.stepDescription}>
            • App redirects user to Salesforce OAuth endpoint{'\n'}
            • Includes client_id, redirect_uri, code_challenge, and scopes{'\n'}
            • User authenticates with Salesforce credentials
          </Text>
          <View style={styles.urlBlock}>
            <Text style={styles.urlText}>/services/oauth2/authorize?</Text>
            <Text style={styles.urlParam}>client_id=YOUR_CLIENT_ID</Text>
            <Text style={styles.urlParam}>redirect_uri=myapp://oauth/callback</Text>
            <Text style={styles.urlParam}>code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</Text>
            <Text style={styles.urlParam}>code_challenge_method=S256</Text>
          </View>
        </View>
      </View>

      <View style={styles.flowStep}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>3</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Salesforce Returns Authorization Code</Text>
          <Text style={styles.stepDescription}>
            • After successful authentication, Salesforce redirects back{'\n'}
            • Includes authorization code in the callback URL{'\n'}
            • App intercepts the redirect and extracts the code
          </Text>
          <View style={styles.successBlock}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.successText}>myapp://oauth/callback?code=AUTHORIZATION_CODE</Text>
          </View>
        </View>
      </View>

      <View style={styles.flowStep}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>4</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Exchange Code for Access Token</Text>
          <Text style={styles.stepDescription}>
            • App sends POST request to token endpoint{'\n'}
            • Includes authorization code and original code_verifier{'\n'}
            • Salesforce validates the PKCE challenge and returns tokens
          </Text>
          <View style={styles.tokenBlock}>
            <Text style={styles.tokenTitle}>Response includes:</Text>
            <Text style={styles.tokenItem}>• access_token (for API calls)</Text>
            <Text style={styles.tokenItem}>• refresh_token (for token renewal)</Text>
            <Text style={styles.tokenItem}>• instance_url (Salesforce org URL)</Text>
            <Text style={styles.tokenItem}>• expires_in (token lifetime)</Text>
          </View>
        </View>
      </View>

      <View style={styles.flowStep}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>5</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Secure Token Storage & API Calls</Text>
          <Text style={styles.stepDescription}>
            • App stores tokens securely using Expo SecureStore{'\n'}
            • Uses access_token in Authorization header for API calls{'\n'}
            • Automatically refreshes tokens when they expire
          </Text>
          <View style={styles.apiCallBlock}>
            <Text style={styles.apiCallText}>Authorization: Bearer {'{access_token}'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPKCEExplanation = () => (
    <View>
      <Text style={styles.pkceTitle}>PKCE Flow: Mobile App ↔ Salesforce</Text>
      <Text style={styles.pkceSubtitle}>Detailed step-by-step authorization process</Text>
      
      <View style={styles.pkceFlowContainer}>
        {/* Step 1: Mobile App generates PKCE */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepActor}>
              <Smartphone size={16} color="#007AFF" />
              <Text style={styles.stepActorText}>Mobile App</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Generate PKCE Parameters</Text>
            <View style={styles.codeBlock}>
              <Hash size={16} color="#666" />
              <Text style={styles.codeText}>Code Verifier: Random 128-character string</Text>
            </View>
            <View style={styles.codeBlock}>
              <Shuffle size={16} color="#666" />
              <Text style={styles.codeText}>Code Challenge: SHA256(Code Verifier)</Text>
            </View>
            <Text style={styles.stepDescription}>
              The mobile app generates a cryptographically random code verifier and creates a SHA256 hash of it (the code challenge). The verifier is kept secret on the device.
            </Text>
          </View>
        </View>

        {/* Step 2: Mobile App → Salesforce */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepActor}>
              <Send size={16} color="#007AFF" />
              <Text style={styles.stepActorText}>Mobile App → Salesforce</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Authorization Request</Text>
            <View style={styles.requestBlock}>
              <Text style={styles.requestText}>GET /services/oauth2/authorize</Text>
            </View>
            <Text style={styles.paramText}>Parameters sent:</Text>
            <Text style={styles.paramItem}>• client_id: Your Connected App ID</Text>
            <Text style={styles.paramItem}>• redirect_uri: myapp://oauth/callback</Text>
            <Text style={styles.paramItem}>• code_challenge: {`{SHA256 hash}`}</Text>
            <Text style={styles.paramItem}>• code_challenge_method: S256</Text>
            <Text style={styles.paramItem}>• response_type: code</Text>
            <Text style={styles.paramItem}>• scope: api refresh_token openid</Text>
            <Text style={styles.stepDescription}>
              The app opens Salesforce login page in a browser with the code challenge (but NOT the verifier).
            </Text>
          </View>
        </View>

        {/* Step 3: Salesforce authenticates */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepActor}>
              <Server size={16} color="#00A1E0" />
              <Text style={styles.stepActorText}>Salesforce</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>User Authentication</Text>
            <View style={styles.serverBlock}>
              <Lock size={16} color="#00A1E0" />
              <Text style={styles.serverText}>Salesforce Login Page</Text>
            </View>
            <Text style={styles.stepDescription}>
              User enters credentials on Salesforce&apos;s secure login page. Salesforce validates the user and stores the code challenge temporarily.
            </Text>
          </View>
        </View>

        {/* Step 4: Salesforce → Mobile App */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepActor}>
              <ArrowRight size={16} color="#00A1E0" />
              <Text style={styles.stepActorText}>Salesforce → Mobile App</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Authorization Code</Text>
            <View style={styles.responseBlock}>
              <Text style={styles.responseText}>Redirect: myapp://oauth/callback?code=...</Text>
            </View>
            <Text style={styles.stepDescription}>
              After successful login, Salesforce redirects back to the mobile app with a temporary authorization code. This code is tied to the code challenge stored on Salesforce.
            </Text>
          </View>
        </View>

        {/* Step 5: Mobile App → Salesforce token exchange */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepActor}>
              <Send size={16} color="#007AFF" />
              <Text style={styles.stepActorText}>Mobile App → Salesforce</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Token Exchange</Text>
            <View style={styles.requestBlock}>
              <Text style={styles.requestText}>POST /services/oauth2/token</Text>
            </View>
            <Text style={styles.paramText}>Parameters sent:</Text>
            <Text style={styles.paramItem}>• grant_type: authorization_code</Text>
            <Text style={styles.paramItem}>• code: {`{authorization code}`}</Text>
            <Text style={styles.paramItem}>• client_id: Your Connected App ID</Text>
            <Text style={styles.paramItem}>• redirect_uri: myapp://oauth/callback</Text>
            <Text style={styles.paramItem}>• code_verifier: {`{original 128-char string}`}</Text>
            <Text style={styles.stepDescription}>
              The app sends the authorization code AND the original code verifier (not the challenge) to exchange for tokens.
            </Text>
          </View>
        </View>

        {/* Step 6: Salesforce verification */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>6</Text>
            </View>
            <View style={styles.stepActor}>
              <Server size={16} color="#00A1E0" />
              <Text style={styles.stepActorText}>Salesforce Verification Process</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>PKCE Challenge-Verifier Matching</Text>
            
            <View style={styles.verificationSteps}>
              <Text style={styles.verificationTitle}>How Salesforce Validates the Request:</Text>
              
              <View style={styles.verificationStep}>
                <View style={styles.verificationNumber}>
                  <Text style={styles.verificationNumberText}>1</Text>
                </View>
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationStepTitle}>Retrieve Stored Challenge</Text>
                  <Text style={styles.verificationDesc}>
                    Salesforce looks up the code_challenge that was stored when the authorization request was made (from Step 2).
                  </Text>
                </View>
              </View>
              
              <View style={styles.verificationStep}>
                <View style={styles.verificationNumber}>
                  <Text style={styles.verificationNumberText}>2</Text>
                </View>
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationStepTitle}>Hash the Received Verifier</Text>
                  <Text style={styles.verificationDesc}>
                    Salesforce takes the code_verifier sent by the mobile app and applies SHA256 hashing to it.
                  </Text>
                  <View style={styles.hashingBlock}>
                    <Hash size={14} color="#00A1E0" />
                    <Text style={styles.hashingText}>computed_challenge = SHA256(received_code_verifier)</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.verificationStep}>
                <View style={styles.verificationNumber}>
                  <Text style={styles.verificationNumberText}>3</Text>
                </View>
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationStepTitle}>Compare Challenges</Text>
                  <Text style={styles.verificationDesc}>
                    Salesforce compares the computed challenge with the stored challenge from Step 2.
                  </Text>
                  <View style={styles.comparisonBlock}>
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Stored (Step 2):</Text>
                      <Text style={styles.comparisonValue}>E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</Text>
                    </View>
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Computed (Step 6):</Text>
                      <Text style={styles.comparisonValue}>E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM</Text>
                    </View>
                    <View style={styles.matchIndicator}>
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={styles.matchText}>✓ MATCH - Request is authentic!</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.verificationStep}>
                <View style={styles.verificationNumber}>
                  <Text style={styles.verificationNumberText}>4</Text>
                </View>
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationStepTitle}>Issue Tokens</Text>
                  <Text style={styles.verificationDesc}>
                    Since the challenges match, Salesforce confirms the request came from the same mobile app that initiated the flow. It then issues the access and refresh tokens.
                  </Text>
                  <View style={styles.tokenIssuanceBlock}>
                    <Check size={16} color="#10B981" />
                    <Text style={styles.tokenIssuanceText}>Tokens issued successfully!</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.securityExplanation}>
              <Shield size={18} color="#007AFF" />
              <View style={styles.securityExplanationContent}>
                <Text style={styles.securityExplanationTitle}>Why This is Secure</Text>
                <Text style={styles.securityExplanationDesc}>
                  Even if an attacker intercepts the authorization code, they cannot use it because:
                  {"\n"}• They don&apos;t have the original code_verifier (it never left the mobile app)
                  {"\n"}• They cannot reverse-engineer the verifier from the challenge (SHA256 is one-way)
                  {"\n"}• Without the correct verifier, their computed challenge won&apos;t match Salesforce&apos;s stored challenge
                  {"\n"}• The authorization code becomes useless without the matching verifier
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Step 7: Mobile App stores tokens */}
        <View style={styles.pkceStep}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>7</Text>
            </View>
            <View style={styles.stepActor}>
              <Smartphone size={16} color="#007AFF" />
              <Text style={styles.stepActorText}>Mobile App</Text>
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Secure Token Storage</Text>
            <View style={styles.storageBlock}>
              <Lock size={16} color="#007AFF" />
              <Text style={styles.storageText}>Tokens stored in Expo SecureStore</Text>
            </View>
            <Text style={styles.stepDescription}>
              The mobile app securely stores the access and refresh tokens using device-level encryption. The app can now make authenticated API calls to Salesforce.
            </Text>
          </View>
        </View>

        {/* Enhanced Security Note */}
        <View style={styles.securityNoteBox}>
          <Shield size={20} color="#007AFF" />
          <View style={styles.securityNoteContent}>
            <Text style={styles.securityNoteTitle}>PKCE Security Deep Dive</Text>
            <Text style={styles.securityNoteDesc}>
              PKCE (Proof Key for Code Exchange) solves the &quot;authorization code interception attack&quot; problem in mobile apps:
            </Text>
            
            <View style={styles.securityPoints}>
              <View style={styles.securityPoint}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.securityPointText}>
                  <Text style={styles.securityPointBold}>No Client Secret:</Text> Mobile apps can&apos;t securely store secrets, so PKCE eliminates the need for one.
                </Text>
              </View>
              
              <View style={styles.securityPoint}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.securityPointText}>
                  <Text style={styles.securityPointBold}>Dynamic Proof:</Text> Each authorization flow uses a unique verifier/challenge pair.
                </Text>
              </View>
              
              <View style={styles.securityPoint}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.securityPointText}>
                  <Text style={styles.securityPointBold}>Cryptographic Security:</Text> SHA256 hashing ensures the challenge cannot be reversed to get the verifier.
                </Text>
              </View>
              
              <View style={styles.securityPoint}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.securityPointText}>
                  <Text style={styles.securityPointBold}>Interception Protection:</Text> Even if authorization codes are intercepted, they&apos;re useless without the verifier.
                </Text>
              </View>
            </View>
            
            <View style={styles.attackScenario}>
              <AlertCircle size={16} color="#F59E0B" />
              <View style={styles.attackScenarioContent}>
                <Text style={styles.attackScenarioTitle}>Attack Scenario (Prevented by PKCE):</Text>
                <Text style={styles.attackScenarioDesc}>
                  1. Attacker intercepts authorization code from redirect URL{"\n"}
                  2. Attacker tries to exchange code for tokens{"\n"}
                  3. ❌ Fails because they don&apos;t have the code_verifier{"\n"}
                  4. ✅ Only the legitimate mobile app can complete the exchange
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderApiEndpoint = (api: ApiEndpoint, index: number) => {
    const isExpanded = expandedApis.has(index);
    const methodColor = getMethodColor(api.method);
    const MethodIcon = getMethodIcon(api.method);
    
    return (
      <View key={index} style={styles.apiCard}>
        <TouchableOpacity 
          style={styles.apiHeader} 
          onPress={() => toggleApi(index)}
          activeOpacity={0.7}
        >
          <View style={styles.apiHeaderLeft}>
            <View style={[styles.methodBadge, { backgroundColor: methodColor }]}>
              <MethodIcon size={14} color="white" />
              <Text style={styles.methodText}>{api.method}</Text>
            </View>
            <View style={styles.apiInfo}>
              <Text style={styles.apiEndpoint}>{api.endpoint}</Text>
              <Text style={styles.apiDescription}>{api.description}</Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronDown size={16} color="#8E8E93" />
          ) : (
            <ChevronRight size={16} color="#8E8E93" />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.apiDetails}>
            <View style={styles.apiDetailRow}>
              <Text style={styles.apiDetailLabel}>Authorization:</Text>
              <Text style={styles.apiDetailValue}>{api.auth}</Text>
            </View>
            <View style={styles.apiDetailRow}>
              <Text style={styles.apiDetailLabel}>Purpose:</Text>
              <Text style={styles.apiDetailValue}>{api.purpose}</Text>
            </View>
            {api.example && (
              <View style={styles.apiDetailRow}>
                <Text style={styles.apiDetailLabel}>Example:</Text>
                <Text style={styles.apiDetailValue}>{api.example}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderOverview = () => (
    <View>
      <Text style={styles.overviewTitle}>Salesforce Mobile Explorer</Text>
      <Text style={styles.overviewDescription}>
        A production-ready React Native application that provides comprehensive access to Salesforce metadata, 
        objects, and development tools. Built with modern mobile development practices and enterprise-grade security.
      </Text>
      
      <View style={styles.highlightGrid}>
        <View style={styles.highlightCard}>
          <Smartphone size={28} color="#007AFF" />
          <Text style={styles.highlightTitle}>Cross-Platform</Text>
          <Text style={styles.highlightDesc}>iOS, Android & Web support with React Native</Text>
        </View>
        <View style={styles.highlightCard}>
          <Shield size={28} color="#10B981" />
          <Text style={styles.highlightTitle}>Enterprise Security</Text>
          <Text style={styles.highlightDesc}>OAuth 2.0 + PKCE authentication</Text>
        </View>
        <View style={styles.highlightCard}>
          <Database size={28} color="#F59E0B" />
          <Text style={styles.highlightTitle}>Full API Access</Text>
          <Text style={styles.highlightDesc}>REST, Tooling & Metadata APIs</Text>
        </View>
        <View style={styles.highlightCard}>
          <Search size={28} color="#8B5CF6" />
          <Text style={styles.highlightTitle}>Advanced Search</Text>
          <Text style={styles.highlightDesc}>Deep code & metadata search</Text>
        </View>
      </View>

      <View style={styles.techStack}>
        <Text style={styles.techStackTitle}>Technology Stack</Text>
        <View style={styles.techGrid}>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Frontend</Text>
            <Text style={styles.techValue}>React Native + Expo</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Language</Text>
            <Text style={styles.techValue}>TypeScript</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Navigation</Text>
            <Text style={styles.techValue}>Expo Router</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Security</Text>
            <Text style={styles.techValue}>Expo SecureStore</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>API</Text>
            <Text style={styles.techValue}>Salesforce REST v64.0</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Auth</Text>
            <Text style={styles.techValue}>OAuth 2.0 + PKCE</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderArchitecture = () => (
    <View>
      <Text style={styles.architectureTitle}>System Architecture</Text>
      
      <View style={styles.architectureDiagram}>
        <View style={styles.layerCard}>
          <View style={styles.layerHeader}>
            <Smartphone size={20} color="#007AFF" />
            <Text style={styles.layerTitle}>Mobile Application Layer</Text>
          </View>
          <View style={styles.layerContent}>
            <Text style={styles.layerItem}>• React Native + Expo Framework</Text>
            <Text style={styles.layerItem}>• TypeScript for type safety</Text>
            <Text style={styles.layerItem}>• Expo Router for navigation</Text>
            <Text style={styles.layerItem}>• Cross-platform compatibility (iOS/Android/Web)</Text>
          </View>
        </View>

        <View style={styles.layerCard}>
          <View style={styles.layerHeader}>
            <Shield size={20} color="#10B981" />
            <Text style={styles.layerTitle}>Authentication & Security Layer</Text>
          </View>
          <View style={styles.layerContent}>
            <Text style={styles.layerItem}>• OAuth 2.0 Authorization Code Flow</Text>
            <Text style={styles.layerItem}>• PKCE (Proof Key for Code Exchange)</Text>
            <Text style={styles.layerItem}>• Secure token storage (Expo SecureStore)</Text>
            <Text style={styles.layerItem}>• Automatic token refresh</Text>
          </View>
        </View>

        <View style={styles.layerCard}>
          <View style={styles.layerHeader}>
            <Network size={20} color="#F59E0B" />
            <Text style={styles.layerTitle}>API Integration Layer</Text>
          </View>
          <View style={styles.layerContent}>
            <Text style={styles.layerItem}>• Salesforce REST API v64.0</Text>
            <Text style={styles.layerItem}>• Tooling API for metadata</Text>
            <Text style={styles.layerItem}>• SOQL/SOSL query execution</Text>
            <Text style={styles.layerItem}>• Error handling & retry logic</Text>
          </View>
        </View>

        <View style={styles.layerCard}>
          <View style={styles.layerHeader}>
            <Cloud size={20} color="#8B5CF6" />
            <Text style={styles.layerTitle}>Salesforce Platform</Text>
          </View>
          <View style={styles.layerContent}>
            <Text style={styles.layerItem}>• Connected App configuration</Text>
            <Text style={styles.layerItem}>• Object & field metadata</Text>
            <Text style={styles.layerItem}>• Apex classes & triggers</Text>
            <Text style={styles.layerItem}>• Flows & validation rules</Text>
          </View>
        </View>
      </View>

      <View style={styles.dataFlow}>
        <Text style={styles.dataFlowTitle}>Data Flow Architecture</Text>
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Users size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.flowText}>User initiates action</Text>
          <ArrowRight size={16} color="#8E8E93" />
        </View>
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Lock size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.flowText}>OAuth token validation</Text>
          <ArrowRight size={16} color="#8E8E93" />
        </View>
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Server size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.flowText}>API request to Salesforce</Text>
          <ArrowRight size={16} color="#8E8E93" />
        </View>
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}>
            <Database size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.flowText}>Data processing & display</Text>
        </View>
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View>
      <Text style={styles.featuresTitle}>Core Features & Capabilities</Text>
      
      <View style={styles.featureSection}>
        <View style={styles.featureSectionHeader}>
          <Search size={20} color="#007AFF" />
          <Text style={styles.featureSectionTitle}>Metadata Search & Discovery</Text>
        </View>
        <Text style={styles.featureDescription}>
          Advanced search capabilities across all Salesforce metadata types including Apex classes, 
          triggers, flows, validation rules, and Lightning components.
        </Text>
        <View style={styles.featureDetails}>
          <Text style={styles.featureDetail}>• Full-text search in Apex code</Text>
          <Text style={styles.featureDetail}>• Flow XML metadata parsing</Text>
          <Text style={styles.featureDetail}>• SOSL and Tooling API integration</Text>
          <Text style={styles.featureDetail}>• Real-time search results</Text>
        </View>
      </View>

      <View style={styles.featureSection}>
        <View style={styles.featureSectionHeader}>
          <Database size={20} color="#10B981" />
          <Text style={styles.featureSectionTitle}>Object & Field Explorer</Text>
        </View>
        <Text style={styles.featureDescription}>
          Comprehensive object browser with detailed field information, relationships, 
          and metadata analysis.
        </Text>
        <View style={styles.featureDetails}>
          <Text style={styles.featureDetail}>• All standard and custom objects</Text>
          <Text style={styles.featureDetail}>• Field types and relationships</Text>
          <Text style={styles.featureDetail}>• Picklist values and validation rules</Text>
          <Text style={styles.featureDetail}>• Field usage analysis</Text>
        </View>
      </View>

      <View style={styles.featureSection}>
        <View style={styles.featureSectionHeader}>
          <FileText size={20} color="#F59E0B" />
          <Text style={styles.featureSectionTitle}>Data Export & Analysis</Text>
        </View>
        <Text style={styles.featureDescription}>
          Export capabilities for object metadata, field definitions, and relationship mappings.
        </Text>
        <View style={styles.featureDetails}>
          <Text style={styles.featureDetail}>• CSV export functionality</Text>
          <Text style={styles.featureDetail}>• Metadata documentation</Text>
          <Text style={styles.featureDetail}>• Field relationship mapping</Text>
          <Text style={styles.featureDetail}>• Custom object analysis</Text>
        </View>
      </View>

      <View style={styles.featureSection}>
        <View style={styles.featureSectionHeader}>
          <Settings size={20} color="#8B5CF6" />
          <Text style={styles.featureSectionTitle}>AI-Powered Assistant</Text>
        </View>
        <Text style={styles.featureDescription}>
          Intelligent assistant that can answer questions about your Salesforce org structure, 
          relationships, and metadata.
        </Text>
        <View style={styles.featureDetails}>
          <Text style={styles.featureDetail}>• Natural language queries</Text>
          <Text style={styles.featureDetail}>• Contextual metadata understanding</Text>
          <Text style={styles.featureDetail}>• Relationship explanations</Text>
          <Text style={styles.featureDetail}>• Best practice recommendations</Text>
        </View>
      </View>
    </View>
  );

  const renderSecurity = () => (
    <View>
      <Text style={styles.securityTitle}>Security Implementation</Text>
      
      <View style={styles.securitySection}>
        <View style={styles.securityHeader}>
          <Shield size={20} color="#10B981" />
          <Text style={styles.securitySectionTitle}>Authentication Security</Text>
        </View>
        <View style={styles.securityDetails}>
          <Text style={styles.securityDetail}>✓ OAuth 2.0 Authorization Code Flow</Text>
          <Text style={styles.securityDetail}>✓ PKCE prevents code interception attacks</Text>
          <Text style={styles.securityDetail}>✓ No client secrets stored in mobile app</Text>
          <Text style={styles.securityDetail}>✓ Secure redirect URI validation</Text>
        </View>
      </View>

      <View style={styles.securitySection}>
        <View style={styles.securityHeader}>
          <Lock size={20} color="#F59E0B" />
          <Text style={styles.securitySectionTitle}>Token Management</Text>
        </View>
        <View style={styles.securityDetails}>
          <Text style={styles.securityDetail}>✓ Tokens stored in Expo SecureStore</Text>
          <Text style={styles.securityDetail}>✓ Automatic token refresh</Text>
          <Text style={styles.securityDetail}>✓ Token expiration handling</Text>
          <Text style={styles.securityDetail}>✓ Secure token revocation on logout</Text>
        </View>
      </View>

      <View style={styles.securitySection}>
        <View style={styles.securityHeader}>
          <Eye size={20} color="#8B5CF6" />
          <Text style={styles.securitySectionTitle}>Data Protection</Text>
        </View>
        <View style={styles.securityDetails}>
          <Text style={styles.securityDetail}>✓ HTTPS-only communication</Text>
          <Text style={styles.securityDetail}>✓ No sensitive data in logs</Text>
          <Text style={styles.securityDetail}>✓ Proper error handling</Text>
          <Text style={styles.securityDetail}>✓ Session timeout management</Text>
        </View>
      </View>

      <View style={styles.bestPractices}>
        <Text style={styles.bestPracticesTitle}>Security Best Practices</Text>
        <View style={styles.practiceItem}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.practiceText}>Always validate SSL certificates</Text>
        </View>
        <View style={styles.practiceItem}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.practiceText}>Implement proper session management</Text>
        </View>
        <View style={styles.practiceItem}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.practiceText}>Use secure storage for sensitive data</Text>
        </View>
        <View style={styles.practiceItem}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.practiceText}>Handle token refresh gracefully</Text>
        </View>
      </View>
    </View>
  );

  const renderTroubleshooting = () => (
    <View>
      <Text style={styles.troubleshootingTitle}>Common Issues & Solutions</Text>
      
      <View style={styles.troubleItem}>
        <View style={styles.troubleHeader}>
          <AlertCircle size={18} color="#EF4444" />
          <Text style={styles.troubleTitle}>Authentication Failed</Text>
        </View>
        <Text style={styles.troubleDescription}>
          User sees &quot;Authentication failed&quot; or &quot;Invalid client&quot; error.
        </Text>
        <View style={styles.troubleSolutions}>
          <Text style={styles.solutionTitle}>Solutions:</Text>
          <Text style={styles.solutionItem}>• Verify Consumer Key in OAuth configuration</Text>
          <Text style={styles.solutionItem}>• Check redirect URI matches Connected App</Text>
          <Text style={styles.solutionItem}>• Ensure Connected App is enabled</Text>
          <Text style={styles.solutionItem}>• Verify user has proper permissions</Text>
        </View>
      </View>

      <View style={styles.troubleItem}>
        <View style={styles.troubleHeader}>
          <RefreshCw size={18} color="#F59E0B" />
          <Text style={styles.troubleTitle}>Token Refresh Issues</Text>
        </View>
        <Text style={styles.troubleDescription}>
          App shows &quot;Session expired&quot; or fails to refresh tokens automatically.
        </Text>
        <View style={styles.troubleSolutions}>
          <Text style={styles.solutionTitle}>Solutions:</Text>
          <Text style={styles.solutionItem}>• Check refresh token validity</Text>
          <Text style={styles.solutionItem}>• Verify Connected App refresh token policy</Text>
          <Text style={styles.solutionItem}>• Clear stored tokens and re-authenticate</Text>
          <Text style={styles.solutionItem}>• Check network connectivity</Text>
        </View>
      </View>

      <View style={styles.troubleItem}>
        <View style={styles.troubleHeader}>
          <Network size={18} color="#8B5CF6" />
          <Text style={styles.troubleTitle}>API Request Failures</Text>
        </View>
        <Text style={styles.troubleDescription}>
          Metadata or object requests fail with various error codes.
        </Text>
        <View style={styles.troubleSolutions}>
          <Text style={styles.solutionTitle}>Solutions:</Text>
          <Text style={styles.solutionItem}>• Verify user has API access</Text>
          <Text style={styles.solutionItem}>• Check object-level permissions</Text>
          <Text style={styles.solutionItem}>• Validate instance URL format</Text>
          <Text style={styles.solutionItem}>• Review API version compatibility</Text>
        </View>
      </View>

      <View style={styles.debuggingTips}>
        <Text style={styles.debuggingTitle}>Debugging Tips</Text>
        <View style={styles.debugItem}>
          <Code size={16} color="#007AFF" />
          <Text style={styles.debugText}>Enable console logging for detailed error information</Text>
        </View>
        <View style={styles.debugItem}>
          <Activity size={16} color="#007AFF" />
          <Text style={styles.debugText}>Monitor network requests in development tools</Text>
        </View>
        <View style={styles.debugItem}>
          <FileText size={16} color="#007AFF" />
          <Text style={styles.debugText}>Check Salesforce setup audit trail for configuration issues</Text>
        </View>
      </View>
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'guide' && styles.activeTab]}
        onPress={() => setSelectedTab('guide')}
        activeOpacity={0.7}
      >
        <BookOpen size={18} color={selectedTab === 'guide' ? '#FFFFFF' : '#8E8E93'} />
        <Text style={[styles.tabText, selectedTab === 'guide' && styles.activeTabText]}>Guide</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'reference' && styles.activeTab]}
        onPress={() => setSelectedTab('reference')}
        activeOpacity={0.7}
      >
        <Code size={18} color={selectedTab === 'reference' ? '#FFFFFF' : '#8E8E93'} />
        <Text style={[styles.tabText, selectedTab === 'reference' && styles.activeTabText]}>API Reference</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGuideContent = () => (
    <>
      {renderSection('App Overview', 'overview', Info, renderOverview())}
      {renderSection('OAuth 2.0 Authorization Flow', 'oauth', Lock, renderOAuthFlow())}
      {renderSection('PKCE Security', 'pkce', Shield, renderPKCEExplanation())}
      {renderSection('Application Architecture', 'architecture', Layers, renderArchitecture())}
      {renderSection('Key Features', 'features', Activity, renderFeatures())}
      {renderSection('Security & Best Practices', 'security', Shield, renderSecurity())}
      {renderSection('Troubleshooting', 'troubleshooting', AlertCircle, renderTroubleshooting())}
    </>
  );

  const renderReferenceContent = () => (
    <>
      {renderSection('API Endpoints', 'apis', Globe, (
        <View>
          <Text style={styles.apiIntro}>
            This app uses the following Salesforce API endpoints. Click on each endpoint to see detailed information about authentication, parameters, and responses.
          </Text>
          {API_ENDPOINTS.map((api, index) => renderApiEndpoint(api, index))}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Center</Text>
        <Text style={styles.headerSubtitle}>Complete guide to Salesforce mobile app development</Text>
        {renderTabSelector()}
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedTab === 'guide' ? renderGuideContent() : renderReferenceContent()}
        
        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <Info size={20} color="#007AFF" />
            <View style={styles.footerContent}>
              <Text style={styles.footerTitle}>Need Help?</Text>
              <Text style={styles.footerText}>
                This documentation covers the complete implementation of a production-ready Salesforce mobile application with OAuth 2.0 + PKCE authentication.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  flowStep: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  urlBlock: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  urlText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  urlParam: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#3B82F6',
    marginLeft: 8,
    marginBottom: 2,
  },
  successBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  tokenBlock: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tokenTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tokenItem: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: 4,
  },
  apiCallBlock: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
  },
  apiCallText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#374151',
  },
  pkceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  pkceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  pkceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  pkceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginTop: 16,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  // PKCE Flow Styles
  pkceFlowContainer: {
    marginTop: 16,
  },
  pkceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  pkceStep: {
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepActor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  stepActorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  requestBlock: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  requestText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  responseBlock: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
  },
  paramText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paramItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 8,
  },
  serverBlock: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00A1E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverText: {
    fontSize: 13,
    color: '#075985',
    fontWeight: '600',
    marginLeft: 8,
  },
  verifyBlock: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  storageBlock: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
    marginLeft: 8,
  },
  securityNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 16,
  },
  securityNoteContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  securityNoteDesc: {
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
  apiIntro: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  apiCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  apiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  apiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 60,
  },
  methodText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  apiInfo: {
    flex: 1,
  },
  apiEndpoint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  apiDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  apiDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  apiDetailRow: {
    marginBottom: 8,
  },
  apiDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  apiDetailValue: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  architectureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  archSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  archSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  archDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Tab Selector Styles
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  // Overview Styles
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 12,
    textAlign: 'center',
  },
  overviewDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  highlightCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  highlightDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  techStack: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  techStackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
    textAlign: 'center',
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  techItem: {
    width: '48%',
    marginBottom: 12,
  },
  techLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  techValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  // Architecture Styles
  architectureDiagram: {
    marginBottom: 24,
  },
  layerCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  layerContent: {
    padding: 16,
  },
  layerItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  dataFlow: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dataFlowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
    textAlign: 'center',
  },
  flowIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flowText: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '500',
    flex: 1,
  },
  // Features Styles
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureSection: {
    marginBottom: 24,
  },
  featureSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  featureDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  featureDetails: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  featureDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  // Security Styles
  securityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  securitySection: {
    marginBottom: 20,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  securityDetails: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  securityDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  bestPractices: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  bestPracticesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  practiceText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
  },
  // Troubleshooting Styles
  troubleshootingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  troubleItem: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  troubleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  troubleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  troubleDescription: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 12,
    lineHeight: 20,
  },
  troubleSolutions: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  solutionItem: {
    fontSize: 13,
    color: '#7F1D1D',
    marginBottom: 4,
    lineHeight: 18,
  },
  debuggingTips: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  debuggingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  debugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  // Footer Styles
  footerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  footerContent: {
    flex: 1,
    marginLeft: 12,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  // Verification Styles
  verificationSteps: {
    marginTop: 16,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  verificationStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  verificationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00A1E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  verificationNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  verificationContent: {
    flex: 1,
  },
  verificationStepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 6,
  },
  verificationDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  hashingBlock: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00A1E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashingText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#075985',
    marginLeft: 8,
    flex: 1,
  },
  comparisonBlock: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comparisonItem: {
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  comparisonValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  tokenIssuanceBlock: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIssuanceText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
    marginLeft: 8,
  },
  securityExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  securityExplanationContent: {
    flex: 1,
    marginLeft: 10,
  },
  securityExplanationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  securityExplanationDesc: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  securityPoints: {
    marginTop: 12,
  },
  securityPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  securityPointText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  securityPointBold: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  attackScenario: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  attackScenarioContent: {
    flex: 1,
    marginLeft: 8,
  },
  attackScenarioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  attackScenarioDesc: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
});