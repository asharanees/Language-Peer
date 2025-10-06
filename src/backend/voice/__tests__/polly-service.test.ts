import { PollyService, PollyConfig, SSMLConfig } from '../polly-service';
import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AgentPersonality } from '@/shared/types';
import { AGENT_PERSONALITIES } from '@/shared/constants';

// Mock AWS SDK
jest.mock('@aws-sdk/client-polly');
jest.mock('@aws-sdk/client-s3');

describe('PollyService', () => {
  let pollyService: PollyService;
  let mockPollyClient: jest.Mocked<PollyClient>;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockAgentPersonality: AgentPersonality;
  let mockAudioBuffer: Buffer;

  beforeEach(() => {
    // Setup mocks
    mockPollyClient = {
      send: jest.fn()
    } as any;

    mockS3Client = {
      send: jest.fn()
    } as any;

    (PollyClient as jest.Mock).mockImplementation(() => mockPollyClient);
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    // Mock audio buffer
    mockAudioBuffer = Buffer.from('mock-audio-data');

    // Mock agent personality
    mockAgentPersonality = {
      id: AGENT_PERSONALITIES.FRIENDLY_TUTOR,
      name: 'Maya - Friendly Tutor',
      traits: ['encouraging', 'patient', 'supportive'],
      conversationStyle: 'friendly-tutor',
      supportiveApproach: {
        errorHandling: 'gentle-correction',
        encouragementFrequency: 'high',
        difficultyAdjustment: 'automatic'
      },
      voiceCharacteristics: {
        voiceId: 'Joanna',
        engine: 'neural',
        languageCode: 'en-US',
        speakingRate: 'medium',
        pitch: 'medium'
      },
      specialties: ['conversation-practice', 'confidence-building'],
      systemPrompt: 'You are Maya, a friendly and encouraging language tutor.'
    };

    // Create service instance
    pollyService = new PollyService('us-east-1', 'test-audio-bucket');

    // Mock available voices
    mockPollyClient.send.mockImplementation((command) => {
      if (command instanceof DescribeVoicesCommand) {
        return Promise.resolve({
          Voices: [
            {
              Id: 'Joanna',
              Name: 'Joanna',
              Gender: 'Female',
              LanguageCode: 'en-US',
              LanguageName: 'US English',
              SupportedEngines: ['standard', 'neural']
            },
            {
              Id: 'Matthew',
              Name: 'Matthew',
              Gender: 'Male',
              LanguageCode: 'en-US',
              LanguageName: 'US English',
              SupportedEngines: ['standard', 'neural']
            }
          ]
        });
      }
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('synthesizeWithPersonality', () => {
    test('synthesizes speech with agent personality matching', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 20
      });

      const text = 'Great job! Keep practicing.';
      const result = await pollyService.synthesizeWithPersonality(text, mockAgentPersonality);

      expect(result.audioStream).toEqual(mockAudioBuffer);
      expect(result.contentType).toBe('audio/mpeg');
      expect(result.requestCharacters).toBe(20);

      expect(mockPollyClient.send).toHaveBeenCalledWith(
        expect.any(SynthesizeSpeechCommand)
      );

      // Verify the command was called with correct voice
      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.VoiceId).toBe('Joanna');
      expect(command.input.Engine).toBe('neural');
    });

    test('applies SSML enhancements based on personality', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 50
      });

      const ssmlConfig: SSMLConfig = {
        speakingRate: 'slow',
        pitch: 'high',
        emphasis: 'strong'
      };

      const text = 'Excellent pronunciation!';
      await pollyService.synthesizeWithPersonality(text, mockAgentPersonality, ssmlConfig);

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.TextType).toBe('ssml');
      expect(command.input.Text).toContain('<speak>');
      expect(command.input.Text).toContain('<prosody');
    });

    test('handles different personality types', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 30
      });

      const strictTeacherPersonality: AgentPersonality = {
        ...mockAgentPersonality,
        conversationStyle: 'strict-teacher',
        voiceCharacteristics: {
          voiceId: 'Matthew',
          engine: 'neural',
          languageCode: 'en-US',
          speakingRate: 'slow',
          pitch: 'low'
        }
      };

      await pollyService.synthesizeWithPersonality('Listen carefully.', strictTeacherPersonality);

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.VoiceId).toBe('Matthew');
    });
  });

  describe('synthesizeSpeech', () => {
    test('synthesizes speech with basic configuration', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 15
      });

      const config: PollyConfig = {
        voiceId: 'Joanna',
        engine: 'neural',
        languageCode: 'en-US',
        outputFormat: 'mp3',
        sampleRate: '22050'
      };

      const result = await pollyService.synthesizeSpeech('Hello world', config);

      expect(result.audioStream).toEqual(mockAudioBuffer);
      expect(result.contentType).toBe('audio/mpeg');
      expect(mockPollyClient.send).toHaveBeenCalledWith(
        expect.any(SynthesizeSpeechCommand)
      );
    });

    test('validates input before synthesis', async () => {
      const config: PollyConfig = {
        voiceId: 'Joanna',
        engine: 'neural',
        languageCode: 'en-US',
        outputFormat: 'mp3',
        sampleRate: '22050'
      };

      // Test empty text
      await expect(
        pollyService.synthesizeSpeech('', config)
      ).rejects.toThrow('Text cannot be empty');

      // Test text too long
      const longText = 'a'.repeat(3001);
      await expect(
        pollyService.synthesizeSpeech(longText, config)
      ).rejects.toThrow('Text too long');

      // Test invalid voice
      const invalidConfig = { ...config, voiceId: 'InvalidVoice' as any };
      await expect(
        pollyService.synthesizeSpeech('Hello', invalidConfig)
      ).rejects.toThrow('Voice InvalidVoice is not available');
    });

    test('handles SSML input correctly', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 50
      });

      const ssmlText = '<speak><prosody rate="slow">Hello world</prosody></speak>';
      const config: PollyConfig = {
        voiceId: 'Joanna',
        engine: 'neural',
        languageCode: 'en-US',
        outputFormat: 'mp3',
        sampleRate: '22050',
        textType: 'ssml'
      };

      await pollyService.synthesizeSpeech(ssmlText, config);

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.TextType).toBe('ssml');
      expect(command.input.Text).toBe(ssmlText);
    });
  });

  describe('generatePronunciationGuide', () => {
    test('creates pronunciation guide with SSML', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 100
      });

      const result = await pollyService.generatePronunciationGuide(
        'hello',
        'həˈloʊ',
        'en-US',
        2
      );

      expect(result.audioStream).toEqual(mockAudioBuffer);

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.TextType).toBe('ssml');
      expect(command.input.Text).toContain('<phoneme');
      expect(command.input.Text).toContain('həˈloʊ');
      expect(command.input.Text).toContain('hello');
    });

    test('includes correct number of repetitions', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 150
      });

      await pollyService.generatePronunciationGuide('world', 'wɜːrld', 'en-US', 3);

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      const ssmlText = command.input.Text as string;
      
      // Count occurrences of the phoneme tag (should be repetitions + 1 for the example)
      const phonemeCount = (ssmlText.match(/<phoneme/g) || []).length;
      expect(phonemeCount).toBe(4); // 1 example + 3 repetitions
    });
  });

  describe('createConversationalResponse', () => {
    test('creates response with encouragement context', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 25
      });

      const context = {
        isEncouragement: true,
        emotionalTone: 'excited' as const
      };

      await pollyService.createConversationalResponse(
        'Fantastic work!',
        mockAgentPersonality,
        context
      );

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.Text).toContain('<prosody');
      expect(command.input.TextType).toBe('ssml');
    });

    test('creates response with correction context', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 40
      });

      const context = {
        isCorrection: true,
        emotionalTone: 'calm' as const
      };

      await pollyService.createConversationalResponse(
        'Let me help you with that pronunciation.',
        mockAgentPersonality,
        context
      );

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.Text).toContain('<break time="300ms"/>');
    });

    test('handles question context with pitch adjustment', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: mockAudioBuffer,
        ContentType: 'audio/mpeg',
        RequestCharacters: 30
      });

      const context = {
        isQuestion: true,
        emotionalTone: 'playful' as const
      };

      await pollyService.createConversationalResponse(
        'How was your weekend?',
        mockAgentPersonality,
        context
      );

      const command = mockPollyClient.send.mock.calls[1][0] as SynthesizeSpeechCommand;
      expect(command.input.Text).toContain('<prosody');
    });
  });

  describe('storeAudioInS3', () => {
    test('stores audio in S3 and returns URL', async () => {
      mockS3Client.send.mockResolvedValue({});

      const sessionId = 'session-123';
      const messageId = 'msg-456';
      
      const url = await pollyService.storeAudioInS3(mockAudioBuffer, sessionId, messageId);

      expect(url).toBe(`https://test-audio-bucket.s3.amazonaws.com/sessions/${sessionId}/audio/${messageId}.mp3`);
      
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand)
      );

      const command = mockS3Client.send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Bucket).toBe('test-audio-bucket');
      expect(command.input.Key).toBe(`sessions/${sessionId}/audio/${messageId}.mp3`);
      expect(command.input.Body).toBe(mockAudioBuffer);
      expect(command.input.ContentType).toBe('audio/mpeg');
    });

    test('includes metadata in S3 object', async () => {
      mockS3Client.send.mockResolvedValue({});

      await pollyService.storeAudioInS3(mockAudioBuffer, 'session-123', 'msg-456');

      const command = mockS3Client.send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input.Metadata).toEqual({
        sessionId: 'session-123',
        messageId: 'msg-456',
        generatedAt: expect.any(String)
      });
    });

    test('handles S3 storage errors', async () => {
      mockS3Client.send.mockRejectedValue(new Error('S3 error'));

      await expect(
        pollyService.storeAudioInS3(mockAudioBuffer, 'session-123', 'msg-456')
      ).rejects.toThrow('Failed to store audio');
    });
  });

  describe('getVoicesForLanguage', () => {
    test('retrieves voices for specific language', async () => {
      const mockVoices = [
        {
          Id: 'Joanna',
          Name: 'Joanna',
          Gender: 'Female',
          LanguageCode: 'en-US'
        },
        {
          Id: 'Matthew',
          Name: 'Matthew',
          Gender: 'Male',
          LanguageCode: 'en-US'
        }
      ];

      mockPollyClient.send.mockResolvedValue({
        Voices: mockVoices
      });

      const voices = await pollyService.getVoicesForLanguage('en-US');

      expect(voices).toEqual(mockVoices);
      expect(mockPollyClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { LanguageCode: 'en-US' }
        })
      );
    });

    test('handles API errors gracefully', async () => {
      mockPollyClient.send.mockRejectedValue(new Error('API error'));

      const voices = await pollyService.getVoicesForLanguage('en-US');

      expect(voices).toEqual([]);
    });
  });

  describe('getVoiceCharacteristics', () => {
    test('returns characteristics for known voice', () => {
      const characteristics = pollyService.getVoiceCharacteristics('Joanna');

      expect(characteristics).toEqual({
        gender: 'Female',
        age: 'Adult',
        accent: 'US English',
        style: 'conversational',
        supportedEngines: ['standard', 'neural']
      });
    });

    test('returns null for unknown voice', () => {
      const characteristics = pollyService.getVoiceCharacteristics('UnknownVoice');

      expect(characteristics).toBeNull();
    });

    test('returns default characteristics for unlisted voice', async () => {
      // Add a voice that's not in the predefined characteristics
      mockPollyClient.send.mockResolvedValue({
        Voices: [{
          Id: 'NewVoice',
          Name: 'NewVoice',
          Gender: 'Female',
          LanguageCode: 'fr-FR',
          LanguageName: 'French',
          SupportedEngines: ['standard']
        }]
      });

      // Reinitialize to load the new voice
      pollyService = new PollyService('us-east-1', 'test-audio-bucket');
      
      const characteristics = pollyService.getVoiceCharacteristics('NewVoice');

      expect(characteristics).toEqual({
        gender: 'Female',
        age: 'Adult',
        accent: 'French',
        style: 'conversational',
        supportedEngines: ['standard']
      });
    });
  });

  describe('error handling', () => {
    test('handles Polly service errors', async () => {
      mockPollyClient.send.mockRejectedValue(new Error('Polly service error'));

      const config: PollyConfig = {
        voiceId: 'Joanna',
        engine: 'neural',
        languageCode: 'en-US',
        outputFormat: 'mp3',
        sampleRate: '22050'
      };

      await expect(
        pollyService.synthesizeSpeech('Hello', config)
      ).rejects.toThrow('Failed to synthesize speech');
    });

    test('handles missing audio stream', async () => {
      mockPollyClient.send.mockResolvedValue({
        AudioStream: null,
        ContentType: 'audio/mpeg'
      });

      const config: PollyConfig = {
        voiceId: 'Joanna',
        engine: 'neural',
        languageCode: 'en-US',
        outputFormat: 'mp3',
        sampleRate: '22050'
      };

      await expect(
        pollyService.synthesizeSpeech('Hello', config)
      ).rejects.toThrow('No audio stream received from Polly');
    });
  });
});