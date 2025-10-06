import { FluencyAnalyzer, FluencyAnalysisConfig } from '../fluency-analyzer';
import { TranscribeService } from '../../voice/transcribe-service';
import { BedrockClient } from '../../services/bedrock-client';
import { ConversationContext, UserProfile, TranscriptionResult } from '@/shared/types';
import { AUDIO_CONFIG } from '@/shared/constants';

// Mock dependencies
jest.mock('../../voice/transcribe-service');
jest.mock('../../services/bedrock-client');

describe('FluencyAnalyzer', () => {
  let fluencyAnalyzer: FluencyAnalyzer;
  let mockTranscribeService: jest.Mocked<TranscribeService>;
  let mockBedrockClient: jest.Mocked<BedrockClient>;
  let mockContext: ConversationContext;
  let mockConfig: FluencyAnalysisConfig;
  let mockAudioBuffer: Buffer;

  beforeEach(() => {
    // Setup mocks
    mockTranscribeService = {
      transcribeAudioFile: jest.fn(),
      assessAudioQuality: jest.fn()
    } as any;

    mockBedrockClient = {
      invokeModel: jest.fn()
    } as any;

    (TranscribeService as jest.Mock).mockImplementation(() => mockTranscribeService);
    (BedrockClient as jest.Mock).mockImplementation(() => mockBedrockClient);

    // Create analyzer instance
    fluencyAnalyzer = new FluencyAnalyzer('us-east-1');
    (fluencyAnalyzer as any).transcribeService = mockTranscribeService;
    (fluencyAnalyzer as any).bedrockClient = mockBedrockClient;

    // Mock context
    const mockUserProfile: UserProfile = {
      userId: 'test-user-123',
      targetLanguage: 'en-US',
      nativeLanguage: 'es-ES',
      currentLevel: 'intermediate',
      learningGoals: ['conversation-fluency'],
      preferredAgents: [],
      conversationTopics: ['Travel and Culture'],
      progressMetrics: {
        overallImprovement: 0.7,
        grammarProgress: 0.6,
        fluencyProgress: 0.8,
        vocabularyGrowth: 0.5,
        confidenceLevel: 0.7,
        sessionsCompleted: 5,
        totalPracticeTime: 3600,
        streakDays: 3
      },
      lastSessionDate: new Date(),
      totalSessionTime: 3600,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockContext = {
      sessionId: 'test-session-123',
      userId: 'test-user-123',
      conversationHistory: [],
      userProfile: mockUserProfile,
      currentTopic: 'Travel and Culture'
    };

    mockConfig = {
      includeTranscriptionAnalysis: true,
      includePronunciationFeedback: true,
      includeRhythmAnalysis: true,
      targetLanguage: 'en-US',
      strictnessLevel: 'moderate'
    };

    // Create mock audio buffer (16-bit PCM, 1 second at 16kHz)
    mockAudioBuffer = Buffer.alloc(AUDIO_CONFIG.SAMPLE_RATE * 2);
    for (let i = 0; i < mockAudioBuffer.length; i += 2) {
      const sample = Math.sin(2 * Math.PI * 440 * (i / 2) / AUDIO_CONFIG.SAMPLE_RATE) * 16383;
      mockAudioBuffer.writeInt16LE(sample, i);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeFluency', () => {
    test('analyzes fluency with audio and transcription successfully', async () => {
      const testText = 'Hello, how are you today? I am doing well, thank you.';

      // Mock transcription result
      const mockTranscriptionResult: TranscriptionResult = {
        transcript: testText,
        confidence: 0.92,
        languageCode: 'en-US',
        alternatives: []
      };

      // Mock audio quality assessment
      const mockAudioQuality = {
        clarity: 0.85,
        volume: 0.7,
        backgroundNoise: 0.2,
        recommendations: []
      };

      // Mock Bedrock response
      const mockBedrockResponse = {
        content: JSON.stringify({
          fluencyScore: 0.88,
          pronunciationScore: 0.82,
          rhythmScore: 0.75,
          paceScore: 0.80,
          feedback: [
            {
              type: 'pronunciation',
              text: 'Great pronunciation of "today"',
              confidence: 0.9
            }
          ],
          suggestions: [
            'Try to maintain consistent pace throughout'
          ]
        })
      };

      mockTranscribeService.transcribeAudioFile.mockResolvedValue(mockTranscriptionResult);
      mockTranscribeService.assessAudioQuality.mockReturnValue(mockAudioQuality);
      mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);

      const result = await fluencyAnalyzer.analyzeFluency(
        mockAudioBuffer,
        testText,
        mockContext,
        mockConfig
      );

      expect(result.fluencyScore).toBe(0.88);
      expect(result.pronunciationScore).toBe(0.82);
      expect(result.rhythmScore).toBe(0.75);
      expect(result.paceScore).toBe(0.80);
      expect(result.feedback).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
      expect(result.confidence).toBeGreaterThan(0.8);

      expect(mockTranscribeService.transcribeAudioFile).toHaveBeenCalledWith(
        mockAudioBuffer,
        expect.objectContaining({
          languageCode: 'en-US'
        })
      );
      expect(mockBedrockClient.invokeModel).toHaveBeenCalled();
    });

    test('analyzes fluency with text only when no audio provided', async () => {
      const testText = 'This is a test sentence for fluency analysis.';

      const mockBedrockResponse = {
        content: JSON.stringify({
          fluencyScore: 0.75,
          pronunciationScore: 0.0, // No audio
          rhythmScore: 0.70,
          paceScore: 0.0, // No audio
          feedback: [],
          suggestions: ['Consider varying sentence length for better flow']
        })
      };

      mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);

      const result = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        mockContext,
        mockConfig
      );

      expect(result.fluencyScore).toBe(0.75);
      expect(result.pronunciationScore).toBe(0.0);
      expect(result.rhythmScore).toBe(0.70);
      expect(result.paceScore).toBe(0.0);
      expect(result.suggestions).toHaveLength(1);

      expect(mockTranscribeService.transcribeAudioFile).not.toHaveBeenCalled();
      expect(mockBedrockClient.invokeModel).toHaveBeenCalled();
    });

    test('handles transcription service errors gracefully', async () => {
      const testText = 'Test sentence.';

      mockTranscribeService.transcribeAudioFile.mockRejectedValue(
        new Error('Transcription failed')
      );

      const mockBedrockResponse = {
        content: JSON.stringify({
          fluencyScore: 0.70,
          pronunciationScore: 0.0,
          rhythmScore: 0.65,
          paceScore: 0.0,
          feedback: [],
          suggestions: []
        })
      };

      mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);

      const result = await fluencyAnalyzer.analyzeFluency(
        mockAudioBuffer,
        testText,
        mockContext,
        mockConfig
      );

      expect(result.fluencyScore).toBe(0.70);
      expect(result.pronunciationScore).toBe(0.0); // Should fallback when transcription fails
      expect(result.confidence).toBeLessThan(0.8); // Lower confidence due to error
    });

    test('handles Bedrock service errors gracefully', async () => {
      const testText = 'Test sentence.';

      mockBedrockClient.invokeModel.mockRejectedValue(
        new Error('Bedrock service error')
      );

      const result = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        mockContext,
        mockConfig
      );

      // Should provide fallback scores
      expect(result.fluencyScore).toBeGreaterThan(0);
      expect(result.fluencyScore).toBeLessThan(1);
      expect(result.confidence).toBeLessThan(0.7); // Lower confidence due to error
      expect(result.feedback).toHaveLength(0);
    });

    test('applies different strictness levels correctly', async () => {
      const testText = 'Um, well, I think, uh, maybe we should go.'; // Disfluent text

      const mockBedrockResponse = {
        content: JSON.stringify({
          fluencyScore: 0.60,
          pronunciationScore: 0.75,
          rhythmScore: 0.50,
          paceScore: 0.65,
          feedback: [],
          suggestions: []
        })
      };

      mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);

      // Test lenient mode
      const lenientConfig = { ...mockConfig, strictnessLevel: 'lenient' as const };
      const lenientResult = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        mockContext,
        lenientConfig
      );

      // Test strict mode
      const strictConfig = { ...mockConfig, strictnessLevel: 'strict' as const };
      const strictResult = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        mockContext,
        strictConfig
      );

      expect(lenientResult.fluencyScore).toBeGreaterThanOrEqual(strictResult.fluencyScore);
    });

    test('adjusts analysis based on user level', async () => {
      const testText = 'I go store buy food.'; // Simple, potentially broken English

      const mockBedrockResponse = {
        content: JSON.stringify({
          fluencyScore: 0.50,
          pronunciationScore: 0.70,
          rhythmScore: 0.60,
          paceScore: 0.65,
          feedback: [],
          suggestions: []
        })
      };

      mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);

      // Test with beginner user
      const beginnerContext = {
        ...mockContext,
        userProfile: { ...mockContext.userProfile!, currentLevel: 'beginner' as const }
      };

      // Test with advanced user
      const advancedContext = {
        ...mockContext,
        userProfile: { ...mockContext.userProfile!, currentLevel: 'advanced' as const }
      };

      const beginnerResult = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        beginnerContext,
        mockConfig
      );

      const advancedResult = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        advancedContext,
        mockConfig
      );

      // Beginner should get more lenient scoring
      expect(beginnerResult.fluencyScore).toBeGreaterThanOrEqual(advancedResult.fluencyScore);
    });
  });

  describe('pronunciation analysis', () => {
    test('analyzes pronunciation from audio with high confidence', async () => {
      const testText = 'The weather is beautiful today.';

      const mockTranscriptionResult: TranscriptionResult = {
        transcript: testText,
        confidence: 0.95,
        languageCode: 'en-US',
        alternatives: []
      };

      const mockAudioQuality = {
        clarity: 0.90,
        volume: 0.80,
        backgroundNoise: 0.15,
        recommendations: []
      };

      mockTranscribeService.transcribeAudioFile.mockResolvedValue(mockTranscriptionResult);
      mockTranscribeService.assessAudioQuality.mockReturnValue(mockAudioQuality);

      const result = await fluencyAnalyzer.analyzePronunciation(
        mockAudioBuffer,
        testText,
        mockConfig
      );

      expect(result.overallScore).toBeGreaterThan(0.8);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.wordScores).toBeDefined();
      expect(result.problemAreas).toBeDefined();
    });

    test('identifies pronunciation problem areas', async () => {
      const testText = 'I think the weather is nice.';
      const transcribedText = 'I sink ze weaser is nice.'; // Pronunciation errors

      const mockTranscriptionResult: TranscriptionResult = {
        transcript: transcribedText,
        confidence: 0.75,
        languageCode: 'en-US',
        alternatives: []
      };

      const mockAudioQuality = {
        clarity: 0.70,
        volume: 0.75,
        backgroundNoise: 0.25,
        recommendations: []
      };

      mockTranscribeService.transcribeAudioFile.mockResolvedValue(mockTranscriptionResult);
      mockTranscribeService.assessAudioQuality.mockReturnValue(mockAudioQuality);

      const result = await fluencyAnalyzer.analyzePronunciation(
        mockAudioBuffer,
        testText,
        mockConfig
      );

      expect(result.overallScore).toBeLessThan(0.8);
      expect(result.problemAreas.length).toBeGreaterThan(0);
      expect(result.problemAreas.some(area => area.includes('th'))).toBe(true);
    });

    test('handles low quality audio appropriately', async () => {
      const testText = 'Hello world.';

      const mockTranscriptionResult: TranscriptionResult = {
        transcript: 'Helo wold.',
        confidence: 0.40, // Low confidence
        languageCode: 'en-US',
        alternatives: []
      };

      const mockAudioQuality = {
        clarity: 0.30,
        volume: 0.20,
        backgroundNoise: 0.80,
        recommendations: ['Improve microphone quality', 'Reduce background noise']
      };

      mockTranscribeService.transcribeAudioFile.mockResolvedValue(mockTranscriptionResult);
      mockTranscribeService.assessAudioQuality.mockReturnValue(mockAudioQuality);

      const result = await fluencyAnalyzer.analyzePronunciation(
        mockAudioBuffer,
        testText,
        mockConfig
      );

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.recommendations).toContain('Improve microphone quality');
      expect(result.recommendations).toContain('Reduce background noise');
    });
  });

  describe('rhythm and pace analysis', () => {
    test('analyzes speech rhythm from audio timing', async () => {
      const testText = 'This is a test sentence for rhythm analysis.';

      // Mock audio with good rhythm (consistent timing)
      const mockAudioBuffer = Buffer.alloc(AUDIO_CONFIG.SAMPLE_RATE * 3 * 2); // 3 seconds
      
      const result = await fluencyAnalyzer.analyzeRhythm(mockAudioBuffer, testText);

      expect(result.rhythmScore).toBeGreaterThanOrEqual(0);
      expect(result.rhythmScore).toBeLessThanOrEqual(1);
      expect(result.paceScore).toBeGreaterThanOrEqual(0);
      expect(result.paceScore).toBeLessThanOrEqual(1);
      expect(result.wordsPerMinute).toBeGreaterThan(0);
    });

    test('detects speech that is too fast', async () => {
      const testText = 'This is a very long sentence with many words that should be spoken at a reasonable pace but is being rushed through quickly.';

      // Mock very short audio for long text (fast speech)
      const mockAudioBuffer = Buffer.alloc(AUDIO_CONFIG.SAMPLE_RATE * 0.5 * 2); // 0.5 seconds
      
      const result = await fluencyAnalyzer.analyzeRhythm(mockAudioBuffer, testText);

      expect(result.wordsPerMinute).toBeGreaterThan(300); // Very fast
      expect(result.paceScore).toBeLessThan(0.7); // Poor pace score
      expect(result.feedback).toContain('speaking too quickly');
    });

    test('detects speech that is too slow', async () => {
      const testText = 'Short text.';

      // Mock very long audio for short text (slow speech)
      const mockAudioBuffer = Buffer.alloc(AUDIO_CONFIG.SAMPLE_RATE * 10 * 2); // 10 seconds
      
      const result = await fluencyAnalyzer.analyzeRhythm(mockAudioBuffer, testText);

      expect(result.wordsPerMinute).toBeLessThan(60); // Very slow
      expect(result.paceScore).toBeLessThan(0.7); // Poor pace score
      expect(result.feedback).toContain('speaking too slowly');
    });

    test('identifies optimal speaking pace', async () => {
      const testText = 'This sentence has a good number of words for testing optimal pace.';

      // Mock audio with optimal timing (about 150 WPM)
      const wordCount = testText.split(' ').length;
      const optimalDuration = (wordCount / 150) * 60; // 150 WPM in seconds
      const mockAudioBuffer = Buffer.alloc(AUDIO_CONFIG.SAMPLE_RATE * optimalDuration * 2);
      
      const result = await fluencyAnalyzer.analyzeRhythm(mockAudioBuffer, testText);

      expect(result.wordsPerMinute).toBeGreaterThan(120);
      expect(result.wordsPerMinute).toBeLessThan(180);
      expect(result.paceScore).toBeGreaterThan(0.7);
    });
  });

  describe('fluency scoring algorithms', () => {
    test('calculates composite fluency score correctly', async () => {
      const mockScores = {
        pronunciationScore: 0.85,
        rhythmScore: 0.75,
        paceScore: 0.80,
        transcriptionConfidence: 0.90
      };

      const result = (fluencyAnalyzer as any).calculateCompositeFluencyScore(mockScores);

      expect(result).toBeGreaterThan(0.7);
      expect(result).toBeLessThan(1.0);
      expect(typeof result).toBe('number');
    });

    test('weights pronunciation more heavily for beginners', async () => {
      const mockScores = {
        pronunciationScore: 0.90,
        rhythmScore: 0.60,
        paceScore: 0.65,
        transcriptionConfidence: 0.85
      };

      const beginnerScore = (fluencyAnalyzer as any).calculateCompositeFluencyScore(
        mockScores,
        'beginner'
      );

      const advancedScore = (fluencyAnalyzer as any).calculateCompositeFluencyScore(
        mockScores,
        'advanced'
      );

      // Beginner score should be higher due to good pronunciation
      expect(beginnerScore).toBeGreaterThan(advancedScore);
    });

    test('penalizes low transcription confidence appropriately', async () => {
      const highConfidenceScores = {
        pronunciationScore: 0.80,
        rhythmScore: 0.75,
        paceScore: 0.80,
        transcriptionConfidence: 0.95
      };

      const lowConfidenceScores = {
        ...highConfidenceScores,
        transcriptionConfidence: 0.40
      };

      const highConfidenceResult = (fluencyAnalyzer as any).calculateCompositeFluencyScore(
        highConfidenceScores
      );

      const lowConfidenceResult = (fluencyAnalyzer as any).calculateCompositeFluencyScore(
        lowConfidenceScores
      );

      expect(highConfidenceResult).toBeGreaterThan(lowConfidenceResult);
    });
  });

  describe('feedback generation', () => {
    test('generates appropriate pronunciation feedback', async () => {
      const problemAreas = ['th sounds', 'r sounds'];
      const confidence = 0.85;

      const feedback = (fluencyAnalyzer as any).generatePronunciationFeedback(
        problemAreas,
        confidence,
        'intermediate'
      );

      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback.some((f: any) => f.includes('th'))).toBe(true);
      expect(feedback.some((f: any) => f.includes('r'))).toBe(true);
    });

    test('generates appropriate pace feedback', async () => {
      const wordsPerMinute = 250; // Too fast
      const paceScore = 0.45;

      const feedback = (fluencyAnalyzer as any).generatePaceFeedback(
        wordsPerMinute,
        paceScore
      );

      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback.some((f: string) => f.includes('slow down'))).toBe(true);
    });

    test('generates encouraging feedback for good performance', async () => {
      const mockAnalysis = {
        fluencyScore: 0.88,
        pronunciationScore: 0.85,
        rhythmScore: 0.90,
        paceScore: 0.85,
        problemAreas: [],
        wordsPerMinute: 150
      };

      const feedback = (fluencyAnalyzer as any).generateEncouragingFeedback(mockAnalysis);

      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback.some((f: string) => f.toLowerCase().includes('great'))).toBe(true);
    });
  });

  describe('error handling and edge cases', () => {
    test('handles empty text input', async () => {
      const result = await fluencyAnalyzer.analyzeFluency(
        null,
        '',
        mockContext,
        mockConfig
      );

      expect(result.fluencyScore).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.feedback).toContain('No text provided for analysis');
    });

    test('handles very short audio input', async () => {
      const shortAudio = Buffer.alloc(100); // Very short
      const testText = 'Hi.';

      const result = await fluencyAnalyzer.analyzeFluency(
        shortAudio,
        testText,
        mockContext,
        mockConfig
      );

      expect(result.confidence).toBeLessThan(0.7);
      expect(result.feedback).toContain('Audio too short for reliable analysis');
    });

    test('handles mismatched audio and text length', async () => {
      const shortText = 'Hi.';
      const longAudio = Buffer.alloc(AUDIO_CONFIG.SAMPLE_RATE * 10 * 2); // 10 seconds

      mockTranscribeService.transcribeAudioFile.mockResolvedValue({
        transcript: shortText,
        confidence: 0.8,
        languageCode: 'en-US',
        alternatives: []
      });

      const result = await fluencyAnalyzer.analyzeFluency(
        longAudio,
        shortText,
        mockContext,
        mockConfig
      );

      expect(result.confidence).toBeLessThan(0.8);
      expect(result.feedback).toContain('Mismatch between audio length and text');
    });

    test('handles malformed Bedrock responses', async () => {
      const testText = 'Test sentence.';

      mockBedrockClient.invokeModel.mockResolvedValue({
        content: 'Invalid JSON response {malformed'
      });

      const result = await fluencyAnalyzer.analyzeFluency(
        null,
        testText,
        mockContext,
        mockConfig
      );

      // Should provide fallback values
      expect(result.fluencyScore).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });
});