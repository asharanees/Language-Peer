"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3AudioService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const constants_1 = require("@/shared/constants");
const utils_1 = require("@/shared/utils");
class S3AudioService {
    constructor(bucketName, region) {
        this.bucketName = bucketName;
        this.region = region || process.env.AWS_REGION || 'us-east-1';
        this.s3Client = new client_s3_1.S3Client({ region: this.region });
    }
    /**
     * Upload audio file to S3
     */
    async uploadAudio(audioBuffer, metadata, userId, sessionId) {
        try {
            // Validate audio data
            this.validateAudioData(audioBuffer, metadata.contentType || 'audio/wav');
            // Generate unique key
            const timestamp = Date.now();
            const uploadId = (0, utils_1.generateSessionId)();
            const extension = this.getFileExtension(metadata.contentType || 'audio/wav');
            const audioKey = `audio/${userId || 'anonymous'}/${sessionId || 'general'}/${timestamp}_${uploadId}.${extension}`;
            // Prepare metadata
            const s3Metadata = {
                'original-name': metadata.originalName || 'audio-recording',
                'content-type': metadata.contentType || 'audio/wav',
                'size': audioBuffer.length.toString(),
                'duration': metadata.duration?.toString() || '0',
                'sample-rate': metadata.sampleRate?.toString() || constants_1.AUDIO_CONFIG.SAMPLE_RATE.toString(),
                'channels': metadata.channels?.toString() || '1',
                'uploaded-at': new Date().toISOString(),
                'user-id': userId || 'anonymous',
                'session-id': sessionId || 'general'
            };
            // Upload to S3
            const putCommand = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: audioKey,
                Body: audioBuffer,
                ContentType: metadata.contentType || 'audio/wav',
                Metadata: s3Metadata,
                ServerSideEncryption: 'AES256'
            });
            await this.s3Client.send(putCommand);
            // Generate presigned URL for access
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: audioKey
            });
            const audioUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, getCommand, {
                expiresIn: 3600 // 1 hour
            });
            return {
                audioUrl,
                audioKey,
                uploadId,
                expiresAt: new Date(Date.now() + 3600 * 1000)
            };
        }
        catch (error) {
            console.error('Error uploading audio:', error);
            throw new Error(`Failed to upload audio: ${error}`);
        }
    }
    /**
     * Retrieve audio file from S3
     */
    async getAudio(audioKey) {
        try {
            // Get object metadata first
            const headCommand = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucketName,
                Key: audioKey
            });
            const headResponse = await this.s3Client.send(headCommand);
            // Get the actual audio data
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: audioKey
            });
            const response = await this.s3Client.send(getCommand);
            if (!response.Body) {
                throw new Error('No audio data found');
            }
            // Convert stream to buffer
            const audioBuffer = await this.streamToBuffer(response.Body);
            // Parse metadata
            const metadata = {
                originalName: headResponse.Metadata?.['original-name'],
                contentType: headResponse.ContentType || 'audio/wav',
                size: headResponse.ContentLength || audioBuffer.length,
                duration: headResponse.Metadata?.['duration'] ?
                    parseFloat(headResponse.Metadata['duration']) : undefined,
                sampleRate: headResponse.Metadata?.['sample-rate'] ?
                    parseInt(headResponse.Metadata['sample-rate']) : undefined,
                channels: headResponse.Metadata?.['channels'] ?
                    parseInt(headResponse.Metadata['channels']) : undefined,
                uploadedAt: headResponse.Metadata?.['uploaded-at'] ?
                    new Date(headResponse.Metadata['uploaded-at']) : new Date(),
                userId: headResponse.Metadata?.['user-id'],
                sessionId: headResponse.Metadata?.['session-id']
            };
            return { audioBuffer, metadata };
        }
        catch (error) {
            console.error('Error retrieving audio:', error);
            throw new Error(`Failed to retrieve audio: ${error}`);
        }
    }
    /**
     * Delete audio file from S3
     */
    async deleteAudio(audioKey) {
        try {
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: audioKey
            });
            await this.s3Client.send(deleteCommand);
        }
        catch (error) {
            console.error('Error deleting audio:', error);
            throw new Error(`Failed to delete audio: ${error}`);
        }
    }
    /**
     * Generate presigned URL for direct upload
     */
    async generateUploadUrl(userId, sessionId, contentType = 'audio/wav', expiresIn = 300 // 5 minutes
    ) {
        try {
            const timestamp = Date.now();
            const uploadId = (0, utils_1.generateSessionId)();
            const extension = this.getFileExtension(contentType);
            const audioKey = `audio/${userId}/${sessionId}/${timestamp}_${uploadId}.${extension}`;
            const putCommand = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: audioKey,
                ContentType: contentType,
                ServerSideEncryption: 'AES256'
            });
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, putCommand, { expiresIn });
            return {
                uploadUrl,
                audioKey,
                expiresAt: new Date(Date.now() + expiresIn * 1000)
            };
        }
        catch (error) {
            console.error('Error generating upload URL:', error);
            throw new Error(`Failed to generate upload URL: ${error}`);
        }
    }
    /**
     * List audio files for a user or session
     */
    async listAudioFiles(userId, sessionId, limit = 50) {
        try {
            let prefix = 'audio/';
            if (userId) {
                prefix += `${userId}/`;
                if (sessionId) {
                    prefix += `${sessionId}/`;
                }
            }
            const listCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: limit
            });
            const response = await this.s3Client.send(listCommand);
            if (!response.Contents) {
                return [];
            }
            // Get metadata for each file
            const audioFiles = await Promise.all(response.Contents.map(async (object) => {
                if (!object.Key)
                    return null;
                try {
                    const headCommand = new client_s3_1.HeadObjectCommand({
                        Bucket: this.bucketName,
                        Key: object.Key
                    });
                    const headResponse = await this.s3Client.send(headCommand);
                    return {
                        audioKey: object.Key,
                        size: object.Size || 0,
                        lastModified: object.LastModified || new Date(),
                        metadata: {
                            originalName: headResponse.Metadata?.['original-name'],
                            contentType: headResponse.ContentType,
                            duration: headResponse.Metadata?.['duration'] ?
                                parseFloat(headResponse.Metadata['duration']) : undefined,
                            userId: headResponse.Metadata?.['user-id'],
                            sessionId: headResponse.Metadata?.['session-id']
                        }
                    };
                }
                catch (error) {
                    console.error(`Error getting metadata for ${object.Key}:`, error);
                    return null;
                }
            }));
            return audioFiles.filter(file => file !== null);
        }
        catch (error) {
            console.error('Error listing audio files:', error);
            throw new Error(`Failed to list audio files: ${error}`);
        }
    }
    /**
     * Analyze audio quality
     */
    analyzeAudioQuality(audioBuffer, metadata) {
        const recommendations = [];
        // Basic audio analysis
        const sampleRate = metadata.sampleRate || constants_1.AUDIO_CONFIG.SAMPLE_RATE;
        const channels = metadata.channels || 1;
        const duration = audioBuffer.length / (sampleRate * 2 * channels); // 16-bit audio
        // Calculate RMS (Root Mean Square) for volume analysis
        let sumSquares = 0;
        let maxAmplitude = 0;
        let silentSamples = 0;
        for (let i = 0; i < audioBuffer.length; i += 2) {
            const sample = audioBuffer.readInt16LE(i);
            const amplitude = Math.abs(sample);
            sumSquares += sample * sample;
            maxAmplitude = Math.max(maxAmplitude, amplitude);
            if (amplitude < 1000) { // Very quiet threshold
                silentSamples++;
            }
        }
        const totalSamples = audioBuffer.length / 2;
        const rms = Math.sqrt(sumSquares / totalSamples);
        const volume = Math.min(1.0, rms / 16384); // Normalize to 0-1
        const silentRatio = silentSamples / totalSamples;
        // Estimate clarity based on dynamic range
        const dynamicRange = maxAmplitude > 0 ? rms / maxAmplitude : 0;
        const clarity = Math.min(1.0, dynamicRange * 3);
        // Estimate background noise (inverse of signal consistency)
        const backgroundNoise = Math.min(1.0, silentRatio + (1 - clarity) * 0.5);
        // Calculate signal-to-noise ratio (simplified)
        const signalToNoiseRatio = volume > 0 ? Math.min(10, (1 - backgroundNoise) / Math.max(0.1, backgroundNoise)) : 0;
        // Generate recommendations
        if (volume < 0.1) {
            recommendations.push('Audio is too quiet - speak louder or move closer to microphone');
        }
        else if (volume > 0.9) {
            recommendations.push('Audio is too loud - reduce volume or move away from microphone');
        }
        if (clarity < 0.4) {
            recommendations.push('Audio clarity is poor - check microphone quality and reduce background noise');
        }
        if (backgroundNoise > 0.6) {
            recommendations.push('High background noise detected - find a quieter environment');
        }
        if (duration < 1) {
            recommendations.push('Audio is very short - longer samples provide better analysis');
        }
        else if (duration > 300) {
            recommendations.push('Audio is very long - consider breaking into shorter segments');
        }
        if (signalToNoiseRatio < 2) {
            recommendations.push('Poor signal-to-noise ratio - improve recording conditions');
        }
        if (metadata.sampleRate && metadata.sampleRate < 16000) {
            recommendations.push('Low sample rate detected - use at least 16kHz for better quality');
        }
        return {
            clarity,
            volume,
            backgroundNoise,
            signalToNoiseRatio,
            recommendations
        };
    }
    /**
     * Private helper methods
     */
    validateAudioData(audioBuffer, contentType) {
        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Audio data cannot be empty');
        }
        // Check file size limits
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (audioBuffer.length > maxSize) {
            throw new Error('Audio file too large (max 50MB)');
        }
        // Validate content type
        const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
        if (!supportedTypes.includes(contentType.toLowerCase())) {
            throw new Error(`Unsupported audio format: ${contentType}`);
        }
        // Basic format validation for WAV files
        if (contentType === 'audio/wav') {
            if (audioBuffer.length < 44) {
                throw new Error('Invalid WAV file: too small');
            }
            // Check WAV header
            const riffHeader = audioBuffer.toString('ascii', 0, 4);
            const waveHeader = audioBuffer.toString('ascii', 8, 12);
            if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
                throw new Error('Invalid WAV file: missing RIFF/WAVE headers');
            }
        }
    }
    getFileExtension(contentType) {
        const extensionMap = {
            'audio/wav': 'wav',
            'audio/mp3': 'mp3',
            'audio/mpeg': 'mp3',
            'audio/ogg': 'ogg',
            'audio/webm': 'webm'
        };
        return extensionMap[contentType.toLowerCase()] || 'wav';
    }
    async streamToBuffer(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
exports.S3AudioService = S3AudioService;
