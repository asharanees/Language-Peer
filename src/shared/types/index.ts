// Core types for LanguagePeer application

export type LanguageLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced' | 'proficient';

export type LearningGoal = 
  | 'conversation-fluency'
  | 'grammar-accuracy' 
  | 'pronunciation-improvement'
  | 'vocabulary-expansion'
  | 'confidence-building';

export interface UserProfile {
  userId: string;
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: LanguageLevel;
  learningGoals: LearningGoal[];
  preferredAgents: string[];
  conversationTopics: string[];
  progressMetrics: ProgressMetrics;
  lastSessionDate: Date;
  totalSessionTime: number;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressMetrics {
  overallImprovement: number;
  grammarProgress: number;
  fluencyProgress: number;
  vocabularyGrowth: number;
  confidenceLevel: number;
  sessionsCompleted: number;
  totalPracticeTime: number;
  streakDays: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  category: 'grammar' | 'fluency' | 'vocabulary' | 'confidence';
}

export interface ConversationSession {
  sessionId: string;
  userId: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  messages: ConversationMessage[];
  performanceMetrics: SessionMetrics;
  feedbackProvided: FeedbackInstance[];
  status: 'active' | 'completed' | 'paused';
}

export interface ConversationMessage {
  messageId: string;
  sessionId: string;
  sender: 'user' | 'agent';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  transcriptionConfidence?: number;
  languageAnalysis?: LanguageAnalysis;
}

export interface SessionMetrics {
  duration: number;
  wordsSpoken: number;
  averageResponseTime: number;
  grammarAccuracy: number;
  fluencyScore: number;
  vocabularyUsed: string[];
  errorsCount: number;
  improvementsShown: number;
}

export interface FeedbackInstance {
  feedbackId: string;
  sessionId: string;
  messageId: string;
  type: 'correction' | 'encouragement' | 'suggestion' | 'vocabulary-tip' | 'pronunciation-guide';
  content: string;
  deliveredAt: Date;
}

export interface LanguageAnalysis {
  grammarScore: number;
  fluencyScore: number;
  vocabularyLevel: number;
  detectedErrors: GrammarError[];
  suggestions: string[];
  sentiment: number;
}

export interface GrammarError {
  type: string;
  description: string;
  suggestion: string;
  position: { start: number; end: number };
}

export interface AgentPersonality {
  id: string;
  name: string;
  traits: string[];
  conversationStyle: 'friendly-tutor' | 'strict-teacher' | 'conversation-partner' | 'pronunciation-coach';
  supportiveApproach: {
    errorHandling: string;
    encouragementFrequency: string;
    difficultyAdjustment: string;
  };
  voiceCharacteristics: {
    voiceId: string;
    engine: string;
    languageCode: string;
    speakingRate?: string;
    pitch?: string;
  };
  specialties: string[];
  systemPrompt: string;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    sender?: 'user' | 'agent';
    timestamp?: Date;
    messageId?: string;
    transcriptionConfidence?: number;
  }>;
  userProfile?: UserProfile;
  currentTopic?: string;
}

export interface BedrockResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: string;
}

// API Request/Response types
export interface CreateSessionRequest {
  userId: string;
  agentId?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
}

export interface CreateSessionResponse {
  sessionId: string;
  agentPersonality: AgentPersonality;
  initialMessage: string;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
  audioData?: string;
}

export interface SendMessageResponse {
  messageId: string;
  agentResponse: string;
  audioUrl?: string;
  feedback?: FeedbackInstance[];
  analysis?: LanguageAnalysis;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  languageCode: string;
  alternatives: TranscriptAlternative[];
}

export interface TranscriptAlternative {
  transcript: string;
  confidence: number;
  startTime: Date;
  endTime?: Date;
}

// Additional types for voice processing
export interface AudioMetadata {
  originalName: string;
  contentType: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  uploadedAt: Date;
  userId: string;
  sessionId: string;
}

export interface AudioUploadResult {
  audioUrl: string;
  audioKey: string;
  uploadId: string;
  expiresAt: Date;
}

// Emotional state types for agent adaptation
export interface EmotionalState {
  frustrationLevel: number;
  confidenceLevel: number;
  engagementLevel: number;
  lastInteractionTime: Date;
}

export interface FrustrationLevel {
  level: number;
  indicators: string[];
  recommendedActions: string[];
}

export interface MotivationalMessage {
  message: string;
  type: 'encouragement' | 'milestone' | 'progress' | 'reassurance';
  personalizedElements: string[];
}