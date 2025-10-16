# LanguagePeer API Documentation 📚

## 🎯 Overview

LanguagePeer provides a comprehensive RESTful API for voice-first language learning interactions. The API is built on AWS serverless architecture with real-time capabilities for voice processing and agent coordination.

**Important**: LanguagePeer is designed with an enhanced offline-first approach. The frontend application provides a complete learning experience without API connectivity, featuring:
- **Contextual AI Responses**: Intelligent mock responses that adapt to conversation topics and user input
- **Realistic Feedback**: Dynamic scoring and personalized suggestions based on message analysis
- **Personality-Driven Interactions**: Each agent maintains distinct conversation styles in offline mode
- **Intelligent Text-to-Speech**: Browser-based TTS with agent-specific voice personalities and speech controls
- **Seamless Experience**: Users cannot distinguish between online and offline interactions

**Base URL**: `https://api.languagepeer.com/v1` (or your deployed API Gateway URL)

---

## 🔐 Authentication

All API endpoints require authentication using JWT tokens. LanguagePeer provides a comprehensive authentication system with user registration and login capabilities.

### User Registration

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

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "profile": {
      "targetLanguage": "English",
      "nativeLanguage": "Spanish",
      "currentLevel": "intermediate",
      "learningGoals": [],
      "createdAt": "2024-01-20T10:30:00Z"
    }
  }
}
```

### User Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "profile": {
      "targetLanguage": "English",
      "nativeLanguage": "Spanish",
      "currentLevel": "intermediate",
      "learningGoals": ["conversation-fluency"],
      "lastLoginAt": "2024-01-20T15:00:00Z"
    }
  }
}
```

### Supported Languages

The authentication system supports the following language options:

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
- `beginner` - Just starting to learn
- `intermediate` - Can hold basic conversations
- `advanced` - Fluent with room for improvement

### Using Authentication

Include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication Modal Integration

The frontend includes a comprehensive authentication modal (`AuthModal.tsx`) that provides:

- **Dual Mode Interface**: Seamless switching between login and signup
- **Form Validation**: Client-side validation with real-time feedback
- **Language Selection**: Dropdown menus for target and native languages
- **Level Assessment**: Proficiency level selection during registration
- **Error Handling**: Clear error messages for authentication failures
- **Loading States**: Visual feedback during authentication requests
- **Responsive Design**: Mobile-optimized authentication experience

**Modal Features:**
```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}
```

The modal automatically handles:
- Form state management
- Input validation (email format, password length)
- API integration with error handling
- Successful authentication redirect
- Mode switching between login/signup

---

## 👤 User Management

### Get User Profile

```http
GET /users/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "profile": {
    "targetLanguage": "en",
    "nativeLanguage": "es",
    "currentLevel": "intermediate",
    "learningGoals": ["conversation", "grammar", "pronunciation"],
    "preferredAgents": ["friendly-tutor", "conversation-partner"],
    "totalSessionTime": 7200,
    "sessionsCompleted": 24,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastSessionAt": "2024-01-20T14:45:00Z"
  },
  "progress": {
    "grammarScore": 85,
    "fluencyScore": 78,
    "vocabularyScore": 92,
    "confidenceLevel": 7.5,
    "improvementTrend": "increasing"
  }
}
```

### Update User Profile

```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetLanguage": "en",
  "currentLevel": "advanced",
  "learningGoals": ["conversation", "business_english"],
  "preferredAgents": ["strict-teacher", "pronunciation-coach"]
}
```

---

## 🤖 Agent Management

### List Available Agents

```http
GET /agents
Authorization: Bearer {token}
```

**Response:**
```json
{
  "agents": [
    {
      "id": "friendly-tutor",
      "name": "Emma",
      "personality": "friendly-tutor",
      "description": "A patient and encouraging tutor perfect for building confidence",
      "traits": ["Patient", "Encouraging", "Supportive", "Gentle"],
      "avatar": "👩‍🏫",
      "voiceCharacteristics": {
        "voice": "Joanna",
        "speed": 1.0,
        "pitch": 1.0,
        "style": "conversational"
      },
      "specialties": ["Grammar", "Vocabulary", "Confidence Building"],
      "difficulty": "beginner",
      "languages": ["en", "es", "fr"],
      "isActive": true
    },
    {
      "id": "strict-teacher",
      "name": "Professor Chen",
      "personality": "strict-teacher",
      "description": "A disciplined educator focused on accuracy and improvement",
      "traits": ["Precise", "Detailed", "Thorough", "Professional"],
      "avatar": "👨‍💼",
      "voiceCharacteristics": {
        "voice": "Matthew",
        "speed": 0.9,
        "pitch": 0.9,
        "style": "formal"
      },
      "specialties": ["Grammar", "Pronunciation", "Academic English"],
      "difficulty": "advanced",
      "languages": ["en"],
      "isActive": true
    }
  ],
  "total": 4,
  "filters": {
    "difficulties": ["beginner", "intermediate", "advanced", "all"],
    "specialties": ["Grammar", "Vocabulary", "Pronunciation", "Conversation"],
    "languages": ["en", "es", "fr", "de"]
  }
}
```

### Get Agent Details

```http
GET /agents/{agentId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "friendly-tutor",
  "name": "Emma",
  "personality": "friendly-tutor",
  "description": "A patient and encouraging tutor perfect for building confidence",
  "traits": ["Patient", "Encouraging", "Supportive", "Gentle"],
  "avatar": "👩‍🏫",
  "voiceCharacteristics": {
    "voice": "Joanna",
    "speed": 1.0,
    "pitch": 1.0,
    "style": "conversational"
  },
  "specialties": ["Grammar", "Vocabulary", "Confidence Building"],
  "difficulty": "beginner",
  "languages": ["en", "es", "fr"],
  "isActive": true,
  "stats": {
    "totalSessions": 1247,
    "averageRating": 4.8,
    "successRate": 0.92,
    "averageSessionDuration": 18.5
  },
  "sampleGreetings": [
    "Hi there! I'm Emma, your friendly language tutor. I'm excited to help you practice today!",
    "Hello! Ready for another great conversation? I'm here to support you every step of the way.",
    "Welcome back! I love seeing your progress. What would you like to work on today?"
  ]
}
```

---

## 💬 Conversation Management

### Start New Conversation

**Note**: The frontend application can start conversations without this API call by generating local session IDs and using mock agent responses.

```http
POST /conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "agentId": "friendly-tutor",
  "topic": "daily_routine",
  "difficulty": "intermediate",
  "duration": 1800,
  "preferences": {
    "feedbackLevel": "detailed",
    "correctionStyle": "gentle",
    "focusAreas": ["grammar", "vocabulary"]
  }
}
```

**Response:**
```json
{
  "conversationId": "conv_abc123",
  "sessionId": "session_xyz789",
  "agent": {
    "id": "friendly-tutor",
    "name": "Emma",
    "greeting": "Hi there! I'm Emma, your friendly language tutor. I'm excited to help you practice today! What would you like to talk about?"
  },
  "status": "active",
  "startedAt": "2024-01-20T15:00:00Z",
  "settings": {
    "topic": "daily_routine",
    "difficulty": "intermediate",
    "maxDuration": 1800,
    "feedbackEnabled": true
  },
  "websocketUrl": "wss://api.languagepeer.com/conversations/conv_abc123"
}
```

**Enhanced Offline Behavior**: When the API is unavailable, the frontend automatically switches to enhanced offline mode:
- Generates local session IDs (e.g., `session-1642694400000-abc123def`)
- Provides contextually-aware agent responses based on user input
- Generates realistic feedback scores and suggestions
- Maintains full conversation functionality with personality-driven responses
- Users experience seamless AI-like interactions without API dependency

### Get Conversation History

```http
GET /conversations/{conversationId}/messages
Authorization: Bearer {token}
```

**Response:**
```json
{
  "conversationId": "conv_abc123",
  "messages": [
    {
      "id": "msg_001",
      "type": "agent",
      "content": "Hi there! I'm Emma, your friendly language tutor. What would you like to talk about today?",
      "timestamp": "2024-01-20T15:00:00Z",
      "audioUrl": "https://s3.amazonaws.com/audio/msg_001.mp3",
      "metadata": {
        "agentId": "friendly-tutor",
        "duration": 4.2,
        "voiceSettings": {
          "voice": "Joanna",
          "speed": 1.0
        }
      }
    },
    {
      "id": "msg_002",
      "type": "user",
      "content": "I want to practice talking about my daily routine.",
      "timestamp": "2024-01-20T15:00:15Z",
      "audioUrl": "https://s3.amazonaws.com/audio/msg_002.mp3",
      "transcription": {
        "text": "I want to practice talking about my daily routine.",
        "confidence": 0.95,
        "alternatives": [
          "I want to practice talking about my daily routine.",
          "I want to practice talking about my daily routines."
        ]
      },
      "analysis": {
        "grammarScore": 95,
        "fluencyScore": 88,
        "vocabularyScore": 85,
        "pronunciationScore": 90,
        "errors": [],
        "suggestions": [
          "Great sentence structure! Try adding more descriptive words to make it even better."
        ]
      }
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### End Conversation

```http
POST /conversations/{conversationId}/end
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "completed",
  "feedback": {
    "rating": 5,
    "comment": "Great session with Emma!",
    "helpful": true
  }
}
```

**Response:**
```json
{
  "conversationId": "conv_abc123",
  "status": "completed",
  "endedAt": "2024-01-20T15:30:00Z",
  "summary": {
    "duration": 1800,
    "messageCount": 24,
    "userMessages": 12,
    "agentMessages": 12,
    "averageResponseTime": 2.3,
    "topicsDiscussed": ["daily_routine", "work_schedule", "hobbies"],
    "overallPerformance": {
      "grammarScore": 87,
      "fluencyScore": 82,
      "vocabularyScore": 89,
      "improvementAreas": ["verb_tenses", "prepositions"]
    }
  },
  "nextRecommendations": {
    "suggestedTopics": ["weekend_activities", "future_plans"],
    "recommendedAgent": "conversation-partner",
    "focusAreas": ["verb_tenses", "casual_conversation"]
  }
}
```

---

## 🎙️ Voice Processing

### 🔊 Text-to-Speech (TTS) Integration

LanguagePeer includes intelligent browser-based Text-to-Speech functionality that works offline without API calls. The system uses event-driven TTS completion handling for accurate speech timing and user experience:

#### Agent Voice Personalities

Each AI agent has distinct voice characteristics automatically applied:

```typescript
// TTS Configuration by Agent
const agentVoiceConfig = {
  'friendly-tutor': {
    voiceType: 'female',
    preferredVoices: ['Samantha', 'Karen', 'female'],
    pitch: 1.1,        // Slightly higher for warmth
    rate: 0.9,         // Slightly slower for clarity
    volume: 0.8
  },
  'strict-teacher': {
    voiceType: 'male',
    preferredVoices: ['Daniel', 'Alex', 'male'],
    pitch: 0.9,        // Lower for authority
    rate: 0.8,         // Slower for precision
    volume: 0.8
  },
  'conversation-partner': {
    voiceType: 'neutral',
    preferredVoices: ['english'],
    pitch: 1.0,        // Natural for relatability
    rate: 1.0,         // Normal for natural flow
    volume: 0.8
  },
  'pronunciation-coach': {
    voiceType: 'clear',
    preferredVoices: ['english', 'us', 'american'],
    pitch: 1.0,        // Natural for clarity
    rate: 0.85,        // Slower for pronunciation modeling
    volume: 0.8
  }
};
```

#### TTS Controls

The frontend automatically provides TTS controls:

- **Automatic Playback**: Agent responses are spoken immediately
- **Stop Speaking Button**: Appears during TTS playback
- **Visual Indicators**: Shows when agent is speaking
- **Event-Driven Completion**: TTS completion is handled by actual audio events, not simulated timeouts
- **Cross-Browser Support**: Works with Web Speech API
- **Offline Capability**: Functions without internet connection

#### Browser Compatibility

| Browser | TTS Support | Voice Selection | Speech Controls |
|---------|-------------|-----------------|-----------------|
| Chrome 60+ | ✅ Full | ✅ Advanced | ✅ Complete |
| Firefox 55+ | ✅ Full | ✅ Advanced | ✅ Complete |
| Safari 11+ | ✅ Full | ✅ Basic | ✅ Complete |
| Edge 79+ | ✅ Full | ✅ Advanced | ✅ Complete |

### Real-time Voice Processing (WebSocket)

Connect to the WebSocket endpoint for real-time voice processing:

```javascript
const ws = new WebSocket('wss://api.languagepeer.com/conversations/conv_abc123');

// Send audio data (when voice recording is supported)
ws.send(JSON.stringify({
  type: 'audio_chunk',
  data: base64AudioData,
  format: 'webm',
  sampleRate: 16000
}));

// Send text data (fallback mode when voice recording is not available)
ws.send(JSON.stringify({
  type: 'text_message',
  text: 'Hello, I want to practice my English',
  timestamp: Date.now()
}));

// Receive transcription or text acknowledgment
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'transcription') {
    console.log('Transcription:', message.text);
    console.log('Confidence:', message.confidence);
  } else if (message.type === 'text_received') {
    console.log('Text message processed:', message.text);
  }
};
```

### Upload Audio File or Text Message

#### Audio Upload (Primary Mode)
```http
POST /conversations/{conversationId}/audio
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "audio": [audio file],
  "format": "webm",
  "duration": 5.2
}
```

#### Text Message (Fallback Mode)
```http
POST /conversations/{conversationId}/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "I usually wake up at seven in the morning and have breakfast.",
  "mode": "text_fallback",
  "timestamp": "2024-01-20T15:05:00Z"
}
```

**Response:**
```json
{
  "messageId": "msg_003",
  "transcription": {
    "text": "I usually wake up at seven in the morning and have breakfast.",
    "confidence": 0.92,
    "language": "en",
    "duration": 5.2
  },
  "analysis": {
    "grammarScore": 90,
    "fluencyScore": 85,
    "vocabularyScore": 88,
    "pronunciationScore": 87,
    "detectedErrors": [
      {
        "type": "pronunciation",
        "word": "usually",
        "suggestion": "Focus on the 'zh' sound in 'usually'",
        "severity": "minor"
      }
    ],
    "suggestions": [
      "Great use of time expressions! Try adding more details about your breakfast."
    ]
  },
  "agentResponse": {
    "text": "That's a great start! I love how you used 'usually' to describe your routine. What do you typically have for breakfast?",
    "audioUrl": "https://s3.amazonaws.com/audio/agent_response_003.mp3",
    "reasoning": "User provided good basic routine information. Encouraging response with follow-up question to continue conversation naturally."
  }
}
```

---

## 📊 Analytics and Progress

### Get Progress Analytics

```http
GET /analytics/progress
Authorization: Bearer {token}
Query Parameters:
  - timeframe: daily|weekly|monthly|all (default: weekly)
  - metrics: grammar,fluency,vocabulary,pronunciation (default: all)
```

**Response:**
```json
{
  "timeframe": "weekly",
  "period": {
    "start": "2024-01-14T00:00:00Z",
    "end": "2024-01-20T23:59:59Z"
  },
  "overallProgress": {
    "grammarScore": {
      "current": 87,
      "previous": 82,
      "change": 5,
      "trend": "improving"
    },
    "fluencyScore": {
      "current": 82,
      "previous": 79,
      "change": 3,
      "trend": "improving"
    },
    "vocabularyScore": {
      "current": 89,
      "previous": 87,
      "change": 2,
      "trend": "stable"
    },
    "pronunciationScore": {
      "current": 85,
      "previous": 83,
      "change": 2,
      "trend": "improving"
    }
  },
  "sessionStats": {
    "totalSessions": 7,
    "totalDuration": 12600,
    "averageSessionLength": 1800,
    "completionRate": 0.95,
    "mostActiveDay": "Tuesday",
    "preferredTimeSlot": "evening"
  },
  "topicProgress": [
    {
      "topic": "daily_routine",
      "sessions": 3,
      "averageScore": 86,
      "improvement": 8
    },
    {
      "topic": "hobbies",
      "sessions": 2,
      "averageScore": 82,
      "improvement": 5
    }
  ],
  "agentInteractions": [
    {
      "agentId": "friendly-tutor",
      "sessions": 4,
      "averageRating": 4.8,
      "totalDuration": 7200
    },
    {
      "agentId": "conversation-partner",
      "sessions": 3,
      "averageRating": 4.6,
      "totalDuration": 5400
    }
  ]
}
```

### Get Detailed Session Analytics

```http
GET /analytics/sessions/{sessionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "sessionId": "session_xyz789",
  "conversationId": "conv_abc123",
  "startTime": "2024-01-20T15:00:00Z",
  "endTime": "2024-01-20T15:30:00Z",
  "duration": 1800,
  "agent": {
    "id": "friendly-tutor",
    "name": "Emma"
  },
  "performance": {
    "overallScore": 85,
    "grammarScore": 87,
    "fluencyScore": 82,
    "vocabularyScore": 89,
    "pronunciationScore": 85,
    "confidenceLevel": 7.2
  },
  "interaction": {
    "totalMessages": 24,
    "userMessages": 12,
    "agentMessages": 12,
    "averageResponseTime": 2.3,
    "longestPause": 8.5,
    "wordsSpoken": 456,
    "uniqueWords": 127
  },
  "topics": [
    {
      "topic": "daily_routine",
      "duration": 900,
      "score": 88
    },
    {
      "topic": "work_schedule",
      "duration": 600,
      "score": 82
    },
    {
      "topic": "hobbies",
      "duration": 300,
      "score": 87
    }
  ],
  "errors": [
    {
      "type": "grammar",
      "category": "verb_tense",
      "example": "I go to work yesterday",
      "correction": "I went to work yesterday",
      "frequency": 2
    },
    {
      "type": "pronunciation",
      "word": "schedule",
      "phonetic": "/ˈʃɛdjuːl/",
      "userPronunciation": "/ˈskɛdjuːl/",
      "feedback": "Try the British pronunciation with 'sh' sound"
    }
  ],
  "improvements": [
    {
      "area": "vocabulary",
      "achievement": "Used 5 new words correctly",
      "examples": ["routine", "schedule", "occasionally", "typically", "frequently"]
    },
    {
      "area": "fluency",
      "achievement": "Reduced hesitation pauses by 30%",
      "comparison": "Previous session: 12 pauses, This session: 8 pauses"
    }
  ],
  "recommendations": {
    "nextTopics": ["weekend_activities", "future_plans"],
    "focusAreas": ["past_tense_verbs", "time_expressions"],
    "suggestedAgent": "conversation-partner",
    "practiceExercises": [
      "Practice past tense with daily activities",
      "Record yourself describing last weekend"
    ]
  }
}
```

---

## 🎯 Recommendations

### Get Personalized Recommendations

```http
GET /recommendations
Authorization: Bearer {token}
Query Parameters:
  - type: topics|agents|exercises|goals (default: all)
  - limit: number (default: 10)
```

**Response:**
```json
{
  "recommendations": {
    "topics": [
      {
        "id": "weekend_activities",
        "title": "Weekend Activities",
        "description": "Practice talking about leisure time and hobbies",
        "difficulty": "intermediate",
        "estimatedDuration": 15,
        "relevanceScore": 0.92,
        "reason": "Based on your interest in daily routines and good progress with time expressions"
      },
      {
        "id": "travel_experiences",
        "title": "Travel Experiences",
        "description": "Share and discuss travel memories and plans",
        "difficulty": "intermediate",
        "estimatedDuration": 20,
        "relevanceScore": 0.87,
        "reason": "Your vocabulary skills are strong, ready for more complex topics"
      }
    ],
    "agents": [
      {
        "id": "conversation-partner",
        "name": "Alex",
        "relevanceScore": 0.89,
        "reason": "Your confidence has improved significantly. Alex can help with more natural, casual conversations."
      },
      {
        "id": "pronunciation-coach",
        "name": "Coach Riley",
        "relevanceScore": 0.76,
        "reason": "Some pronunciation areas need attention, especially with complex words."
      }
    ],
    "exercises": [
      {
        "id": "past_tense_practice",
        "title": "Past Tense Storytelling",
        "description": "Practice using past tense verbs while telling stories",
        "difficulty": "intermediate",
        "estimatedTime": 10,
        "relevanceScore": 0.94,
        "reason": "You've made some past tense errors in recent sessions"
      }
    ],
    "goals": [
      {
        "id": "fluency_improvement",
        "title": "Improve Speaking Fluency",
        "description": "Reduce pauses and speak more naturally",
        "targetScore": 90,
        "currentScore": 82,
        "estimatedWeeks": 3,
        "relevanceScore": 0.91
      }
    ]
  },
  "insights": {
    "strengths": ["vocabulary", "grammar_basics", "confidence"],
    "improvementAreas": ["verb_tenses", "pronunciation", "fluency"],
    "learningPattern": "consistent_evening_learner",
    "preferredStyle": "encouraging_feedback"
  }
}
```

---

## 🔧 System Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:45:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "transcribe": "healthy",
    "polly": "healthy",
    "bedrock": "healthy",
    "comprehend": "healthy"
  },
  "region": "us-east-1"
}
```

### API Status

```http
GET /status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "plan": "free",
    "usage": {
      "sessionsThisMonth": 15,
      "minutesUsed": 450,
      "remainingMinutes": 550
    }
  },
  "limits": {
    "maxSessionsPerMonth": 50,
    "maxMinutesPerMonth": 1000,
    "maxSessionDuration": 3600,
    "concurrentSessions": 1
  },
  "features": {
    "voiceProcessing": true,
    "multipleAgents": true,
    "detailedAnalytics": true,
    "exportData": false
  }
}
```

---

## 📝 Error Handling

### Error Response Format

All API errors follow this consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "agentId",
      "reason": "Agent ID is required"
    },
    "timestamp": "2024-01-20T15:45:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication token |
| `AUTHORIZATION_FAILED` | 403 | User doesn't have permission for this resource |
| `VALIDATION_ERROR` | 400 | Request parameters are invalid |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window |
| `SERVICE_UNAVAILABLE` | 503 | External service (AWS) temporarily unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 🚀 Rate Limits

| Endpoint Category | Requests per Minute | Burst Limit |
|-------------------|-------------------|-------------|
| Authentication | 10 | 20 |
| User Management | 30 | 60 |
| Conversations | 60 | 120 |
| Voice Processing | 100 | 200 |
| Analytics | 20 | 40 |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642694400
```

---

## 📚 SDKs and Examples

### JavaScript/TypeScript SDK

```bash
npm install @languagepeer/sdk
```

```typescript
import { LanguagePeerClient } from '@languagepeer/sdk';

const client = new LanguagePeerClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.languagepeer.com/v1'
});

// Start a conversation
const conversation = await client.conversations.create({
  agentId: 'friendly-tutor',
  topic: 'daily_routine'
});

// Process voice input
const result = await client.voice.processAudio({
  conversationId: conversation.id,
  audioData: audioBlob
});
```

### Python SDK

```bash
pip install languagepeer-sdk
```

```python
from languagepeer import LanguagePeerClient

client = LanguagePeerClient(
    api_key='your-api-key',
    base_url='https://api.languagepeer.com/v1'
)

# Get user progress
progress = client.analytics.get_progress(timeframe='weekly')
print(f"Grammar score: {progress.grammar_score}")
```

---

## 🔗 Webhooks

LanguagePeer supports webhooks for real-time notifications:

### Webhook Events

- `conversation.started` - New conversation initiated
- `conversation.ended` - Conversation completed
- `message.received` - New user message processed
- `progress.milestone` - User reaches learning milestone
- `error.occurred` - System error requiring attention

### Webhook Payload Example

```json
{
  "event": "conversation.ended",
  "timestamp": "2024-01-20T15:30:00Z",
  "data": {
    "conversationId": "conv_abc123",
    "userId": "user_123",
    "agentId": "friendly-tutor",
    "duration": 1800,
    "performance": {
      "overallScore": 85,
      "improvement": 5
    }
  }
}
```

---

This API documentation provides comprehensive coverage of LanguagePeer's capabilities, enabling developers to integrate voice-first language learning into their applications.