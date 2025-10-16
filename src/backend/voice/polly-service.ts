import { 
  PollyClient, 
  SynthesizeSpeechCommand,
  DescribeVoicesCommand,
  Voice,
  Engine,
  OutputFormat,
  TextType,
  VoiceId
} from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PollyResponse, AgentPersonality } from '../../shared/types';
import { POLLY_VOICES, AUDIO_CONFIG } from '../../shared/constants';

export interface PollyConfig {
  voiceId: VoiceId;
  engine: Engine;
  languageCode: string;
  outputFormat: OutputFormat;
  sampleRate: string;
  textType?: TextType;
  lexiconNames?: string[];
  speechMarkTypes?: string[];
}

export interface SSMLConfig {
  speakingRate?: string;
  pitch?: string;
  volume?: string;
  emphasis?: 'strong' | 'moderate' | 'reduced';
  pauseTime?: string;
  prosodyRate?: string;
  prosodyPitch?: string;
  prosodyVolume?: string;
}

export interface VoiceCharacteristics {
  gender: 'Male' | 'Female';
  age: 'Adult' | 'Child';
  accent: string;
  style: 'conversational' | 'newscaster' | 'friendly' | 'authoritative';
  supportedEngines: Engine[];
}

export class PollyService {
  private pollyClient: PollyClient;
  private s3Client: S3Client;
  private audioBucket: string;
  private availableVoices: Map<string, Voice> = new Map();

  constructor(region?: string, audioBucket?: string) {
    this.pollyClient = new PollyClient({
      region: region || process.env.AWS_REGION || 'us-east-1'
    });
    this.s3Client = new S3Client({
      region: region || process.env.AWS_REGION || 'us-east-1'
    });
    this.audioBucket = audioBucket || process.env.AUDIO_BUCKET_NAME || 'languagepeer-audio';
    
    // Initialize available voices
    this.initializeVoices();
  }

  /**
   * Synthesize speech from text with agent personality matching
   */
  async synthesizeWithPersonality(
    text: string,
    agentPersonality: AgentPersonality,
    ssmlConfig?: SSMLConfig
  ): Promise<PollyResponse> {
    try {
      // Select voice based on agent personality
      const voiceConfig = this.selectVoiceForPersonality(agentPersonality);
      
      // Apply SSML enhancements based on personality and config
      const processedText = this.applySSMLEnhancements(text, agentPersonality, ssmlConfig);
      
      // Configure Polly parameters
      const pollyConfig: PollyConfig = {
        voiceId: voiceConfig.voiceId as VoiceId,
        engine: voiceConfig.engine,
        languageCode: voiceConfig.languageCode,
        outputFormat: 'mp3',
        sampleRate: '22050',
        textType: processedText.includes('<speak>') ? 'ssml' : 'text'
      };

      return await this.synthesizeSpeech(processedText, pollyConfig);

    } catch (error) {
      console.error('Error synthesizing speech with personality:', error);
      throw new Error(`Failed to synthesize speech: ${error}`);
    }
  }

  /**
   * Synthesize speech from text or SSML
   */
  async synthesizeSpeech(text: string, config: PollyConfig): Promise<PollyResponse> {
    try {
      // Validate input
      this.validateSynthesisInput(text, config);

      const command = new SynthesizeSpeechCommand({
        Text: text,
        VoiceId: config.voiceId,
        Engine: config.engine,
        LanguageCode: config.languageCode as any, // Type assertion for AWS SDK compatibility
        OutputFormat: config.outputFormat,
        SampleRate: config.sampleRate,
        TextType: config.textType || 'text',
        LexiconNames: config.lexiconNames,
        SpeechMarkTypes: config.speechMarkTypes as any // Type assertion for AWS SDK compatibility
      });

      const response = await this.pollyClient.send(command);

      if (!response.AudioStream) {
        throw new Error('No audio stream received from Polly');
      }

      // Convert stream to buffer
      const audioBuffer = await this.streamToBuffer(response.AudioStream);

      return {
        audioStream: audioBuffer,
        contentType: response.ContentType || 'audio/mpeg',
        requestCharacters: response.RequestCharacters || text.length
      };

    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw new Error(`Failed to synthesize speech: ${error}`);
    }
  }

  /**
   * Generate pronunciation guidance with SSML
   */
  async generatePronunciationGuide(
    word: string,
    phonetic: string,
    languageCode: string,
    repetitions: number = 3
  ): Promise<PollyResponse> {
    try {
      // Create SSML for pronunciation guidance
      const ssml = `
        <speak>
          <prosody rate="slow">
            Let's practice the word: <emphasis level="strong">${word}</emphasis>.
            <break time="500ms"/>
            Listen carefully: <phoneme alphabet="ipa" ph="${phonetic}">${word}</phoneme>.
            <break time="1s"/>
            Now repeat after me:
            ${Array(repetitions).fill(0).map((_, i) => `
              <break time="1s"/>
              <phoneme alphabet="ipa" ph="${phonetic}">${word}</phoneme>
              <break time="2s"/>
            `).join('')}
          </prosody>
        </speak>
      `;

      const config: PollyConfig = {
        voiceId: this.selectBestVoiceForLanguage(languageCode),
        engine: 'neural',
        languageCode,
        outputFormat: 'mp3',
        sampleRate: '22050',
        textType: 'ssml'
      };

      return await this.synthesizeSpeech(ssml, config);

    } catch (error) {
      console.error('Error generating pronunciation guide:', error);
      throw new Error(`Failed to generate pronunciation guide: ${error}`);
    }
  }

  /**
   * Create conversational response with natural pauses and emphasis
   */
  async createConversationalResponse(
    content: string,
    agentPersonality: AgentPersonality,
    context: {
      isEncouragement?: boolean;
      isCorrection?: boolean;
      isQuestion?: boolean;
      emotionalTone?: 'excited' | 'calm' | 'serious' | 'playful';
    }
  ): Promise<PollyResponse> {
    try {
      // Apply conversational SSML based on context
      const ssmlConfig: SSMLConfig = this.getSSMLForContext(context, agentPersonality);
      
      return await this.synthesizeWithPersonality(content, agentPersonality, ssmlConfig);

    } catch (error) {
      console.error('Error creating conversational response:', error);
      throw new Error(`Failed to create conversational response: ${error}`);
    }
  }

  /**
   * Store audio in S3 and return URL
   */
  async storeAudioInS3(audioBuffer: Buffer, sessionId: string, messageId: string): Promise<string> {
    try {
      const key = `sessions/${sessionId}/audio/${messageId}.mp3`;
      
      const command = new PutObjectCommand({
        Bucket: this.audioBucket,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        CacheControl: 'max-age=31536000', // 1 year
        Metadata: {
          sessionId,
          messageId,
          generatedAt: new Date().toISOString()
        }
      });

      await this.s3Client.send(command);

      return `https://${this.audioBucket}.s3.amazonaws.com/${key}`;

    } catch (error) {
      console.error('Error storing audio in S3:', error);
      throw new Error(`Failed to store audio: ${error}`);
    }
  }

  /**
   * Get available voices for a language
   */
  async getVoicesForLanguage(languageCode: string): Promise<Voice[]> {
    try {
      const command = new DescribeVoicesCommand({
        LanguageCode: languageCode as any // Type assertion for AWS SDK compatibility
      });

      const response = await this.pollyClient.send(command);
      return response.Voices || [];

    } catch (error) {
      console.error('Error getting voices for language:', error);
      return [];
    }
  }

  /**
   * Get voice characteristics
   */
  getVoiceCharacteristics(voiceId: string): VoiceCharacteristics | null {
    const voice = this.availableVoices.get(voiceId);
    if (!voice) return null;

    // Define characteristics based on known Polly voices
    const characteristics: Record<string, VoiceCharacteristics> = {
      'Joanna': {
        gender: 'Female',
        age: 'Adult',
        accent: 'US English',
        style: 'conversational',
        supportedEngines: ['standard', 'neural']
      },
      'Matthew': {
        gender: 'Male',
        age: 'Adult',
        accent: 'US English',
        style: 'authoritative',
        supportedEngines: ['standard', 'neural']
      },
      'Amy': {
        gender: 'Female',
        age: 'Adult',
        accent: 'British English',
        style: 'friendly',
        supportedEngines: ['standard', 'neural']
      },
      'Brian': {
        gender: 'Male',
        age: 'Adult',
        accent: 'British English',
        style: 'conversational',
        supportedEngines: ['standard', 'neural']
      },
      'Lucia': {
        gender: 'Female',
        age: 'Adult',
        accent: 'Spanish',
        style: 'friendly',
        supportedEngines: ['standard', 'neural']
      }
    };

    return characteristics[voiceId] || {
      gender: voice.Gender as 'Male' | 'Female',
      age: 'Adult',
      accent: voice.LanguageName || 'Unknown',
      style: 'conversational',
      supportedEngines: voice.SupportedEngines || ['standard']
    };
  }

  /**
   * Private helper methods
   */

  private async initializeVoices(): Promise<void> {
    try {
      const command = new DescribeVoicesCommand({});
      const response = await this.pollyClient.send(command);
      
      if (response.Voices) {
        for (const voice of response.Voices) {
          if (voice.Id) {
            this.availableVoices.set(voice.Id, voice);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing voices:', error);
    }
  }

  private selectVoiceForPersonality(personality: AgentPersonality): {
    voiceId: string;
    engine: Engine;
    languageCode: string;
  } {
    const voiceConfig = personality.voiceCharacteristics;
    
    // Default voice selection based on personality type
    const personalityVoices = {
      'friendly-tutor': { voiceId: 'Joanna', engine: 'neural' as Engine },
      'strict-teacher': { voiceId: 'Matthew', engine: 'neural' as Engine },
      'conversation-partner': { voiceId: 'Amy', engine: 'neural' as Engine },
      'pronunciation-coach': { voiceId: 'Brian', engine: 'neural' as Engine }
    };

    const defaultVoice = personalityVoices[personality.conversationStyle] || 
                        personalityVoices['friendly-tutor'];

    return {
      voiceId: voiceConfig?.voiceId || defaultVoice.voiceId,
      engine: voiceConfig?.engine === 'neural' ? 'neural' : defaultVoice.engine,
      languageCode: voiceConfig?.languageCode || 'en-US'
    };
  }

  private selectBestVoiceForLanguage(languageCode: string): VoiceId {
    // Map language codes to voice categories
    const languageMap: Record<string, keyof typeof POLLY_VOICES> = {
      'en-US': 'ENGLISH',
      'en-GB': 'ENGLISH',
      'es-ES': 'SPANISH',
      'es-US': 'SPANISH',
      'fr-FR': 'FRENCH',
      'fr-CA': 'FRENCH'
    };

    const voiceCategory = languageMap[languageCode] || 'ENGLISH';
    const voices = POLLY_VOICES[voiceCategory];
    
    // Get first available voice from the category
    const voiceKeys = Object.keys(voices) as Array<keyof typeof voices>;
    if (voiceKeys.length > 0) {
      return voices[voiceKeys[0]] as VoiceId;
    }
    
    return 'Joanna'; // Default fallback
  }

  private applySSMLEnhancements(
    text: string,
    personality: AgentPersonality,
    ssmlConfig?: SSMLConfig
  ): string {
    // If already SSML, return as-is
    if (text.includes('<speak>')) {
      return text;
    }

    // Apply personality-based SSML enhancements
    let enhancedText = text;

    // Add natural pauses at sentence boundaries
    enhancedText = enhancedText.replace(/\. /g, '. <break time="300ms"/> ');
    enhancedText = enhancedText.replace(/\? /g, '? <break time="500ms"/> ');
    enhancedText = enhancedText.replace(/! /g, '! <break time="400ms"/> ');

    // Apply personality-specific prosody
    const prosodySettings = this.getProsodyForPersonality(personality, ssmlConfig);
    
    // Wrap in SSML with prosody
    return `
      <speak>
        <prosody rate="${prosodySettings.rate}" pitch="${prosodySettings.pitch}" volume="${prosodySettings.volume}">
          ${enhancedText}
        </prosody>
      </speak>
    `;
  }

  private getProsodyForPersonality(
    personality: AgentPersonality,
    ssmlConfig?: SSMLConfig
  ): { rate: string; pitch: string; volume: string } {
    const defaults = {
      'friendly-tutor': { rate: 'medium', pitch: 'medium', volume: 'medium' },
      'strict-teacher': { rate: 'slow', pitch: 'low', volume: 'loud' },
      'conversation-partner': { rate: 'medium', pitch: 'medium', volume: 'medium' },
      'pronunciation-coach': { rate: 'slow', pitch: 'medium', volume: 'medium' }
    };

    const baseSettings = defaults[personality.conversationStyle] || defaults['friendly-tutor'];

    return {
      rate: ssmlConfig?.prosodyRate || baseSettings.rate,
      pitch: ssmlConfig?.prosodyPitch || baseSettings.pitch,
      volume: ssmlConfig?.prosodyVolume || baseSettings.volume
    };
  }

  private getSSMLForContext(
    context: {
      isEncouragement?: boolean;
      isCorrection?: boolean;
      isQuestion?: boolean;
      emotionalTone?: 'excited' | 'calm' | 'serious' | 'playful';
    },
    personality: AgentPersonality
  ): SSMLConfig {
    const config: SSMLConfig = {};

    if (context.isEncouragement) {
      config.speakingRate = 'medium';
      config.pitch = 'high';
      config.emphasis = 'moderate';
    }

    if (context.isCorrection) {
      config.speakingRate = 'slow';
      config.pitch = 'medium';
      config.pauseTime = '500ms';
    }

    if (context.isQuestion) {
      config.pitch = 'high';
      config.prosodyPitch = '+10%';
    }

    switch (context.emotionalTone) {
      case 'excited':
        config.speakingRate = 'fast';
        config.pitch = 'high';
        config.volume = 'loud';
        break;
      case 'calm':
        config.speakingRate = 'slow';
        config.pitch = 'low';
        config.volume = 'medium';
        break;
      case 'serious':
        config.speakingRate = 'slow';
        config.pitch = 'low';
        config.volume = 'medium';
        break;
      case 'playful':
        config.speakingRate = 'medium';
        config.pitch = 'high';
        config.emphasis = 'strong';
        break;
    }

    return config;
  }

  private validateSynthesisInput(text: string, config: PollyConfig): void {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (text.length > 3000) {
      throw new Error('Text too long (max 3000 characters)');
    }

    if (!config.voiceId) {
      throw new Error('Voice ID is required');
    }

    if (!this.availableVoices.has(config.voiceId)) {
      throw new Error(`Voice ${config.voiceId} is not available`);
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    if (stream instanceof Buffer) {
      return stream;
    }

    // Handle different stream types
    if (typeof stream[Symbol.asyncIterator] === 'function') {
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
    } else if (typeof stream.pipe === 'function') {
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } else {
      // Assume it's already a buffer or can be converted
      return Buffer.from(stream);
    }

    return Buffer.concat(chunks);
  }
}