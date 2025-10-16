"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bedrock_client_1 = require("../bedrock-client");
const constants_1 = require("@/shared/constants");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_bedrock_1 = require("@aws-sdk/client-bedrock");
// Mock AWS SDK clients
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-bedrock');
describe('BedrockService', () => {
    let bedrockService;
    let mockRuntimeClient;
    let mockClient;
    beforeEach(() => {
        mockRuntimeClient = new client_bedrock_runtime_1.BedrockRuntimeClient({});
        mockClient = new client_bedrock_1.BedrockClient({});
        client_bedrock_runtime_1.BedrockRuntimeClient.mockReturnValue(mockRuntimeClient);
        client_bedrock_1.BedrockClient.mockReturnValue(mockClient);
        bedrockService = new bedrock_client_1.BedrockService('us-east-1');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Model Selection', () => {
        test('selects Claude 3.5 Sonnet for advanced users', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'advanced',
                    targetLanguage: 'Spanish',
                    learningGoals: ['conversation-fluency']
                }
            };
            const selectedModel = bedrockService.selectModel(context);
            expect(selectedModel).toBe(constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET);
        });
        test('selects Nova Pro for pronunciation improvement', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'intermediate',
                    targetLanguage: 'French',
                    learningGoals: ['pronunciation-improvement']
                }
            };
            const selectedModel = bedrockService.selectModel(context);
            expect(selectedModel).toBe(constants_1.BEDROCK_MODELS.NOVA_PRO);
        });
        test('selects Llama 3.1 for general conversation', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'intermediate',
                    targetLanguage: 'German',
                    learningGoals: ['grammar-accuracy']
                }
            };
            const selectedModel = bedrockService.selectModel(context);
            expect(selectedModel).toBe(constants_1.BEDROCK_MODELS.LLAMA_3_1_405B);
        });
        test('selects Claude for long conversations', () => {
            const longHistory = Array.from({ length: 15 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i}`
            }));
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: longHistory,
                userProfile: {
                    languageLevel: 'beginner',
                    targetLanguage: 'Spanish',
                    learningGoals: ['conversation-fluency']
                }
            };
            const selectedModel = bedrockService.selectModel(context);
            expect(selectedModel).toBe(constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET);
        });
    });
    describe('Model Configuration', () => {
        test('returns correct configuration for Claude 3.5 Sonnet', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'advanced',
                    targetLanguage: 'Spanish',
                    learningGoals: ['conversation-fluency']
                }
            };
            const config = bedrockService.getModelConfig(constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET, context);
            expect(config).toEqual({
                modelId: constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET,
                maxTokens: 1500,
                temperature: 0.8,
                topP: 0.9,
                stopSequences: ['Human:', 'Assistant:']
            });
        });
        test('returns correct configuration for Llama 3.1', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'intermediate',
                    targetLanguage: 'German',
                    learningGoals: ['grammar-accuracy']
                }
            };
            const config = bedrockService.getModelConfig(constants_1.BEDROCK_MODELS.LLAMA_3_1_405B, context);
            expect(config).toEqual({
                modelId: constants_1.BEDROCK_MODELS.LLAMA_3_1_405B,
                maxTokens: 1200,
                temperature: 0.6,
                topP: 0.9
            });
        });
        test('returns correct configuration for Nova Pro', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'intermediate',
                    targetLanguage: 'French',
                    learningGoals: ['pronunciation-improvement']
                }
            };
            const config = bedrockService.getModelConfig(constants_1.BEDROCK_MODELS.NOVA_PRO, context);
            expect(config).toEqual({
                modelId: constants_1.BEDROCK_MODELS.NOVA_PRO,
                maxTokens: 800,
                temperature: 0.5,
                topP: 0.9
            });
        });
    });
    describe('Prompt Formatting', () => {
        test('formats Claude prompt correctly', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ],
                userProfile: {
                    languageLevel: 'intermediate',
                    targetLanguage: 'Spanish',
                    learningGoals: ['conversation-fluency']
                }
            };
            const prompt = bedrockService.formatPrompt(constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET, 'You are a helpful language tutor', 'How do I say hello?', context);
            expect(prompt).toContain('Human: You are a helpful language tutor');
            expect(prompt).toContain('Language Level: intermediate');
            expect(prompt).toContain('Target Language: Spanish');
            expect(prompt).toContain('Student: Hello');
            expect(prompt).toContain('Tutor: Hi there!');
            expect(prompt).toContain('Current student message: How do I say hello?');
            expect(prompt).toContain('Assistant:');
        });
        test('formats Llama prompt correctly', () => {
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'beginner',
                    targetLanguage: 'French',
                    learningGoals: ['grammar-accuracy']
                }
            };
            const prompt = bedrockService.formatPrompt(constants_1.BEDROCK_MODELS.LLAMA_3_1_405B, 'You are a grammar tutor', 'What is the past tense?', context);
            expect(prompt).toContain('<|begin_of_text|><|start_header_id|>system<|end_header_id|>');
            expect(prompt).toContain('You are a grammar tutor');
            expect(prompt).toContain('Language Level: beginner');
            expect(prompt).toContain('Target Language: French');
            expect(prompt).toContain('Current message: What is the past tense?');
            expect(prompt).toContain('<|eot_id|><|start_header_id|>assistant<|end_header_id|>');
        });
    });
    describe('Request Body Building', () => {
        test('builds Claude request body correctly', () => {
            const config = {
                modelId: constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET,
                maxTokens: 1500,
                temperature: 0.8,
                topP: 0.9,
                stopSequences: ['Human:', 'Assistant:']
            };
            const requestBody = bedrockService.buildRequestBody(constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET, 'Test prompt', config);
            expect(requestBody).toEqual({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 1500,
                temperature: 0.8,
                top_p: 0.9,
                messages: [
                    {
                        role: 'user',
                        content: 'Test prompt'
                    }
                ],
                stop_sequences: ['Human:', 'Assistant:']
            });
        });
        test('builds Llama request body correctly', () => {
            const config = {
                modelId: constants_1.BEDROCK_MODELS.LLAMA_3_1_405B,
                maxTokens: 1200,
                temperature: 0.6,
                topP: 0.9
            };
            const requestBody = bedrockService.buildRequestBody(constants_1.BEDROCK_MODELS.LLAMA_3_1_405B, 'Test prompt', config);
            expect(requestBody).toEqual({
                prompt: 'Test prompt',
                max_gen_len: 1200,
                temperature: 0.6,
                top_p: 0.9
            });
        });
        test('builds Nova Pro request body correctly', () => {
            const config = {
                modelId: constants_1.BEDROCK_MODELS.NOVA_PRO,
                maxTokens: 800,
                temperature: 0.5,
                topP: 0.9,
                stopSequences: ['Student:', 'Tutor:']
            };
            const requestBody = bedrockService.buildRequestBody(constants_1.BEDROCK_MODELS.NOVA_PRO, 'Test prompt', config);
            expect(requestBody).toEqual({
                inputText: 'Test prompt',
                textGenerationConfig: {
                    maxTokenCount: 800,
                    temperature: 0.5,
                    topP: 0.9,
                    stopSequences: ['Student:', 'Tutor:']
                }
            });
        });
    });
    describe('Response Parsing', () => {
        test('parses Claude response correctly', () => {
            const responseBody = {
                content: [{ text: 'Hello! How can I help you today?' }],
                usage: { input_tokens: 50, output_tokens: 25 },
                stop_reason: 'end_turn'
            };
            const parsed = bedrockService.parseResponse(constants_1.BEDROCK_MODELS.CLAUDE_3_5_SONNET, responseBody);
            expect(parsed).toEqual({
                content: 'Hello! How can I help you today?',
                usage: { inputTokens: 50, outputTokens: 25 },
                stopReason: 'end_turn'
            });
        });
        test('parses Llama response correctly', () => {
            const responseBody = {
                generation: 'Great question! Let me explain...',
                prompt_token_count: 40,
                generation_token_count: 30,
                stop_reason: 'length'
            };
            const parsed = bedrockService.parseResponse(constants_1.BEDROCK_MODELS.LLAMA_3_1_405B, responseBody);
            expect(parsed).toEqual({
                content: 'Great question! Let me explain...',
                usage: { inputTokens: 40, outputTokens: 30 },
                stopReason: 'length'
            });
        });
        test('parses Nova Pro response correctly', () => {
            const responseBody = {
                results: [{
                        outputText: 'The pronunciation is...',
                        tokenCount: 20,
                        completionReason: 'finished'
                    }],
                inputTextTokenCount: 35
            };
            const parsed = bedrockService.parseResponse(constants_1.BEDROCK_MODELS.NOVA_PRO, responseBody);
            expect(parsed).toEqual({
                content: 'The pronunciation is...',
                usage: { inputTokens: 35, outputTokens: 20 },
                stopReason: 'finished'
            });
        });
    });
    describe('Error Handling', () => {
        test('handles model invocation errors gracefully', async () => {
            mockRuntimeClient.send.mockRejectedValue(new Error('Model not available'));
            const context = {
                sessionId: 'test-session',
                userId: 'test-user',
                conversationHistory: [],
                userProfile: {
                    languageLevel: 'intermediate',
                    targetLanguage: 'Spanish',
                    learningGoals: ['conversation-fluency']
                }
            };
            await expect(bedrockService.invokeModel('Test prompt', 'Test message', context)).rejects.toThrow('Failed to generate AI response');
        });
        test('handles list models errors gracefully', async () => {
            mockClient.send.mockRejectedValue(new Error('Access denied'));
            await expect(bedrockService.getAvailableModels()).rejects.toThrow('Failed to retrieve available models');
        });
    });
});
