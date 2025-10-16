"use strict";
// Shared constants for LanguagePeer application
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIO_CONFIG = exports.TRANSCRIBE_LANGUAGES = exports.RECOMMENDATION_WEIGHTS = exports.PERFORMANCE_THRESHOLDS = exports.POLLY_VOICES = exports.AWS_REGIONS = exports.VOICE_SETTINGS = exports.ANALYSIS_CATEGORIES = exports.MESSAGE_SENDERS = exports.SESSION_STATUS = exports.FEEDBACK_TYPES = exports.LEARNING_GOALS = exports.LANGUAGE_LEVELS = exports.DIFFICULTY_LEVELS = exports.CONVERSATION_TOPICS = exports.AGENT_PERSONALITIES = exports.BEDROCK_MODELS = void 0;
exports.BEDROCK_MODELS = {
    NOVA_PRO: 'amazon.nova-pro-v1:0', // Primary model for complex conversations
    NOVA_LITE: 'amazon.nova-lite-v1:0', // Lightweight model for simple tasks
    NOVA_PREMIER: 'amazon.nova-premier-v1:0', // Advanced model for complex reasoning
    LLAMA_3_1_70B: 'meta.llama3-1-70b-instruct-v1:0' // Backup model
};
exports.AGENT_PERSONALITIES = {
    FRIENDLY_TUTOR: 'friendly-tutor',
    STRICT_TEACHER: 'strict-teacher',
    CONVERSATION_PARTNER: 'conversation-partner',
    PRONUNCIATION_COACH: 'pronunciation-coach'
};
exports.CONVERSATION_TOPICS = [
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
];
exports.DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    ADAPTIVE: 'adaptive'
};
exports.LANGUAGE_LEVELS = {
    BEGINNER: 'beginner',
    ELEMENTARY: 'elementary',
    INTERMEDIATE: 'intermediate',
    UPPER_INTERMEDIATE: 'upper-intermediate',
    ADVANCED: 'advanced',
    PROFICIENT: 'proficient'
};
exports.LEARNING_GOALS = {
    CONVERSATION_FLUENCY: 'conversation-fluency',
    GRAMMAR_ACCURACY: 'grammar-accuracy',
    PRONUNCIATION_IMPROVEMENT: 'pronunciation-improvement',
    VOCABULARY_EXPANSION: 'vocabulary-expansion',
    CONFIDENCE_BUILDING: 'confidence-building'
};
exports.FEEDBACK_TYPES = {
    CORRECTION: 'correction',
    ENCOURAGEMENT: 'encouragement',
    SUGGESTION: 'suggestion',
    VOCABULARY_TIP: 'vocabulary-tip',
    PRONUNCIATION_GUIDE: 'pronunciation-guide'
};
exports.SESSION_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    PAUSED: 'paused'
};
exports.MESSAGE_SENDERS = {
    USER: 'user',
    AGENT: 'agent'
};
exports.ANALYSIS_CATEGORIES = {
    GRAMMAR: 'grammar',
    FLUENCY: 'fluency',
    VOCABULARY: 'vocabulary',
    CONFIDENCE: 'confidence'
};
// Voice processing constants
exports.VOICE_SETTINGS = {
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
    CHUNK_SIZE: 1024,
    MAX_RECORDING_TIME: 300000, // 5 minutes in milliseconds
    SILENCE_THRESHOLD: 0.01,
    SILENCE_DURATION: 2000 // 2 seconds
};
// AWS Service configurations
exports.AWS_REGIONS = {
    US_EAST_1: 'us-east-1',
    US_WEST_2: 'us-west-2',
    EU_WEST_1: 'eu-west-1'
};
exports.POLLY_VOICES = {
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
};
// Performance thresholds
exports.PERFORMANCE_THRESHOLDS = {
    GRAMMAR_GOOD: 0.8,
    GRAMMAR_FAIR: 0.6,
    FLUENCY_GOOD: 0.8,
    FLUENCY_FAIR: 0.6,
    VOCABULARY_GOOD: 0.7,
    VOCABULARY_FAIR: 0.5,
    CONFIDENCE_GOOD: 0.7,
    CONFIDENCE_FAIR: 0.5
};
// Recommendation weights
exports.RECOMMENDATION_WEIGHTS = {
    RECENT_PERFORMANCE: 0.4,
    USER_PREFERENCES: 0.3,
    LEARNING_GOALS: 0.2,
    VARIETY_FACTOR: 0.1
};
// Additional constants for missing references
exports.TRANSCRIBE_LANGUAGES = [
    'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN'
];
exports.AUDIO_CONFIG = {
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
    BIT_DEPTH: 16,
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_FORMATS: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm']
};
