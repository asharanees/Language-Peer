// Shared constants for LanguagePeer application

export const BEDROCK_MODELS = {
  CLAUDE_3_5_SONNET: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  LLAMA_3_1_405B: 'meta.llama3-1-405b-instruct-v1:0',
  NOVA_PRO: 'amazon.nova-pro-v1:0'
} as const;

export const AGENT_PERSONALITIES = {
  FRIENDLY_TUTOR: 'friendly-tutor',
  STRICT_TEACHER: 'strict-teacher',
  CONVERSATION_PARTNER: 'conversation-partner',
  PRONUNCIATION_COACH: 'pronunciation-coach'
} as const;

export const CONVERSATION_TOPICS = [
  'Travel and Culture',
  'Food and Cooking',
  'Family and Friends',
  'Hobbies and Interests',
  'Work and Career',
  'Education and Learning',
  'Technology and Innovation',
  'Health and Fitness',
  'Entertainment and Media',
  'Science and Discovery',
  'Art and Creativity',
  'Environment and Nature',
  'History and Politics',
  'Sports and Recreation',
  'Shopping and Fashion',
  'Transportation and Travel',
  'Weather and Seasons',
  'Daily Routines',
  'Social Issues',
  'Business and Economics'
] as const;

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  ADAPTIVE: 'adaptive'
} as const;

export const LANGUAGE_LEVELS = {
  BEGINNER: 'beginner',
  ELEMENTARY: 'elementary',
  INTERMEDIATE: 'intermediate',
  UPPER_INTERMEDIATE: 'upper-intermediate',
  ADVANCED: 'advanced',
  PROFICIENT: 'proficient'
} as const;

export const LEARNING_GOALS = {
  CONVERSATION_FLUENCY: 'conversation-fluency',
  GRAMMAR_ACCURACY: 'grammar-accuracy',
  PRONUNCIATION_IMPROVEMENT: 'pronunciation-improvement',
  VOCABULARY_EXPANSION: 'vocabulary-expansion',
  CONFIDENCE_BUILDING: 'confidence-building'
} as const;

export const FEEDBACK_TYPES = {
  CORRECTION: 'correction',
  ENCOURAGEMENT: 'encouragement',
  SUGGESTION: 'suggestion',
  VOCABULARY_TIP: 'vocabulary-tip',
  PRONUNCIATION_GUIDE: 'pronunciation-guide'
} as const;

export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused'
} as const;

export const MESSAGE_SENDERS = {
  USER: 'user',
  AGENT: 'agent'
} as const;

export const ANALYSIS_CATEGORIES = {
  GRAMMAR: 'grammar',
  FLUENCY: 'fluency',
  VOCABULARY: 'vocabulary',
  CONFIDENCE: 'confidence'
} as const;

// Voice processing constants
export const VOICE_SETTINGS = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  CHUNK_SIZE: 1024,
  MAX_RECORDING_TIME: 300000, // 5 minutes in milliseconds
  SILENCE_THRESHOLD: 0.01,
  SILENCE_DURATION: 2000 // 2 seconds
} as const;

// AWS Service configurations
export const AWS_REGIONS = {
  US_EAST_1: 'us-east-1',
  US_WEST_2: 'us-west-2',
  EU_WEST_1: 'eu-west-1'
} as const;

export const POLLY_VOICES = {
  ENGLISH: {
    JOANNA: 'Joanna',
    MATTHEW: 'Matthew',
    AMY: 'Amy',
    BRIAN: 'Brian'
  },
  SPANISH: {
    PENELOPE: 'Penelope',
    MIGUEL: 'Miguel'
  },
  FRENCH: {
    CELINE: 'Celine',
    MATHIEU: 'Mathieu'
  }
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  GRAMMAR_GOOD: 0.8,
  GRAMMAR_FAIR: 0.6,
  FLUENCY_GOOD: 0.8,
  FLUENCY_FAIR: 0.6,
  VOCABULARY_GOOD: 0.7,
  VOCABULARY_FAIR: 0.5,
  CONFIDENCE_GOOD: 0.7,
  CONFIDENCE_FAIR: 0.5
} as const;

// Recommendation weights
export const RECOMMENDATION_WEIGHTS = {
  RECENT_PERFORMANCE: 0.4,
  USER_PREFERENCES: 0.3,
  LEARNING_GOALS: 0.2,
  VARIETY_FACTOR: 0.1
} as const;

// Additional constants for missing references
export const TRANSCRIBE_LANGUAGES = [
  'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN'
] as const;

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FORMATS: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm']
} as const;