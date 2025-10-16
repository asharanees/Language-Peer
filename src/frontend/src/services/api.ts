/**
 * API service for LanguagePeer frontend
 * Provides centralized HTTP communication with the backend API
 * Handles conversation management, transcription, and speech synthesis
 */

// Default API endpoint - uses CloudFront HTTPS URL for better mobile connectivity
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dohpefdcwoh2h.cloudfront.net/development';

// HTTP request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000;

/** Network timeout for mobile-friendly requests (15 seconds) */
const MOBILE_NETWORK_TIMEOUT_MS = 15000;

/** Maximum number of retry attempts for failed requests */
const MAX_RETRY_ATTEMPTS = 2;

/** Base delay for exponential backoff retry strategy (1 second) */
const RETRY_BASE_DELAY_MS = 1000;

/**
 * Request payload for sending a message to an AI agent
 */
export interface ConversationRequest {
  /** The text message or transcribed audio content */
  message: string;
  /** ID of the agent personality to interact with (e.g., 'friendly-tutor', 'strict-teacher') */
  agentPersonality: string;
  /** Optional session ID to continue an existing conversation */
  sessionId?: string;
  /** Optional user ID for personalized responses */
  userId?: string;
  /** Optional base64 encoded audio data for voice input */
  audioData?: string;
}

/**
 * Response from the AI agent after processing a conversation message
 */
export interface ConversationResponse {
  /** The agent's text response to the user's message */
  response: string;
  /** Optional URL to synthesized speech audio of the response */
  audioUrl?: string;
  /** Optional language learning feedback and analysis */
  feedback?: LanguageFeedback;
  /** Session ID for tracking the conversation thread */
  sessionId: string;
}

/**
 * Language learning feedback provided by AI agents
 * Scores are normalized between 0.0 and 1.0 where 1.0 is perfect
 */
export interface LanguageFeedback {
  /** Grammar accuracy score (0.0 - 1.0) */
  grammarScore: number;
  /** Speech fluency score (0.0 - 1.0) */
  fluencyScore: number;
  /** Vocabulary usage score (0.0 - 1.0) */
  vocabularyScore: number;
  /** Array of improvement suggestions */
  suggestions: string[];
  /** Array of specific corrections for errors */
  corrections: string[];
  /** Motivational message to encourage continued learning */
  encouragement: string;
}

/**
 * Request payload for audio transcription service
 */
export interface TranscriptionRequest {
  /** Base64 encoded audio data (WAV, MP3, or other supported formats) */
  audioData: string;
  /** Optional language code for transcription (e.g., 'en-US', 'es-ES') */
  languageCode?: string;
}

/**
 * Response from audio transcription service
 */
export interface TranscriptionResponse {
  /** The transcribed text from the audio input */
  transcript: string;
  /** Confidence score of the transcription (0.0 - 1.0) */
  confidence: number;
}

/**
 * Metadata for available AI agent personalities
 */
export interface AgentInfo {
  /** Unique identifier for the agent */
  id: string;
  /** Display name of the agent */
  name: string;
  /** Personality type (e.g., 'friendly-tutor', 'strict-teacher') */
  personality: string;
  /** Description of the agent's teaching style and approach */
  description: string;
  /** Optional avatar image URL */
  avatar?: string;
}

/**
 * Conversation message in session history
 */
export interface ConversationMessage {
  /** Unique message identifier */
  id: string;
  /** Message sender: either user or AI agent */
  sender: 'user' | 'agent';
  /** Text content of the message */
  content: string;
  /** ISO timestamp when message was sent */
  timestamp: string;
  /** Optional URL to audio recording of the message */
  audioUrl?: string;
}

/**
 * Centralized API service for LanguagePeer frontend
 * Handles all HTTP communication with the backend services
 * Provides methods for conversation, transcription, and speech synthesis
 */
class ApiService {
  private baseUrl: string;

  /**
   * Initialize the API service with the configured base URL
   */
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Generic HTTP request handler with error handling, retry logic, and JSON parsing
   * Implements exponential backoff retry strategy for mobile network reliability
   * 
   * Mobile Network Optimization Strategy:
   * This implementation addresses common mobile network challenges:
   * 1. Shorter timeout (15s vs 30s) prevents long waits on slow connections
   * 2. Retry logic with exponential backoff handles temporary network drops
   * 3. Detailed logging helps diagnose network issues in production
   * 
   * The retry strategy uses exponential backoff to avoid overwhelming
   * servers while giving temporary network issues time to resolve.
   * 
   * @param endpoint - API endpoint path (e.g., '/conversation', '/transcribe')
   * @param options - Fetch API options (method, body, headers, etc.)
   * @returns Promise resolving to the parsed JSON response
   * @throws Error if all retry attempts fail or return non-2xx status
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default headers for JSON API communication
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Merge default options with provided options
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Mobile-optimized timeout to prevent long waits on slow connections
      signal: AbortSignal.timeout(MOBILE_NETWORK_TIMEOUT_MS),
    };

    // Retry logic with exponential backoff for mobile network resilience
    // This handles temporary network issues common on mobile devices
    const maxRetries = MAX_RETRY_ATTEMPTS;
    let finalError: Error = new Error('Request failed after all retry attempts');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API request attempt ${attempt + 1} for ${endpoint}`);
        
        const response = await fetch(url, config);
        
        // Check if the response status indicates success (2xx)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Success - return parsed JSON response
        return await response.json();
      } catch (error) {
        finalError = error as Error;
        console.warn(`API request attempt ${attempt + 1} failed for ${endpoint}:`, error);
        
        // Don't retry on the last attempt - throw the error instead
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: wait progressively longer between retries
        // Delays: 1s, 2s to avoid overwhelming the server
        const delay = Math.pow(2, attempt) * RETRY_BASE_DELAY_MS;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retry attempts exhausted - throw the last error encountered
    console.error(`All API request attempts failed for ${endpoint}:`, finalError);
    throw finalError;
  }

  /**
   * Check the health status of the API backend
   * @returns Promise resolving to health status and timestamp
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest('/health');
  }

  /**
   * Send a message to an AI agent and receive a response with feedback
   * @param request - Conversation request containing message, agent ID, and optional audio
   * @returns Promise resolving to agent response with feedback and audio URL
   */
  async sendMessage(request: ConversationRequest): Promise<ConversationResponse> {
    return this.makeRequest('/conversation', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Convert audio data to text using speech recognition
   * @param request - Transcription request with base64 audio data and language code
   * @returns Promise resolving to transcribed text and confidence score
   */
  async transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    return this.makeRequest('/transcribe', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Generate speech audio from text using text-to-speech synthesis
   * @param text - Text content to convert to speech
   * @param voiceId - Optional voice ID for specific voice characteristics
   * @returns Promise resolving to audio URL for playback
   */
  async synthesizeSpeech(text: string, voiceId?: string): Promise<{ audioUrl: string }> {
    return this.makeRequest('/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    });
  }

  /**
   * Retrieve list of available AI agent personalities
   * @returns Promise resolving to array of agent metadata
   */
  async getAgents(): Promise<AgentInfo[]> {
    return this.makeRequest('/agents');
  }

  /**
   * Start a new conversation session with a specific agent
   * @param agentId - ID of the agent personality to use
   * @param userId - Optional user ID for personalized experience
   * @returns Promise resolving to new session ID
   */
  async startSession(agentId: string, userId?: string): Promise<{ sessionId: string }> {
    return this.makeRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify({ agentId, userId }),
    });
  }

  /**
   * End an active conversation session
   * @param sessionId - ID of the session to terminate
   * @returns Promise resolving to success confirmation
   */
  async endSession(sessionId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Retrieve the message history for a conversation session
   * @param sessionId - ID of the session to get history for
   * @returns Promise resolving to array of conversation messages
   */
  async getSessionHistory(sessionId: string): Promise<{
    messages: ConversationMessage[];
  }> {
    return this.makeRequest(`/sessions/${sessionId}/history`);
  }
}

/**
 * Utility function to convert a Blob object to base64 string
 * Commonly used for converting recorded audio to API-compatible format
 * @param blob - Blob object (typically from MediaRecorder)
 * @returns Promise resolving to base64 encoded string (without data URL prefix)
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
      // to get just the base64 encoded content
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Create and export singleton instance for use throughout the application
export const apiService = new ApiService();
export default apiService;