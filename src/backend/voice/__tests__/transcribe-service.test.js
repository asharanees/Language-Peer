"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transcribe_service_1 = require("../transcribe-service");
const client_transcribe_streaming_1 = require("@aws-sdk/client-transcribe-streaming");
const constants_1 = require("@/shared/constants");
// Mock AWS SDK
jest.mock('@aws-sdk/client-transcribe-streaming');
describe('TranscribeService', () => {
    let transcribeService;
    let mockClient;
    let mockAudioBuffer;
    let mockConfig;
    beforeEach(() => {
        // Setup mocks
        mockClient = {
            send: jest.fn()
        };
        client_transcribe_streaming_1.TranscribeStreamingClient.mockImplementation(() => mockClient);
        // Create service instance
        transcribeService = new transcribe_service_1.TranscribeService('us-east-1');
        // Mock audio buffer (16-bit PCM, 1 second at 16kHz)
        mockAudioBuffer = Buffer.alloc(constants_1.AUDIO_CONFIG.SAMPLE_RATE * 2);
        for (let i = 0; i < mockAudioBuffer.length; i += 2) {
            // Generate sine wave for testing
            const sample = Math.sin(2 * Math.PI * 440 * (i / 2) / constants_1.AUDIO_CONFIG.SAMPLE_RATE) * 16383;
            mockAudioBuffer.writeInt16LE(sample, i);
        }
        // Mock configuration
        mockConfig = {
            languageCode: 'en-US',
            sampleRate: constants_1.AUDIO_CONFIG.SAMPLE_RATE,
            mediaEncoding: 'pcm',
            enableChannelIdentification: false,
            numberOfChannels: 1
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('startStreamTranscription', () => {
        test('starts streaming transcription successfully', async () => {
            const mockTranscriptStream = {
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        TranscriptEvent: {
                            Transcript: {
                                Results: [{
                                        Alternatives: [{
                                                Transcript: 'Hello world',
                                                Confidence: 0.95
                                            }],
                                        IsPartial: false,
                                        StartTime: 0,
                                        EndTime: 1000
                                    }]
                            }
                        }
                    };
                }
            };
            mockClient.send.mockResolvedValue({
                TranscriptResultStream: mockTranscriptStream
            });
            const streamId = 'test-stream-123';
            const resultStream = await transcribeService.startStreamTranscription(streamId, mockConfig);
            expect(mockClient.send).toHaveBeenCalledWith(expect.any(client_transcribe_streaming_1.StartStreamTranscriptionCommand));
            // Test streaming results
            const results = [];
            for await (const result of resultStream) {
                results.push(result);
                break; // Just test first result
            }
            expect(results).toHaveLength(1);
            expect(results[0].transcript).toBe('Hello world');
            expect(results[0].confidence).toBe(0.95);
            expect(results[0].isPartial).toBe(false);
        });
        test('validates configuration before starting', async () => {
            const invalidConfig = {
                ...mockConfig,
                languageCode: 'invalid-lang'
            };
            await expect(transcribeService.startStreamTranscription('test-stream', invalidConfig)).rejects.toThrow('Unsupported language code');
        });
        test('validates sample rate range', async () => {
            const invalidConfig = {
                ...mockConfig,
                sampleRate: 4000 // Below minimum
            };
            await expect(transcribeService.startStreamTranscription('test-stream', invalidConfig)).rejects.toThrow('Sample rate must be between 8000 and 48000 Hz');
        });
        test('validates number of channels', async () => {
            const invalidConfig = {
                ...mockConfig,
                numberOfChannels: 5 // Invalid
            };
            await expect(transcribeService.startStreamTranscription('test-stream', invalidConfig)).rejects.toThrow('Number of channels must be 1 or 2');
        });
    });
    describe('transcribeAudioFile', () => {
        test('transcribes audio file successfully', async () => {
            // Mock the streaming transcription
            const mockResults = [
                {
                    transcript: 'Hello',
                    confidence: 0.9,
                    isPartial: false,
                    alternatives: []
                },
                {
                    transcript: 'world',
                    confidence: 0.95,
                    isPartial: false,
                    alternatives: []
                }
            ];
            // Mock the startStreamTranscription method
            jest.spyOn(transcribeService, 'startStreamTranscription').mockImplementation(async function* () {
                for (const result of mockResults) {
                    yield result;
                }
            });
            jest.spyOn(transcribeService, 'sendAudioData').mockResolvedValue();
            jest.spyOn(transcribeService, 'stopStreamTranscription').mockResolvedValue({
                transcript: 'Hello world',
                confidence: 0.925,
                languageCode: 'en-US',
                alternatives: []
            });
            const result = await transcribeService.transcribeAudioFile(mockAudioBuffer, mockConfig);
            expect(result.transcript).toBe('Hello world');
            expect(result.confidence).toBeCloseTo(0.925, 2);
            expect(result.languageCode).toBe('en-US');
        });
        test('handles empty audio buffer', async () => {
            const emptyBuffer = Buffer.alloc(0);
            await expect(transcribeService.transcribeAudioFile(emptyBuffer, mockConfig)).rejects.toThrow();
        });
    });
    describe('assessAudioQuality', () => {
        test('assesses audio quality correctly', () => {
            const quality = transcribeService.assessAudioQuality(mockAudioBuffer, mockConfig);
            expect(quality.clarity).toBeGreaterThan(0);
            expect(quality.volume).toBeGreaterThan(0);
            expect(quality.backgroundNoise).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(quality.recommendations)).toBe(true);
        });
        test('provides recommendations for low volume', () => {
            // Create very quiet audio
            const quietBuffer = Buffer.alloc(constants_1.AUDIO_CONFIG.SAMPLE_RATE * 2);
            for (let i = 0; i < quietBuffer.length; i += 2) {
                quietBuffer.writeInt16LE(100, i); // Very low amplitude
            }
            const quality = transcribeService.assessAudioQuality(quietBuffer, mockConfig);
            expect(quality.volume).toBeLessThan(0.1);
            expect(quality.recommendations).toContain(expect.stringContaining('Speak louder'));
        });
        test('provides recommendations for high volume', () => {
            // Create very loud audio
            const loudBuffer = Buffer.alloc(constants_1.AUDIO_CONFIG.SAMPLE_RATE * 2);
            for (let i = 0; i < loudBuffer.length; i += 2) {
                loudBuffer.writeInt16LE(30000, i); // Very high amplitude
            }
            const quality = transcribeService.assessAudioQuality(loudBuffer, mockConfig);
            expect(quality.volume).toBeGreaterThan(0.9);
            expect(quality.recommendations).toContain(expect.stringContaining('Reduce volume'));
        });
        test('provides recommendations for short audio', () => {
            // Create very short audio (0.1 seconds)
            const shortBuffer = Buffer.alloc(constants_1.AUDIO_CONFIG.SAMPLE_RATE * 0.1 * 2);
            const quality = transcribeService.assessAudioQuality(shortBuffer, mockConfig);
            expect(quality.recommendations).toContain(expect.stringContaining('Try speaking for longer'));
        });
    });
    describe('detectLanguage', () => {
        test('detects language from audio', async () => {
            // Mock transcribeAudioFile to return different confidence for different languages
            const mockTranscribeAudioFile = jest.spyOn(transcribeService, 'transcribeAudioFile');
            mockTranscribeAudioFile
                .mockResolvedValueOnce({
                transcript: 'Hello world',
                confidence: 0.95,
                languageCode: 'en-US',
                alternatives: []
            })
                .mockResolvedValueOnce({
                transcript: 'Hola mundo',
                confidence: 0.7,
                languageCode: 'es-ES',
                alternatives: []
            })
                .mockResolvedValueOnce({
                transcript: 'Bonjour monde',
                confidence: 0.6,
                languageCode: 'fr-FR',
                alternatives: []
            })
                .mockResolvedValueOnce({
                transcript: 'Hallo Welt',
                confidence: 0.5,
                languageCode: 'de-DE',
                alternatives: []
            })
                .mockResolvedValueOnce({
                transcript: 'Ciao mondo',
                confidence: 0.4,
                languageCode: 'it-IT',
                alternatives: []
            });
            const result = await transcribeService.detectLanguage(mockAudioBuffer);
            expect(result.languageCode).toBe('en-US');
            expect(result.confidence).toBe(0.95);
            expect(result.alternatives).toHaveLength(2);
            expect(result.alternatives[0].languageCode).toBe('es-ES');
            expect(result.alternatives[0].confidence).toBe(0.7);
        });
        test('handles detection errors gracefully', async () => {
            // Mock transcribeAudioFile to throw errors
            jest.spyOn(transcribeService, 'transcribeAudioFile').mockRejectedValue(new Error('Transcription failed'));
            const result = await transcribeService.detectLanguage(mockAudioBuffer);
            expect(result.languageCode).toBe('en-US'); // Default fallback
            expect(result.confidence).toBe(0.5);
            expect(result.alternatives).toHaveLength(0);
        });
    });
    describe('sendAudioData', () => {
        test('sends audio data to active stream', async () => {
            // First start a stream
            const mockTranscriptStream = {
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        TranscriptEvent: {
                            Transcript: {
                                Results: []
                            }
                        }
                    };
                }
            };
            mockClient.send.mockResolvedValue({
                TranscriptResultStream: mockTranscriptStream
            });
            const streamId = 'test-stream-123';
            await transcribeService.startStreamTranscription(streamId, mockConfig);
            // Now send audio data
            await expect(transcribeService.sendAudioData(streamId, mockAudioBuffer)).resolves.not.toThrow();
        });
        test('throws error for non-existent stream', async () => {
            await expect(transcribeService.sendAudioData('non-existent-stream', mockAudioBuffer)).rejects.toThrow('No active stream found');
        });
        test('validates audio data before sending', async () => {
            const streamId = 'test-stream-123';
            // Start stream first
            const mockTranscriptStream = {
                [Symbol.asyncIterator]: async function* () { }
            };
            mockClient.send.mockResolvedValue({
                TranscriptResultStream: mockTranscriptStream
            });
            await transcribeService.startStreamTranscription(streamId, mockConfig);
            // Test with empty buffer
            const emptyBuffer = Buffer.alloc(0);
            await expect(transcribeService.sendAudioData(streamId, emptyBuffer)).rejects.toThrow('Audio data cannot be empty');
            // Test with odd-length buffer (invalid 16-bit PCM)
            const oddBuffer = Buffer.alloc(15); // Odd number of bytes
            await expect(transcribeService.sendAudioData(streamId, oddBuffer)).rejects.toThrow('Invalid audio format');
        });
    });
    describe('stopStreamTranscription', () => {
        test('stops transcription and returns final result', async () => {
            const streamId = 'test-stream-123';
            // Start stream first
            const mockTranscriptStream = {
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        TranscriptEvent: {
                            Transcript: {
                                Results: [{
                                        Alternatives: [{
                                                Transcript: 'Final transcript',
                                                Confidence: 0.9
                                            }],
                                        IsPartial: false
                                    }]
                            }
                        }
                    };
                }
            };
            mockClient.send.mockResolvedValue({
                TranscriptResultStream: mockTranscriptStream
            });
            await transcribeService.startStreamTranscription(streamId, mockConfig);
            const result = await transcribeService.stopStreamTranscription(streamId);
            expect(result.transcript).toBe('Final transcript');
            expect(result.confidence).toBe(0.9);
        });
        test('throws error for non-existent stream', async () => {
            await expect(transcribeService.stopStreamTranscription('non-existent-stream')).rejects.toThrow('No active stream found');
        });
    });
    describe('getSupportedLanguages', () => {
        test('returns list of supported languages', () => {
            const languages = transcribeService.getSupportedLanguages();
            expect(Array.isArray(languages)).toBe(true);
            expect(languages.length).toBeGreaterThan(0);
            expect(languages).toContain('en-US');
            expect(languages).toContain('es-ES');
            expect(languages).toEqual(constants_1.TRANSCRIBE_LANGUAGES);
        });
    });
    describe('error handling', () => {
        test('handles AWS service errors gracefully', async () => {
            mockClient.send.mockRejectedValue(new Error('AWS service error'));
            await expect(transcribeService.startStreamTranscription('test-stream', mockConfig)).rejects.toThrow('Failed to start transcription');
        });
        test('handles malformed transcription results', async () => {
            const malformedStream = {
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        // Missing TranscriptEvent
                        SomeOtherEvent: {}
                    };
                }
            };
            mockClient.send.mockResolvedValue({
                TranscriptResultStream: malformedStream
            });
            const streamId = 'test-stream-123';
            const resultStream = await transcribeService.startStreamTranscription(streamId, mockConfig);
            const results = [];
            for await (const result of resultStream) {
                results.push(result);
            }
            expect(results).toHaveLength(0); // Should handle gracefully
        });
    });
});
