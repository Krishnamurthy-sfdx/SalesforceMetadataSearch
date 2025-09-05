# Salesforce Metadata Explorer

A production-ready React Native mobile application built with Expo that enables users to search and explore Salesforce metadata across any Salesforce organization. This app provides secure OAuth authentication and comprehensive metadata browsing capabilities for administrators, developers, and analysts.

## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Query + @nkzw/create-context-hook
- **Authentication**: OAuth 2.0 PKCE flow with Expo Auth Session
- **Storage**: Expo Secure Store for tokens, AsyncStorage for cache
- **UI Components**: Custom components with Lucide React Native icons
- **Platform Support**: iOS, Android, and Web (React Native Web)

### Project Structure

```
app/
├── _layout.tsx                 # Root layout with providers
├── index.tsx                   # App entry point
├── login.tsx                   # Login screen
├── oauth-config.tsx            # OAuth configuration modal
├── (tabs)/                     # Tab-based navigation
│   ├── _layout.tsx            # Tab layout configuration
│   ├── search.tsx             # Metadata search screen
│   ├── export.tsx             # Data export functionality
│   ├── settings.tsx           # App settings
│   ├── oauth-education.tsx    # OAuth setup guide
│   └── (objects)/             # Object-related screens
│       ├── _layout.tsx        # Objects stack layout
│       ├── list.tsx           # Objects list
│       ├── [objectName].tsx   # Object details
│       ├── field-details.tsx  # Field details
│       ├── metadata-reference.tsx # Metadata references
│       ├── picklist-values.tsx    # Picklist values
│       └── standard-values.tsx    # Standard field values
providers/
├── auth-provider.tsx          # Authentication context
services/
├── auth.ts                    # OAuth authentication service
├── salesforce.ts              # Salesforce API service
types/
├── salesforce.ts              # TypeScript type definitions
constants/
├── standard-field-values.ts   # Standard field configurations
```

## 🔐 OAuth 2.0 PKCE Authentication Flow

### Configuration

- **OAuth Flow**: PKCE (Proof Key for Code Exchange) - secure for mobile apps
- **Scopes**: `api`, `refresh_token`, `openid`, `profile`, `email`
- **Redirect URI**: `myapp://oauth/callback` (mobile), `http://localhost/oauth/callback` (web)
- **Storage**: Tokens stored securely in Expo Secure Store

### Authentication Process

1. **Configuration**: User enters Consumer Key and Instance URL
2. **Authorization**: App redirects to Salesforce login page
3. **Code Exchange**: Authorization code exchanged for access/refresh tokens
4. **Token Storage**: Tokens stored securely with expiration tracking
5. **Auto-Refresh**: Automatic token refresh when expired
6. **User Info**: Fetch user profile and organization details

### Token Management

```typescript
interface Tokens {
  accessToken: string;
  refreshToken: string;
  issuedAt: number; // Timestamp when token was issued
  expiresIn: number; // Token lifetime in seconds
  authHost: string; // Salesforce instance URL
  instanceUrl: string; // API endpoint URL
  idToken?: string; // OpenID Connect token
}
```

### Token Expiry Handling

- **Expiry Check**: Tokens expire after `expiresIn` seconds with 5-minute buffer
- **Auto-Refresh**: Automatic refresh when token is expired
- **Error Handling**: Graceful handling of refresh failures with re-authentication prompts
- **Session Management**: Clear invalid tokens and prompt for re-login

## 📡 Salesforce API Integration

### API Endpoints Used

- **Objects**: `/services/data/v64.0/sobjects/` - List all objects
- **Fields**: `/services/data/v64.0/sobjects/{object}/describe/` - Object field metadata
- **Tooling API**: `/services/data/v64.0/tooling/query/` - Metadata queries
- **Search**: `/services/data/v64.0/search/` - SOSL searches
- **User Info**: `/services/oauth2/userinfo` - User profile data
- **Organization**: `/services/data/v64.0/query/` - Organization details

### Supported Metadata Types

1. **Standard Objects**: Account, Contact, Opportunity, etc.
2. **Custom Objects**: User-defined objects (ending with `__c`)
3. **Fields**: All field types including custom fields
4. **Apex Classes**: Server-side code components
5. **Apex Triggers**: Database trigger code
6. **Flows**: Process automation workflows
7. **Validation Rules**: Data validation logic
8. **Record Types**: Object record categorization
9. **Page Layouts**: UI layout definitions
10. **Aura Components**: Lightning component bundles
11. **Lightning Web Components**: Modern component framework

### Search Capabilities

- **Code Content Search**: Full-text search within Apex classes and triggers
- **SOSL Integration**: Salesforce Object Search Language queries
- **Metadata References**: Find where fields are referenced across metadata
- **Line-by-Line Results**: Show exact line numbers and code snippets
- **Multi-Type Search**: Search across multiple metadata types simultaneously

## 🔍 Search Architecture

### Search Flow

1. **Input Validation**: Minimum 2 characters required
2. **Parallel Execution**: Multiple search types run concurrently
3. **Content Analysis**: Line-by-line code analysis with regex matching
4. **Result Aggregation**: Combine results from different metadata types
5. **Relevance Sorting**: Sort by match count and alphabetical order

### Search Implementation

```typescript
// Main search function
export async function searchCodeContent(
  instanceUrl: string,
  accessToken: string,
  searchTerm: string
): Promise<CodeSearchResult[]>;

// Search types executed in parallel:
// 1. Apex Classes - body content search
// 2. Apex Triggers - body content search
// 3. Flows - name and label search
// 4. SOSL - broad metadata search
```

### Performance Optimizations

- **Timeout Handling**: 10-second timeout per search type
- **Result Limiting**: Maximum 50 results per search type
- **Concurrent Execution**: Parallel Promise execution
- **Error Isolation**: Individual search failures don't break entire search
- **Caching**: Results cached for improved performance

## 🗄️ State Management

### Authentication State

```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  instanceUrl: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Context Providers

- **AuthProvider**: Global authentication state and methods
- **QueryClient**: React Query for server state management
- **GestureHandler**: Touch gesture handling

### Data Flow

1. **Authentication**: OAuth tokens managed in AuthProvider
2. **API Calls**: React Query mutations for server requests
3. **Local Storage**: Secure token storage and cache management
4. **Error Handling**: Token expiration and network error recovery

## 🎨 UI/UX Design

### Design System

- **Color Palette**: Salesforce Lightning Design System inspired
- **Typography**: System fonts with proper weight hierarchy
- **Icons**: Lucide React Native icon library
- **Layout**: Tab-based navigation with stack navigation
- **Responsive**: Adaptive design for different screen sizes

### Navigation Structure

```
Root Stack
├── Tabs (Main App)
│   ├── Objects Tab
│   │   ├── Objects List
│   │   ├── Object Details
│   │   ├── Field Details
│   │   └── Metadata References
│   ├── Search Tab
│   ├── Export Tab
│   ├── OAuth Education Tab
│   └── Settings Tab
├── Login Screen (Modal)
└── OAuth Config (Modal)
```

### Key UI Components

- **Search Interface**: Real-time search with highlighted results
- **Metadata Cards**: Organized display of metadata information
- **Code Snippets**: Syntax-highlighted code with line numbers
- **Loading States**: Proper loading indicators and error states
- **Tab Bar**: Custom-styled bottom navigation

## 🔧 Configuration & Setup

### Required Salesforce Setup

1. **Connected App Creation**:

   - Go to Setup → App Manager → New Connected App
   - Enable OAuth Settings
   - Add Callback URL: `myapp://oauth/callback`
   - Select Scopes: `api`, `refresh_token`, `openid`, `profile`, `email`
   - Enable PKCE (uncheck "Require Secret for Web Server Flow")
   - Set IP Relaxation to "Relax IP restrictions"

2. **Consumer Key**: Copy the Consumer Key (no secret needed for PKCE)

3. **Instance URL**: Configure for your Salesforce environment
   - Production: `https://login.salesforce.com`
   - Sandbox: `https://test.salesforce.com`
   - Custom Domain: `https://yourdomain.my.salesforce.com`

### App Configuration

1. **Launch the app** and go to Settings → OAuth Configuration
2. **Enter Consumer Key** from your Connected App
3. **Set Instance URL** for your Salesforce environment
4. **Save configuration** and return to login
5. **Authenticate** with your Salesforce credentials

### Security & Privacy

- **No hardcoded credentials**: All authentication details configured by user
- **Secure token storage**: OAuth tokens stored in device secure storage
- **No data collection**: App doesn't collect or transmit personal data
- **Local processing**: All metadata analysis happens on device
- **Salesforce APIs only**: Communicates exclusively with Salesforce APIs

### Production Deployment

This app is designed to be production-ready:

- No hardcoded instance URLs or organization-specific data
- Configurable OAuth settings for any Salesforce org
- Secure authentication flow with automatic token refresh
- Cross-platform compatibility (iOS, Android, Web)
- Comprehensive error handling and user feedback

## 🚀 Deployment & Platform Support

### Platform Compatibility

- **iOS**: Full native support with proper safe area handling
- **Android**: Full native support with material design elements
- **Web**: React Native Web compatibility with fallbacks for unsupported APIs

### Web Compatibility Considerations

- **Expo APIs**: Limited web support for some Expo modules
- **Secure Store**: Falls back to localStorage on web
- **Haptics**: Disabled on web platform
- **Navigation**: Proper URL routing for web

### Build Configuration

```json
{
  "expo": {
    "name": "Salesforce Metadata Search",
    "scheme": "myapp",
    "platforms": ["ios", "android", "web"],
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

## 🔒 Security Features

### Data Protection

- **Secure Token Storage**: Expo Secure Store for sensitive data
- **PKCE Flow**: Secure OAuth without client secrets
- **Token Expiration**: Automatic token refresh and cleanup
- **Error Handling**: Secure error messages without exposing sensitive data

### API Security

- **HTTPS Only**: All API calls use HTTPS
- **Token Validation**: Server-side token validation
- **Scope Limitation**: Minimal required OAuth scopes
- **Session Management**: Proper session cleanup on logout

## 📊 Error Handling & Monitoring

### Error Types

1. **Authentication Errors**: Token expiration, invalid credentials
2. **Network Errors**: Connection timeouts, API failures
3. **Data Errors**: Invalid responses, parsing failures
4. **User Errors**: Invalid input, configuration issues

### Error Recovery

- **Automatic Retry**: Failed requests automatically retried
- **Token Refresh**: Expired tokens automatically refreshed
- **Graceful Degradation**: Partial failures don't break entire app
- **User Feedback**: Clear error messages and recovery instructions

### Logging

- **Console Logging**: Comprehensive logging for debugging
- **Error Tracking**: Structured error information
- **Performance Monitoring**: API response times and success rates

## 🧪 Testing Strategy

### Test Coverage Areas

1. **Authentication Flow**: OAuth PKCE implementation
2. **API Integration**: Salesforce API calls and responses
3. **Search Functionality**: Metadata search accuracy
4. **Error Handling**: Network failures and token expiration
5. **UI Components**: User interface interactions

### Testing Tools

- **Unit Tests**: Component and service testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Full user flow testing
- **Platform Testing**: iOS, Android, and Web compatibility

## 📈 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Components loaded on demand
2. **Result Pagination**: Limited results per search
3. **Caching**: API response caching
4. **Debouncing**: Search input debouncing
5. **Memory Management**: Proper cleanup of resources

### Monitoring Metrics

- **API Response Times**: Track Salesforce API performance
- **Search Performance**: Monitor search execution times
- **Memory Usage**: Track app memory consumption
- **User Experience**: Monitor app responsiveness

## 🔄 Future Enhancements

### Planned Features

1. **Offline Support**: Cache metadata for offline access
2. **Advanced Filters**: More sophisticated search filters
3. **Export Functionality**: Export search results to various formats
4. **Metadata Comparison**: Compare metadata across orgs
5. **Bulk Operations**: Batch metadata operations

### Technical Improvements

1. **Performance Optimization**: Further search performance improvements
2. **UI Enhancements**: More polished user interface
3. **Error Recovery**: Enhanced error handling and recovery
4. **Testing Coverage**: Comprehensive test suite
5. **Documentation**: Enhanced user and developer documentation

---

This architecture provides a robust, scalable, and secure foundation for Salesforce metadata exploration and search functionality across multiple platforms.
