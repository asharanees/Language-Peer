"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockClient = exports.BedrockService = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_bedrock_1 = require("@aws-sdk/client-bedrock");
const constants_1 = require("@/shared/constants");
class BedrockService {
    constructor(region = process.env.AWS_REGION || 'us-east-1') {
        this.region = region;
        this.runtimeClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region });
        this.client = new client_bedrock_1.BedrockClient({ region });
    }
    /**
     * Get available foundation models
     */
    async getAvailableModels() {
        try {
            const command = new client_bedrock_1.ListFoundationModelsCommand({});
            const response = await this.client.send(command);
            return response.modelSummaries?.map(model => model.modelId || '') || [];
        }
        catch (error) {
            console.error('Error listing foundation models:', error);
            throw new Error('Failed to retrieve available models');
        }
    }
    /**
     * Select the best model based on conversation context
     */
    selectModel(context) {
        const { userProfile, conversationHistory } = context;
        // For complex conversations or advanced users, use Nova Premier
        if (userProfile?.languageLevel === 'advanced' ||
            userProfile?.languageLevel === 'proficient' ||
            conversationHistory.length > 10) {
            return constants_1.BEDROCK_MODELS.NOVA_PREMIER;
        }
        // For pronunciation coaching and detailed feedback, use Nova Pro
        if (userProfile?.learningGoals?.includes('pronunciation-improvement') ||
            userProfile?.learningGoals?.includes('grammar-accuracy')) {
            return constants_1.BEDROCK_MODELS.NOVA_PRO;
        }
        // For beginners and simple conversations, use Nova Lite
        if (userProfile?.languageLevel === 'beginner' ||
            userProfile?.languageLevel === 'elementary') {
            return constants_1.BEDROCK_MODELS.NOVA_LITE;
        }
        // Default to Nova Pro for general conversation
        return constants_1.BEDROCK_MODELS.NOVA_PRO;
    }
    /**
     * Get model-specific configuration
     */
    getModelConfig(modelId, context) {
        const baseConfig = {
            modelId,
            maxTokens: 1000,
            temperature: 0.7,
            topP: 0.9
        };
        switch (modelId) {
            case constants_1.BEDROCK_MODELS.NOVA_PREMIER:
                return {
                    ...baseConfig,
                    temperature: 0.8, // More creative for complex conversations
                    maxTokens: 2000,
                    stopSequences: ['Student:', 'Tutor:']
                };
            case constants_1.BEDROCK_MODELS.NOVA_PRO:
                return {
                    ...baseConfig,
                    temperature: 0.7, // Balanced for general conversation
                    maxTokens: 1500,
                    stopSequences: ['Student:', 'Tutor:']
                };
            case constants_1.BEDROCK_MODELS.NOVA_LITE:
                return {
                    ...baseConfig,
                    temperature: 0.6, // More focused for beginners
                    maxTokens: 1000,
                    stopSequences: ['Student:', 'Tutor:']
                };
            case constants_1.BEDROCK_MODELS.LLAMA_3_1_70B:
                return {
                    ...baseConfig,
                    temperature: 0.6, // Backup model configuration
                    maxTokens: 1200
                };
            default:
                return baseConfig;
        }
    }
    /**
     * Format prompt based on model type
     */
    formatPrompt(modelId, systemPrompt, userMessage, context) {
        const { conversationHistory, userProfile } = context;
        // Build conversation history
        let historyText = '';
        if (conversationHistory.length > 0) {
            historyText = conversationHistory
                .slice(-5) // Keep last 5 exchanges for context
                .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
                .join('\n');
        }
        // Add user profile context
        let profileContext = '';
        if (userProfile) {
            profileContext = `
Student Profile:
- Language Level: ${userProfile.languageLevel}
- Target Language: ${userProfile.targetLanguage}
- Learning Goals: ${userProfile.learningGoals.join(', ')}
`;
        }
        switch (modelId) {
            case constants_1.BEDROCK_MODELS.NOVA_PREMIER:
            case constants_1.BEDROCK_MODELS.NOVA_PRO:
            case constants_1.BEDROCK_MODELS.NOVA_LITE:
                return `System: ${systemPrompt}

${profileContext}

Conversation History:
${historyText}

Student: ${userMessage}

Tutor:`;
            case constants_1.BEDROCK_MODELS.LLAMA_3_1_70B:
                return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${systemPrompt}

${profileContext}<|eot_id|><|start_header_id|>user<|end_header_id|>
Previous conversation:
${historyText}

Current message: ${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
            default:
                return `${systemPrompt}\n\nStudent: ${userMessage}\nTutor:`;
        }
    }
    /**
     * Invoke model with text input
     */
    async invokeModel(systemPrompt, userMessage, context) {
        try {
            const modelId = this.selectModel(context);
            const config = this.getModelConfig(modelId, context);
            const prompt = this.formatPrompt(modelId, systemPrompt, userMessage, context);
            const requestBody = this.buildRequestBody(modelId, prompt, config);
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });
            const response = await this.runtimeClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            return this.parseResponse(modelId, responseBody);
        }
        catch (error) {
            console.error('Error invoking Bedrock model:', error);
            throw new Error('Failed to generate AI response');
        }
    }
    /**
     * Build request body based on model type
     */
    buildRequestBody(modelId, prompt, config) {
        switch (modelId) {
            case constants_1.BEDROCK_MODELS.NOVA_PREMIER:
            case constants_1.BEDROCK_MODELS.NOVA_PRO:
            case constants_1.BEDROCK_MODELS.NOVA_LITE:
                return {
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    inferenceConfig: {
                        maxTokens: config.maxTokens,
                        temperature: config.temperature,
                        topP: config.topP,
                        stopSequences: config.stopSequences
                    }
                };
            case constants_1.BEDROCK_MODELS.LLAMA_3_1_70B:
                return {
                    prompt,
                    max_gen_len: config.maxTokens,
                    temperature: config.temperature,
                    top_p: config.topP
                };
            default:
                return {
                    prompt,
                    max_tokens: config.maxTokens,
                    temperature: config.temperature,
                    top_p: config.topP
                };
        }
    }
    /**
     * Parse response based on model type
     */
    parseResponse(modelId, responseBody) {
        let content = '';
        let usage = { inputTokens: 0, outputTokens: 0 };
        let stopReason = 'end_turn';
        switch (modelId) {
            case constants_1.BEDROCK_MODELS.NOVA_PREMIER:
            case constants_1.BEDROCK_MODELS.NOVA_PRO:
            case constants_1.BEDROCK_MODELS.NOVA_LITE:
                content = responseBody.output?.message?.content?.[0]?.text || '';
                usage = {
                    inputTokens: responseBody.usage?.inputTokens || 0,
                    outputTokens: responseBody.usage?.outputTokens || 0
                };
                stopReason = responseBody.stopReason || 'end_turn';
                break;
            case constants_1.BEDROCK_MODELS.LLAMA_3_1_70B:
                content = responseBody.generation || '';
                usage = {
                    inputTokens: responseBody.prompt_token_count || 0,
                    outputTokens: responseBody.generation_token_count || 0
                };
                stopReason = responseBody.stop_reason || 'end_turn';
                break;
            default:
                content = responseBody.completion || responseBody.text || '';
        }
        return {
            content: content.trim(),
            usage,
            stopReason
        };
    }
    /**
     * Stream model response (for real-time conversation)
     */
    async *invokeModelStream(systemPrompt, userMessage, context) {
        try {
            const modelId = this.selectModel(context);
            const config = this.getModelConfig(modelId, context);
            const prompt = this.formatPrompt(modelId, systemPrompt, userMessage, context);
            const requestBody = this.buildRequestBody(modelId, prompt, config);
            const command = new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });
            const response = await this.runtimeClient.send(command);
            if (response.body) {
                for await (const chunk of response.body) {
                    if (chunk.chunk?.bytes) {
                        const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
                        const text = this.extractTextFromStreamChunk(modelId, chunkData);
                        if (text) {
                            yield text;
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error streaming from Bedrock model:', error);
            throw new Error('Failed to stream AI response');
        }
    }
    /**
     * Extract text from streaming chunk based on model type
     */
    extractTextFromStreamChunk(modelId, chunkData) {
        switch (modelId) {
            case constants_1.BEDROCK_MODELS.NOVA_PREMIER:
            case constants_1.BEDROCK_MODELS.NOVA_PRO:
            case constants_1.BEDROCK_MODELS.NOVA_LITE:
                return chunkData.contentBlockDelta?.text || '';
            case constants_1.BEDROCK_MODELS.LLAMA_3_1_70B:
                return chunkData.generation || '';
            default:
                return chunkData.text || '';
        }
    }
}
exports.BedrockService = BedrockService;
exports.BedrockClient = BedrockService;
