import { S3AudioService, AudioMetadata, AudioUploadResult } from '../s3-audio-service';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AUDIO_CONFIG } from '@/shared/constants';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3AudioService', () => {
  let s3AudioService: S3AudioService;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockAudioBuffer: Buffer;
  let mockMetadata: AudioMetadata;

  beforeEach(() => {
    // Setup mocks
    mockS3Client = {
      send: jest.fn()
    } as any;

    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
    (getSignedUrl as jest.Mock).mockResolvedValue('https://mock-presigned-url.com');

    // Create service instance
    s3AudioService = new S3AudioService('test-audio-bucket', 'us-east-1');

    // Mock audio buffer (WAV format with proper headers)
    mockAudioBuffer = Buffer.alloc(1024);
    // Add WAV headers
    mockAudioBuffer.write('RIFF', 0, 'ascii');
    mockAudioBuffer.writeUInt32LE(1016, 4); // File size - 8
    mockAudioBuffer.write('WAVE', 8, 'ascii');
    
    // Fill rest with sample audio data
    for (let i = 44; i < mockAudioBuffer.length; i += 2) {
      const sample = Math.sin(2 * Math.PI * 440 * (i / 2) / AUDIO_CONFIG.SAMPLE_RATE) * 16383;
      mockAudioBuffer.writeInt16LE(sample, i);
    }

    mockMetadata = {
      originalName: 'test-recording.wav',
      contentType: 'audio/wav',
      size: mockAudioBuffer.length,
      duration: 1.0,
      sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      channels: 1,
      uploadedAt: new Date(),
      userId: 'test-user-123',
      sessionId: 'test-session-456'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadAudio', () => {
    test('uploads audio file successfully', async () => {
      mockS3Client.send.mockResolvedValue({});

      const result = await s3AudioService.uploadAudio(
        mockAudioBuffer,
        mockMetadata,
        'test-user-123',
        'test-session-456'
      );

      expect(result.audioUrl).toBe('https://mock-presigned-url.com');
      expect(result.audioKey).toMatch(/^audio\/test-user-123\/test-session-456\/\d+_.+\.wav$/);
      expect(result.uploadId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand)
      );
    });

    test('validates audio data before upload', async () => {
      // Test empty buffer
      const emptyBuffer = Buffer.alloc(0);
      await expect(
        s3AudioService.uploadAudio(emptyBuffer, mockMetadata)
      ).rejects.toThrow('Audio data cannot be empty');

      // Test oversized buffer
      const oversizedBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      await expect(
        s3AudioService.uploadAudio(oversizedBuffer, mockMetadata)
      ).rejects.toThrow('Audio file too large');

      // Test unsupported content type
      const invalidMetadata = { ...mockMetadata, contentType: 'video/mp4' };
      await expect(
        s3AudioService.uploadAudio(mockAudioBuffer, invalidMetadata)
      ).rejects.toThrow('Unsupported audio format');
    });

    test('validates WAV file format', async () => {
      // Create invalid WAV buffer (too small)
      const tinyBuffer = Buffer.alloc(20);
      await expect(
        s3AudioService.uploadAudio(tinyBuffer, mockMetadata)
      ).rejects.toThrow('Invalid WAV file: too small');

      // Create buffer without proper WAV headers
      const invalidWavBuffer = Buffer.alloc(1024);
      invalidWavBuffer.write('INVALID', 0, 'ascii');
      await expect(
        s3AudioService.uploadAudio(invalidWavBuffer, mockMetadata)
      ).rejects.toThrow('Invalid WAV file: missing RIFF/WAVE headers');
    });

    test('handles S3 upload errors', async () => {
      mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

      await expect(
        s3AudioService.uploadAudio(mockAudioBuffer, mockMetadata)
      ).rejects.toThrow('Failed to upload audio');
    });

    test('generates correct S3 metadata', async () => {
      mockS3Client.send.mockResolvedValue({});

      await s3AudioService.uploadAudio(
        mockAudioBuffer,
        mockMetadata,
        'test-user-123',
        'test-session-456'
      );

      const putCommand = mockS3Client.send.mock.calls[0][0] as PutObjectCommand;
      expect(putCommand.input.Metadata).toEqual({
        'original-name': 'test-recording.wav',
        'content-type': 'audio/wav',
        'size': mockAudioBuffer.length.toString(),
        'duration': '1',
        'sample-rate': AUDIO_CONFIG.SAMPLE_RATE.toString(),
        'channels': '1',
        'uploaded-at': expect.any(String),
        'user-id': 'test-user-123',
        'session-id': 'test-session-456'
      });
    });
  });

  describe('getAudio', () => {
    test('retrieves audio file successfully', async () => {
      const mockHeadResponse = {
        ContentType: 'audio/wav',
        ContentLength: mockAudioBuffer.length,
        Metadata: {
          'original-name': 'test-recording.wav',
          'duration': '1.0',
          'sample-rate': AUDIO_CONFIG.SAMPLE_RATE.toString(),
          'channels': '1',
          'uploaded-at': new Date().toISOString(),
          'user-id': 'test-user-123',
          'session-id': 'test-session-456'
        }
      };

      const mockGetResponse = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(mockAudioBuffer);
            } else if (event === 'end') {
              callback();
            }
          })
        }
      };

      mockS3Client.send
        .mockResolvedValueOnce(mockHeadResponse) // HeadObjectCommand
        .mockResolvedValueOnce(mockGetResponse); // GetObjectCommand

      const result = await s3AudioService.getAudio('test-audio-key');

      expect(result.audioBuffer).toEqual(mockAudioBuffer);
      expect(result.metadata.originalName).toBe('test-recording.wav');
      expect(result.metadata.contentType).toBe('audio/wav');
      expect(result.metadata.size).toBe(mockAudioBuffer.length);
      expect(result.metadata.duration).toBe(1.0);
      expect(result.metadata.userId).toBe('test-user-123');

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(HeadObjectCommand)
      );
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      );
    });

    test('handles missing audio file', async () => {
      mockS3Client.send.mockRejectedValue(new Error('NoSuchKey'));

      await expect(
        s3AudioService.getAudio('non-existent-key')
      ).rejects.toThrow('Failed to retrieve audio');
    });

    test('handles missing body in response', async () => {
      mockS3Client.send
        .mockResolvedValueOnce({ ContentType: 'audio/wav' }) // HeadObjectCommand
        .mockResolvedValueOnce({ Body: null }); // GetObjectCommand

      await expect(
        s3AudioService.getAudio('test-key')
      ).rejects.toThrow('No audio data found');
    });
  });

  describe('deleteAudio', () => {
    test('deletes audio file successfully', async () => {
      mockS3Client.send.mockResolvedValue({});

      await s3AudioService.deleteAudio('test-audio-key');

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand)
      );
    });

    test('handles deletion errors', async () => {
      mockS3Client.send.mockRejectedValue(new Error('Access denied'));

      await expect(
        s3AudioService.deleteAudio('test-key')
      ).rejects.toThrow('Failed to delete audio');
    });
  });

  describe('generateUploadUrl', () => {
    test('generates presigned upload URL', async () => {
      const result = await s3AudioService.generateUploadUrl(
        'test-user-123',
        'test-session-456',
        'audio/wav',
        300
      );

      expect(result.uploadUrl).toBe('https://mock-presigned-url.com');
      expect(result.audioKey).toMatch(/^audio\/test-user-123\/test-session-456\/\d+_.+\.wav$/);
      expect(result.expiresAt).toBeInstanceOf(Date);

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 300 }
      );
    });

    test('handles different content types', async () => {
      await s3AudioService.generateUploadUrl(
        'test-user',
        'test-session',
        'audio/mp3'
      );

      const result = await s3AudioService.generateUploadUrl(
        'test-user',
        'test-session',
        'audio/mp3'
      );

      expect(result.audioKey).toMatch(/\.mp3$/);
    });

    test('handles presigned URL generation errors', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('URL generation failed'));

      await expect(
        s3AudioService.generateUploadUrl('user', 'session')
      ).rejects.toThrow('Failed to generate upload URL');
    });
  });

  describe('listAudioFiles', () => {
    test('lists audio files for user and session', async () => {
      const mockListResponse = {
        Contents: [
          {
            Key: 'audio/test-user/test-session/1234567890_abc123.wav',
            Size: 1024,
            LastModified: new Date()
          },
          {
            Key: 'audio/test-user/test-session/1234567891_def456.wav',
            Size: 2048,
            LastModified: new Date()
          }
        ]
      };

      const mockHeadResponse = {
        ContentType: 'audio/wav',
        Metadata: {
          'original-name': 'recording.wav',
          'duration': '2.5',
          'user-id': 'test-user',
          'session-id': 'test-session'
        }
      };

      mockS3Client.send
        .mockResolvedValueOnce(mockListResponse) // ListObjectsV2Command
        .mockResolvedValue(mockHeadResponse); // HeadObjectCommand (for each file)

      const result = await s3AudioService.listAudioFiles('test-user', 'test-session', 10);

      expect(result).toHaveLength(2);
      expect(result[0].audioKey).toBe('audio/test-user/test-session/1234567890_abc123.wav');
      expect(result[0].size).toBe(1024);
      expect(result[0].metadata.originalName).toBe('recording.wav');
      expect(result[0].metadata.duration).toBe(2.5);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Prefix: 'audio/test-user/test-session/'
          })
        })
      );
    });

    test('lists all audio files when no filters provided', async () => {
      mockS3Client.send.mockResolvedValue({ Contents: [] });

      await s3AudioService.listAudioFiles();

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Prefix: 'audio/'
          })
        })
      );
    });

    test('handles empty list response', async () => {
      mockS3Client.send.mockResolvedValue({ Contents: undefined });

      const result = await s3AudioService.listAudioFiles('test-user');

      expect(result).toEqual([]);
    });

    test('handles metadata retrieval errors gracefully', async () => {
      const mockListResponse = {
        Contents: [
          { Key: 'audio/test-user/file1.wav', Size: 1024, LastModified: new Date() }
        ]
      };

      mockS3Client.send
        .mockResolvedValueOnce(mockListResponse) // ListObjectsV2Command
        .mockRejectedValueOnce(new Error('Metadata error')); // HeadObjectCommand

      const result = await s3AudioService.listAudioFiles('test-user');

      expect(result).toEqual([]); // Should filter out files with metadata errors
    });
  });

  describe('analyzeAudioQuality', () => {
    test('analyzes audio quality metrics', () => {
      const result = s3AudioService.analyzeAudioQuality(mockAudioBuffer, mockMetadata);

      expect(result.clarity).toBeGreaterThanOrEqual(0);
      expect(result.clarity).toBeLessThanOrEqual(1);
      expect(result.volume).toBeGreaterThanOrEqual(0);
      expect(result.volume).toBeLessThanOrEqual(1);
      expect(result.backgroundNoise).toBeGreaterThanOrEqual(0);
      expect(result.backgroundNoise).toBeLessThanOrEqual(1);
      expect(result.signalToNoiseRatio).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('provides recommendations for quiet audio', () => {
      // Create very quiet audio buffer
      const quietBuffer = Buffer.alloc(1024);
      quietBuffer.write('RIFF', 0, 'ascii');
      quietBuffer.writeUInt32LE(1016, 4);
      quietBuffer.write('WAVE', 8, 'ascii');
      
      // Fill with very low amplitude samples
      for (let i = 44; i < quietBuffer.length; i += 2) {
        quietBuffer.writeInt16LE(50, i); // Very quiet
      }

      const result = s3AudioService.analyzeAudioQuality(quietBuffer, mockMetadata);

      expect(result.volume).toBeLessThan(0.1);
      expect(result.recommendations).toContain(
        expect.stringContaining('too quiet')
      );
    });

    test('provides recommendations for loud audio', () => {
      // Create very loud audio buffer
      const loudBuffer = Buffer.alloc(1024);
      loudBuffer.write('RIFF', 0, 'ascii');
      loudBuffer.writeUInt32LE(1016, 4);
      loudBuffer.write('WAVE', 8, 'ascii');
      
      // Fill with very high amplitude samples
      for (let i = 44; i < loudBuffer.length; i += 2) {
        loudBuffer.writeInt16LE(30000, i); // Very loud
      }

      const result = s3AudioService.analyzeAudioQuality(loudBuffer, mockMetadata);

      expect(result.volume).toBeGreaterThan(0.9);
      expect(result.recommendations).toContain(
        expect.stringContaining('too loud')
      );
    });

    test('provides recommendations for short audio', () => {
      const shortBuffer = Buffer.alloc(100); // Very short
      shortBuffer.write('RIFF', 0, 'ascii');
      shortBuffer.write('WAVE', 8, 'ascii');

      const shortMetadata = { ...mockMetadata, duration: 0.5 };
      const result = s3AudioService.analyzeAudioQuality(shortBuffer, shortMetadata);

      expect(result.recommendations).toContain(
        expect.stringContaining('very short')
      );
    });

    test('provides recommendations for low sample rate', () => {
      const lowSampleRateMetadata = { ...mockMetadata, sampleRate: 8000 };
      const result = s3AudioService.analyzeAudioQuality(mockAudioBuffer, lowSampleRateMetadata);

      expect(result.recommendations).toContain(
        expect.stringContaining('Low sample rate')
      );
    });
  });

  describe('private helper methods', () => {
    test('getFileExtension returns correct extensions', () => {
      // Access private method through any casting for testing
      const service = s3AudioService as any;
      
      expect(service.getFileExtension('audio/wav')).toBe('wav');
      expect(service.getFileExtension('audio/mp3')).toBe('mp3');
      expect(service.getFileExtension('audio/mpeg')).toBe('mp3');
      expect(service.getFileExtension('audio/ogg')).toBe('ogg');
      expect(service.getFileExtension('audio/webm')).toBe('webm');
      expect(service.getFileExtension('unknown/type')).toBe('wav'); // Default
    });

    test('streamToBuffer converts stream to buffer', async () => {
      const service = s3AudioService as any;
      const testData = Buffer.from('test data');
      
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(testData);
          } else if (event === 'end') {
            callback();
          }
        })
      };

      const result = await service.streamToBuffer(mockStream);
      expect(result).toEqual(testData);
    });

    test('streamToBuffer handles stream errors', async () => {
      const service = s3AudioService as any;
      const testError = new Error('Stream error');
      
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(testError);
          }
        })
      };

      await expect(service.streamToBuffer(mockStream)).rejects.toThrow('Stream error');
    });
  });
});