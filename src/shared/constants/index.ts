// Constants for LanguagePeer application

export const AGENT_PERSONALITIES = {
  FRIENDLY_TUTOR: 'friendly-tutor',
  STRICT_TEACHER: 'strict-teacher',
  CONVERSATION_PARTNER: 'conversation-partner',
  PRONUNCIATION_COACH: 'pronunciation-coach'
} as const;

export const BEDROCK_MODELS = {
  CLAUDE_3_5_SONNET: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  LLAMA_3_1_405B: 'meta.llama3-1-405b-instruct-v1:0',
  NOVA_PRO: 'amazon.nova-pro-v1:0'
} as const;

export const POLLY_VOICES = {
  JOANNA: 'Joanna',
  MATTHEW: 'Matthew',
  JUSTIN: 'Justin',
  KENDRA: 'Kendra',
  SALLI: 'Salli'
} as const;

export const LANGUAGE_LEVELS = [
  'beginner',
  'elementary', 
  'intermediate',
  'upper-intermediate',
  'advanced',
  'proficient'
] as const;

export const LEARNING_GOALS = [
  'conversation-fluency',
  'grammar-accuracy',
  'pronunciation-improvement', 
  'vocabulary-expansion',
  'confidence-building'
] as const;

export const CONVERSATION_TOPICS = [
  'Travel and Culture',
  'Food and Cooking',
  'Work and Career',
  'Hobbies and Interests',
  'Daily Routine',
  'Family and Friends',
  'Technology',
  'Health and Fitness',
  'Entertainment',
  'Current Events'
] as const;

export const FEEDBACK_TYPES = [
  'correction',
  'encouragement', 
  'suggestion',
  'vocabulary-tip',
  'pronunciation-guide'
] as const;

export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused'
} as const;

export const MESSAGE_SENDER = {
  USER: 'user',
  AGENT: 'agent'
} as const;

export const DIFFICULTY_LEVELS = [
  'easy',
  'medium', 
  'hard',
  'adaptive'
] as const;

// Audio configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_RECORDING_TIME: 300000, // 5 minutes in ms
  SILENCE_THRESHOLD: 0.01,
  SILENCE_DURATION: 2000 // 2 seconds
} as const;

// API endpoints
export const API_ENDPOINTS = {
  USERS: '/api/users',
  SESSIONS: '/api/sessions', 
  MESSAGES: '/api/messages',
  AGENTS: '/api/agents',
  FEEDBACK: '/api/feedback',
  PROGRESS: '/api/progress'
} as const;

// Error codes
export const ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INVALID_AGENT: 'INVALID_AGENT',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  SYNTHESIS_FAILED: 'SYNTHESIS_FAILED',
  BEDROCK_ERROR: 'BEDROCK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;