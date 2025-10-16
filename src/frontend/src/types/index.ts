// Frontend-specific types for LanguagePeer

export interface User {
  id: string;
  name: string;
  email: string;
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  transcriptionConfidence?: number;
}

export interface Agent {
  id: string;
  name: string;
  personality: string;
  description: string;
  specialties: string[];
  avatar?: string;
}

export interface VoiceSettings {
  enabled: boolean;
  autoStart: boolean;
  language: string;
  voiceId?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  voice: VoiceSettings;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

export interface ConversationSession {
  id: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
  topic?: string;
  difficulty?: string;
}

export interface ProgressMetrics {
  overallScore: number;
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  confidenceLevel: number;
  sessionsCompleted: number;
  totalPracticeTime: number;
  streakDays: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: string;
}

export interface SendMessageRequest {
  content: string;
  audioData?: Blob;
  sessionId: string;
}

export interface SendMessageResponse {
  messageId: string;
  agentResponse: string;
  audioUrl?: string;
  feedback?: any[];
  analysis?: any;
}

// Component prop types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

// Voice recognition types
export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceRecognitionError {
  error: string;
  message: string;
}

// Audio types
export interface AudioRecording {
  blob: Blob;
  duration: number;
  url: string;
}

export interface AudioPlayback {
  url: string;
  duration?: number;
  isPlaying: boolean;
  currentTime: number;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
}

export interface FormErrors {
  [key: string]: string;
}

// Speech Recognition API types
export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Global window extensions for voice recognition
declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
}