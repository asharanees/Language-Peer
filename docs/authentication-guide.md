# LanguagePeer Authentication Guide 🔐

## Overview

LanguagePeer includes a comprehensive authentication system that enables users to create personalized accounts, track their learning progress, and maintain their preferences across sessions and devices. The authentication system is built with security best practices and provides a seamless user experience.

## Features

### 🔑 Core Authentication Features

- **User Registration**: Create accounts with language learning preferences
- **Secure Login**: Email/password authentication with JWT tokens
- **Profile Management**: Personalized learning profiles with progress tracking
- **Cross-Device Sync**: Access your account from any device
- **Responsive Design**: Mobile-optimized authentication interface
- **Error Handling**: Clear feedback for authentication issues

### 🌍 Language Support

**Target Languages (Languages to Learn):**
- English
- Spanish  
- French
- German
- Italian
- Portuguese

**Native Languages:**
- Spanish
- English
- French
- German
- Italian
- Portuguese

**Proficiency Levels:**
- **Beginner**: Just starting to learn the language
- **Intermediate**: Can hold basic conversations
- **Advanced**: Fluent with room for improvement

## User Interface

### Authentication Modal

The `AuthModal` component provides a unified interface for both login and registration:

```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}
```

#### Key Features:
- **Dual Mode**: Seamless switching between login and signup
- **Form Validation**: Real-time validation with helpful error messages
- **Language Selection**: Intuitive dropdowns for language preferences
- **Loading States**: Visual feedback during authentication requests
- **Responsive Design**: Works perfectly on mobile and desktop

### Registration Flow

1. **Personal Information**
   - Full name (required)
   - Email address (required, validated)
   - Password (required, minimum 6 characters)

2. **Language Preferences**
   - Target language (language to learn)
   - Native language (your first language)
   - Current proficiency level

3. **Account Creation**
   - Secure password hashing
   - Profile creation with preferences
   - Automatic login after registration

### Login Flow

1. **Credentials**
   - Email address
   - Password

2. **Authentication**
   - JWT token generation
   - Profile data retrieval
   - Session establishment

## Technical Implementation

### Frontend Components

#### AuthModal Component
```typescript
// Location: src/frontend/src/components/auth/AuthModal.tsx
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  // Handles both login and registration
  // Manages form state and validation
  // Integrates with useAuth hook
};
```

#### Authentication Hook
```typescript
// Location: src/frontend/src/hooks/useAuth.ts
export const useAuth = () => {
  const login = async (email: string, password: string) => {
    // Handle login logic
  };
  
  const register = async (userData: RegisterData) => {
    // Handle registration logic
  };
  
  const logout = () => {
    // Handle logout logic
  };
};
```

### Backend API Endpoints

#### Registration Endpoint
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com", 
  "password": "securepassword",
  "targetLanguage": "English",
  "nativeLanguage": "Spanish",
  "currentLevel": "intermediate"
}
```

#### Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Security Features

#### Password Security
- **Minimum Length**: 6 characters required
- **Secure Hashing**: Passwords are hashed using bcrypt
- **No Plain Text Storage**: Passwords are never stored in plain text
- **Validation**: Client-side and server-side password validation

#### JWT Token Management
- **Secure Tokens**: JWT tokens with expiration
- **Automatic Refresh**: Token refresh for extended sessions
- **Secure Storage**: Tokens stored securely in browser
- **Cross-Device Sync**: Consistent authentication across devices

#### Data Protection
- **HTTPS Only**: All authentication requests use HTTPS
- **Input Validation**: Comprehensive validation on client and server
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Input sanitization and output encoding

## User Experience

### Registration Experience

1. **Welcome Screen**: Clear call-to-action to create account
2. **Form Completion**: Step-by-step form with helpful labels
3. **Language Selection**: Easy-to-use dropdowns with clear options
4. **Instant Feedback**: Real-time validation and error messages
5. **Success State**: Immediate access to personalized features

### Login Experience

1. **Quick Access**: Simple email/password form
2. **Remember Me**: Persistent sessions for returning users
3. **Error Handling**: Clear messages for invalid credentials
4. **Password Recovery**: Future feature for password reset
5. **Seamless Transition**: Smooth transition to main application

### Mobile Experience

- **Touch-Friendly**: Large buttons and touch targets
- **Keyboard Optimization**: Appropriate input types for mobile keyboards
- **Responsive Layout**: Adapts to different screen sizes
- **Fast Loading**: Optimized for mobile network conditions

## Integration with Learning Features

### Personalized Profiles

Once authenticated, users gain access to:

- **Progress Tracking**: Conversation history and improvement metrics
- **Agent Preferences**: Saved preferences for AI agent personalities
- **Learning Goals**: Customized learning objectives and recommendations
- **Session History**: Complete record of practice sessions
- **Achievement Tracking**: Milestones and progress celebrations

### Cross-Session Continuity

- **Conversation History**: Access to previous conversations
- **Progress Persistence**: Learning progress saved across sessions
- **Preference Sync**: Agent and topic preferences maintained
- **Recommendation Engine**: Personalized suggestions based on history

## Error Handling

### Common Error Scenarios

#### Registration Errors
- **Email Already Exists**: Clear message with login option
- **Invalid Email Format**: Real-time validation feedback
- **Weak Password**: Password strength requirements displayed
- **Network Issues**: Retry options and offline indicators

#### Login Errors
- **Invalid Credentials**: Generic error message for security
- **Account Not Found**: Helpful suggestion to register
- **Network Timeout**: Retry mechanism with user feedback
- **Server Errors**: Graceful degradation with offline mode

### Error Recovery

- **Automatic Retry**: Network requests retry automatically
- **Offline Mode**: Graceful degradation when API unavailable
- **Clear Messaging**: User-friendly error descriptions
- **Recovery Actions**: Specific steps to resolve issues

## Future Enhancements

### Planned Features

- **Social Login**: Google, Facebook, Apple authentication
- **Two-Factor Authentication**: Enhanced security options
- **Password Recovery**: Email-based password reset
- **Account Verification**: Email verification for new accounts
- **Profile Pictures**: Avatar upload and management
- **Account Settings**: Comprehensive profile management

### Advanced Security

- **Rate Limiting**: Protection against brute force attacks
- **Device Management**: Track and manage logged-in devices
- **Security Notifications**: Alerts for suspicious activity
- **Privacy Controls**: Granular data sharing preferences

## Best Practices

### For Developers

1. **Security First**: Always validate input and use secure practices
2. **User Experience**: Prioritize smooth, intuitive authentication flows
3. **Error Handling**: Provide clear, actionable error messages
4. **Performance**: Optimize authentication requests for speed
5. **Testing**: Comprehensive testing of authentication scenarios

### For Users

1. **Strong Passwords**: Use unique, complex passwords
2. **Secure Devices**: Only log in on trusted devices
3. **Regular Updates**: Keep your profile information current
4. **Privacy Awareness**: Understand how your data is used
5. **Report Issues**: Contact support for any security concerns

## Troubleshooting

### Common Issues

**Q: I can't log in with my credentials**
A: Verify your email and password are correct. Try the "Forgot Password" feature when available.

**Q: Registration fails with "Email already exists"**
A: Use the login form instead, or try a different email address.

**Q: The authentication modal won't open**
A: Check your browser's JavaScript settings and try refreshing the page.

**Q: My progress isn't saving**
A: Ensure you're logged in and have a stable internet connection.

**Q: I want to change my language preferences**
A: Access your profile settings after logging in to update preferences.

### Getting Help

If you encounter authentication issues:

1. **Check Documentation**: Review this guide and the API documentation
2. **Browser Console**: Check for JavaScript errors in developer tools
3. **Network Tab**: Verify API requests are being sent correctly
4. **GitHub Issues**: Report bugs or request features on GitHub
5. **Contact Support**: Reach out through official support channels

---

The LanguagePeer authentication system provides a secure, user-friendly foundation for personalized language learning experiences. By combining robust security practices with intuitive design, it enables learners to focus on what matters most: improving their language skills.