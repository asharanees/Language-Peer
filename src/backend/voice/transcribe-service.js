"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscribeService = void 0;
const client_transcribe_streaming_1 = require("@aws-sdk/client-transcribe-streaming");
const constants_1 = require("@/shared/constants");
const utils_1 = require("@/shared/utils");
class TranscribeService {
    constructor(region) {
        this.activeStreams = new Map();
        this.client = new client_transcribe_streaming_1.TranscribeStreamingClient({
            region: region || process.env.AWS_REGION || 'us-east-1'
        });
    }
    /**
     * Start real-time streaming transcription
     */
    async startStreamTranscription(streamId, config) {
        try {
            // Validate configuration
            this.validateConfig(config);
            // Create audio stream
            const audioStream = this.createAudioStream();
            const params = {
                LanguageCode: config.languageCode,
                MediaSampleRateHertz: config.sampleRate,
                MediaEncoding: config.mediaEncoding,
                AudioStream: audioStream,
                EnableChannelIdentification: config.enableChannelIdentification || false,
                NumberOfChannels: config.numberOfChannels || 1,
                VocabularyName: config.vocabularyName,
                VocabularyFilterName: config.vocabularyFilterName
            };
            const command = new client_transcribe_streaming_1.StartStreamTranscriptionCommand(params);
            const response = await this.client.send(command);
            if (!response.TranscriptResultStream) {
                throw new Error('Failed to start transcription stream');
            }
            // Store active stream
            this.activeStreams.set(streamId, {
                stream: response.TranscriptResultStream,
                audioStream,
                config
            });
            // Return async iterable for results
            return this.processTranscriptionResults(response.TranscriptResultStream);
        }
        catch (error) {
            console.error('Error starting stream transcription:', error);
            throw new Error(`Failed to start transcription: ${error}`);
        }
    }
    /**
     * Send audio data to active transcription stream
     */
    async sendAudioData(streamId, audioData) {
        const activeStream = this.activeStreams.get(streamId);
        if (!activeStream) {
            throw new Error(`No active stream found for ID: ${streamId}`);
        }
        try {
            // Validate audio data
            this.validateAudioData(audioData, activeStream.config);
            // Send audio chunk to stream
            await activeStream.audioStream.write({
                AudioEvent: {
                    AudioChunk: audioData
                }
            });
        }
        catch (error) {
            console.error('Error sending audio data:', error);
            throw new Error(`Failed to send audio data: ${error}`);
        }
    }
    /**
     * Stop transcription stream
     */
    async stopStreamTranscription(streamId) {
        const activeStream = this.activeStreams.get(streamId);
        if (!activeStream) {
            throw new Error(`No active stream found for ID: ${streamId}`);
        }
        try {
            // End the audio stream
            await activeStream.audioStream.end();
            // Collect final results
            const finalTranscript = await this.collectFinalTranscript(activeStream.stream);
            // Clean up
            this.activeStreams.delete(streamId);
            return finalTranscript;
        }
        catch (error) {
            console.error('Error stopping stream transcription:', error);
            throw new Error(`Failed to stop transcription: ${error}`);
        }
    }
    /**
     * Transcribe audio file (batch processing)
     */
    async transcribeAudioFile(audioBuffer, config) {
        try {
            // For file-based transcription, we'll use streaming with the entire file
            const streamId = `file-${Date.now()}`;
            // Start stream
            const resultStream = await this.startStreamTranscription(streamId, config);
            // Send entire audio file
            await this.sendAudioData(streamId, audioBuffer);
            // Collect results
            let finalTranscript = '';
            let confidence = 0;
            let alternatives = [];
            let resultCount = 0;
            for await (const result of resultStream) {
                if (!result.isPartial) {
                    finalTranscript += result.transcript + ' ';
                    confidence += result.confidence;
                    alternatives = alternatives.concat(result.alternatives);
                    resultCount++;
                }
            }
            // Stop stream
            await this.stopStreamTranscription(streamId);
            return {
                transcript: (0, utils_1.sanitizeText)(finalTranscript.trim()),
                confidence: resultCount > 0 ? confidence / resultCount : 0,
                languageCode: config.languageCode,
                alternatives
            };
        }
        catch (error) {
            console.error('Error transcribing audio file:', error);
            throw new Error(`Failed to transcribe audio file: ${error}`);
        }
    }
    /**
     * Assess audio quality and provide recommendations
     */
    assessAudioQuality(audioBuffer, config) {
        const recommendations = [];
        // Basic audio analysis (in production, use more sophisticated analysis)
        const audioLength = audioBuffer.length;
        const sampleRate = config.sampleRate;
        const duration = audioLength / (sampleRate * 2); // 16-bit audio
        // Estimate volume (simplified)
        let totalAmplitude = 0;
        for (let i = 0; i < audioBuffer.length; i += 2) {
            const sample = audioBuffer.readInt16LE(i);
            totalAmplitude += Math.abs(sample);
        }
        const averageAmplitude = totalAmplitude / (audioBuffer.length / 2);
        const volume = Math.min(1.0, averageAmplitude / 32767);
        // Estimate clarity based on frequency distribution (simplified)
        const clarity = volume > 0.1 ? Math.min(1.0, volume * 2) : 0.2;
        // Estimate background noise (simplified)
        const backgroundNoise = volume < 0.05 ? 0.8 : Math.max(0.1, 1 - volume);
        // Generate recommendations
        if (volume < 0.1) {
            recommendations.push('Speak louder or move closer to the microphone');
        }
        if (volume > 0.9) {
            recommendations.push('Reduce volume or move away from the microphone');
        }
        if (backgroundNoise > 0.5) {
            recommendations.push('Find a quieter environment to reduce background noise');
        }
        if (clarity < 0.5) {
            recommendations.push('Speak more clearly and at a steady pace');
        }
        if (duration < 1) {
            recommendations.push('Try speaking for longer to get better analysis');
        }
        return {
            clarity,
            volume,
            backgroundNoise,
            recommendations
        };
    }
    /**
     * Detect language from audio
     */
    async detectLanguage(audioBuffer) {
        try {
            // Use multiple language codes for detection
            const detectionLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'];
            const results = [];
            for (const langCode of detectionLanguages) {
                try {
                    const config = {
                        languageCode: langCode,
                        sampleRate: constants_1.AUDIO_CONFIG.SAMPLE_RATE,
                        mediaEncoding: 'pcm'
                    };
                    const result = await this.transcribeAudioFile(audioBuffer, config);
                    results.push({
                        languageCode: langCode,
                        confidence: result.confidence
                    });
                }
                catch (error) {
                    // Language not detected, continue with next
                    results.push({
                        languageCode: langCode,
                        confidence: 0
                    });
                }
            }
            // Sort by confidence
            results.sort((a, b) => b.confidence - a.confidence);
            return {
                languageCode: results[0].languageCode,
                confidence: results[0].confidence,
                alternatives: results.slice(1, 3)
            };
        }
        catch (error) {
            console.error('Error detecting language:', error);
            return {
                languageCode: 'en-US',
                confidence: 0.5,
                alternatives: []
            };
        }
    }
    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return [...constants_1.TRANSCRIBE_LANGUAGES];
    }
    /**
     * Private helper methods
     */
    validateConfig(config) {
        if (!constants_1.TRANSCRIBE_LANGUAGES.includes(config.languageCode)) {
            throw new Error(`Unsupported language code: ${config.languageCode}`);
        }
        if (config.sampleRate < 8000 || config.sampleRate > 48000) {
            throw new Error('Sample rate must be between 8000 and 48000 Hz');
        }
        if (config.numberOfChannels && (config.numberOfChannels < 1 || config.numberOfChannels > 2)) {
            throw new Error('Number of channels must be 1 or 2');
        }
    }
    validateAudioData(audioData, config) {
        if (!audioData || audioData.length === 0) {
            throw new Error('Audio data cannot be empty');
        }
        // Check if audio data is too large (max 15 seconds per chunk)
        const maxChunkSize = config.sampleRate * 15 * 2; // 15 seconds of 16-bit audio
        if (audioData.length > maxChunkSize) {
            throw new Error('Audio chunk too large (max 15 seconds)');
        }
        // Validate audio format (should be 16-bit PCM)
        if (audioData.length % 2 !== 0) {
            throw new Error('Invalid audio format: expected 16-bit PCM');
        }
    }
    createAudioStream() {
        // Create async generator for audio stream
        return {
            write: async (chunk) => {
                // Implementation would depend on the actual streaming setup
                return Promise.resolve();
            },
            end: async () => {
                return Promise.resolve();
            }
        };
    }
    async *processTranscriptionResults(stream) {
        try {
            for await (const event of stream) {
                if (event.TranscriptEvent) {
                    const results = event.TranscriptEvent.Transcript?.Results || [];
                    for (const result of results) {
                        if (result.Alternatives && result.Alternatives.length > 0) {
                            const primary = result.Alternatives[0];
                            const alternatives = result.Alternatives.slice(1).map((alt) => ({
                                transcript: alt.Transcript || '',
                                confidence: alt.Confidence || 0
                            }));
                            yield {
                                transcript: primary.Transcript || '',
                                confidence: primary.Confidence || 0,
                                isPartial: result.IsPartial || false,
                                alternatives,
                                startTime: result.StartTime,
                                endTime: result.EndTime
                            };
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error processing transcription results:', error);
            throw error;
        }
    }
    async collectFinalTranscript(stream) {
        let finalTranscript = '';
        let totalConfidence = 0;
        let resultCount = 0;
        const alternatives = [];
        try {
            for await (const result of this.processTranscriptionResults(stream)) {
                if (!result.isPartial) {
                    finalTranscript += result.transcript + ' ';
                    totalConfidence += result.confidence;
                    alternatives.push(...result.alternatives);
                    resultCount++;
                }
            }
            return {
                transcript: (0, utils_1.sanitizeText)(finalTranscript.trim()),
                confidence: resultCount > 0 ? totalConfidence / resultCount : 0,
                languageCode: 'en-US', // Would be determined from config
                alternatives
            };
        }
        catch (error) {
            console.error('Error collecting final transcript:', error);
            throw error;
        }
    }
}
exports.TranscribeService = TranscribeService;
