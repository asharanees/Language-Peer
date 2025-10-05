# API Documentation

## Base URL

```
https://api.languagepeer.com/v1
```

## Authentication

All API requests require authentication via JWT tokens:

```bash
Authorization: Bearer <jwt_token>
```

## Endpoints

### User Management

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "targetLanguage": "spanish",
  "nativeLanguage": "english",
  "learningGoals": ["conversation", "pronunciation"]
}
```

**Response:**
```json
{
  "userId": "user_123",
  "token": "jwt_token_here",
  "profile": {
    "email": "user@example.com",
    "targetLanguage": "spanish",
    "currentLevel": "beginner"
  }
}
```

#### GET /users/profile
Get current user profile and progress.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "targetLanguage": "spanish",
  "currentLevel": "intermediate",
  "progress": {
    "overallScore": 75,
    "sessionsCompleted": 24,
    "totalPracticeTime": 1440
  }
}
```

### Conversation Sessions

#### POST /sessions/start
Start a new conversation session with an AI agent.

**Request Body:**
```json
{
  "agentId": "maria_tutor",
  "topic": "restaurant_ordering",
  "difficulty": "intermediate"
}
```

**Response:**
```json
{
  "sessionId": "session_456",
  "agent": {
    "id": "maria_tutor",
    "name": "Maria",
    "personality": "friendly_tutor",
    "voice": "Lucia"
  },
  "websocketUrl": "wss://ws.languagepeer.com/session_456"
}
```

#### POST /sessions/{sessionId}/message
Send a message in an active conversation session.

**Request Body:**
```json
{
  "content": "I would like to order paella, please",
  "audioUrl": "s3://audio-bucket/user_audio_123.wav",
  "timestamp": "2025-01-10T15:30:00Z"
}
```

**Response:**
```json
{
  "messageId": "msg_789",
  "agentResponse": {
    "content": "¡Excelente! Paella is a great choice. Would you like paella valenciana or paella de mariscos?",
    "audioUrl": "s3://audio-bucket/agent_response_456.wav",
    "analysis": {
      "grammarScore": 85,
      "fluencyScore": 78,
      "suggestions": ["Try pronouncing 'paella' with emphasis on the 'll' sound"]
    }
  }
}
```

### Voice Processing

#### POST /voice/transcribe
Transcribe audio to text using Amazon Transcribe.

**Request Body:**
```json
{
  "audioUrl": "s3://audio-bucket/user_audio.wav",
  "language": "es-ES"
}
```

**Response:**
```json
{
  "transcript": "Quiero ordenar paella, por favor",
  "confidence": 0.92,
  "alternatives": [
    {
      "transcript": "Quiero ordenar paella por favor",
      "confidence": 0.88
    }
  ]
}
```

#### POST /voice/synthesize
Convert text to speech using Amazon Polly.

**Request Body:**
```json
{
  "text": "¡Hola! ¿Cómo estás hoy?",
  "voice": "Lucia",
  "language": "es-ES",
  "ssml": true
}
```

**Response:**
```json
{
  "audioUrl": "s3://audio-bucket/synthesized_audio.mp3",
  "duration": 2.5
}
```

### Language Analysis

#### POST /analysis/grammar
Analyze grammar in user input.

**Request Body:**
```json
{
  "text": "Yo quiero comer en el restaurante",
  "targetLanguage": "spanish",
  "userLevel": "intermediate"
}
```

**Response:**
```json
{
  "score": 90,
  "errors": [],
  "suggestions": [
    {
      "type": "style",
      "message": "Consider using 'Me gustaría comer' for more polite expression",
      "alternative": "Me gustaría comer en el restaurante"
    }
  ]
}
```

### Agent Management

#### GET /agents
List available AI agents.

**Response:**
```json
{
  "agents": [
    {
      "id": "maria_tutor",
      "name": "Maria",
      "personality": "friendly_tutor",
      "specialties": ["conversation", "grammar"],
      "languages": ["spanish"],
      "description": "A patient and encouraging tutor"
    },
    {
      "id": "carlos_coach",
      "name": "Carlos",
      "personality": "pronunciation_coach",
      "specialties": ["pronunciation", "accent"],
      "languages": ["spanish"],
      "description": "Specialized in pronunciation improvement"
    }
  ]
}
```

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://ws.languagepeer.com/session_456');
```

### Events

#### voice_input
Real-time voice input from user.
```json
{
  "type": "voice_input",
  "audioChunk": "base64_encoded_audio",
  "timestamp": "2025-01-10T15:30:00Z"
}
```

#### agent_response
Real-time agent response.
```json
{
  "type": "agent_response",
  "content": "That's a great question!",
  "audioUrl": "s3://audio-bucket/response.mp3",
  "analysis": {
    "grammarScore": 85,
    "suggestions": ["Try using past tense here"]
  }
}
```

#### feedback
Real-time language feedback.
```json
{
  "type": "feedback",
  "category": "pronunciation",
  "message": "Great improvement on the 'rr' sound!",
  "score": 88
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is missing required fields",
    "details": {
      "missingFields": ["targetLanguage"]
    }
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` (400): Malformed request
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limits

- **Authentication**: 10 requests per minute
- **Voice Processing**: 100 requests per hour
- **Conversations**: 50 active sessions per user
- **Analysis**: 200 requests per hour

## SDKs and Examples

### JavaScript/TypeScript
```bash
npm install @languagepeer/sdk
```

```typescript
import { LanguagePeerClient } from '@languagepeer/sdk';

const client = new LanguagePeerClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.languagepeer.com/v1'
});

const session = await client.sessions.start({
  agentId: 'maria_tutor',
  topic: 'restaurant_ordering'
});
```

### Python
```bash
pip install languagepeer-python
```

```python
from languagepeer import LanguagePeerClient

client = LanguagePeerClient(api_key='your_api_key')
session = client.sessions.start(
    agent_id='maria_tutor',
    topic='restaurant_ordering'
)
```