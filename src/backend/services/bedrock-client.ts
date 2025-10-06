import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommandInput,
  InvokeModelWithResponseStreamCommandInput
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { BEDROCK_MODELS } from '@/shared/constants';
import { BedrockResponse } from '@/shared/types';

export interface BedrockModelConfig {
  modelId: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences?: string[];
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userProfile?: {
    languageLevel: string;
    targetLanguage: string;
    learningGoals: string[];
  };
  currentTopic?: string;
}

export class BedrockService {
  private runtimeClient: BedrockRuntimeClient;
  private client: BedrockClient;
  private region: string;

  constructor(region: string = process.env.AWS_REGION || 'us-east-1') {
    this.region = region;
    this.runtimeClient = new BedrockRuntimeClient({ region });
    this.client = new BedrockClient({ region });
  }

  /**
   * Get available foundation models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const command = new ListFoundationModelsCommand({});
      const response = await this.client.send(command);
      
      return response.modelSummaries?.map(model => model.modelId || '') || [];
    } catch (error) {
      console.error('Error listing foundation models:', error);
      throw new Error('Failed to retrieve available models');
    }
  }

  /**
   * Select the best model based on conversation context
   */
  selectModel(context: ConversationContext): string {
    const { userProfile, conversationHistory } = context;
    
    // For complex conversations or advanced users, use Claude 3.5 Sonnet
    if (userProfile?.languageLevel === 'advanced' || 
        userProfile?.languageLevel === 'proficient' ||
        conversationHistory.length > 10) {
      return BEDROCK_MODELS.CLAUDE_3_5_SONNET;
    }
    
    // For pronunciation coaching, use Nova Pro for better voice understanding
    if (userProfile?.learningGoals?.includes('pronunciation-improvement')) {
      return BEDROCK_MODELS.NOVA_PRO;
    }
    
    // For general conversation and grammar, use Llama 3.1
    return BEDROCK_MODELS.LLAMA_3_1_405B;
  }

  /**
   * Get model-specific configuration
   */
  private getModelConfig(modelId: string, context: ConversationContext): BedrockModelConfig {
    const baseConfig = {
      modelId,
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    };

    switch (modelId) {
      case BEDROCK_MODELS.CLAUDE_3_5_SONNET:
        return {
          ...baseConfig,
          temperature: 0.8, // More creative for conversation
          maxTokens: 1500,
          stopSequences: ['Human:', 'Assistant:']
        };
        
      case BEDROCK_MODELS.LLAMA_3_1_405B:
        return {
          ...baseConfig,
          temperature: 0.6, // More focused for grammar
          maxTokens: 1200
        };
        
      case BEDROCK_MODELS.NOVA_PRO:
        return {
          ...baseConfig,
          temperature: 0.5, // More precise for pronunciation
          maxTokens: 800
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * Format prompt based on model type
   */
  private formatPrompt(modelId: string, systemPrompt: string, userMessage: string, context: ConversationContext): string {
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
      case BEDROCK_MODELS.CLAUDE_3_5_SONNET:
        return `Human: ${systemPrompt}

${profileContext}

Previous conversation:
${historyText}

Current student message: ${userMessage}

Please respond as a supportive language learning tutor.As
sistant:`;

      case BEDROCK_MODELS.LLAMA_3_1_405B:
        return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${systemPrompt}

${profileContext}<|eot_id|><|start_header_id|>user<|end_header_id|>
Previous conversation:
${historyText}

Current message: ${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;

      case BEDROCK_MODELS.NOVA_PRO:
        return `System: ${systemPrompt}

${profileContext}

Conversation History:
${historyText}

Student: ${userMessage}

Tutor:`;

      default:
        return `${systemPrompt}\n\nStudent: ${userMessage}\nTutor:`;
    }
  }

  /**
   * Invoke model with text input
   */
  async invokeModel(
    systemPrompt: string,
    userMessage: string,
    context: ConversationContext
  ): Promise<BedrockResponse> {
    try {
      const modelId = this.selectModel(context);
      const config = this.getModelConfig(modelId, context);
      const prompt = this.formatPrompt(modelId, systemPrompt, userMessage, context);

      const requestBody = this.buildRequestBody(modelId, prompt, config);

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      });

      const response = await this.runtimeClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return this.parseResponse(modelId, responseBody);
    } catch (error) {
      console.error('Error invoking Bedrock model:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Build request body based on model type
   */
  private buildRequestBody(modelId: string, prompt: string, config: BedrockModelConfig): any {
    switch (modelId) {
      case BEDROCK_MODELS.CLAUDE_3_5_SONNET:
        return {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stop_sequences: config.stopSequences
        };

      case BEDROCK_MODELS.LLAMA_3_1_405B:
        return {
          prompt,
          max_gen_len: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP
        };

      case BEDROCK_MODELS.NOVA_PRO:
        return {
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: config.maxTokens,
            temperature: config.temperature,
            topP: config.topP,
            stopSequences: config.stopSequences
          }
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
  private parseResponse(modelId: string, responseBody: any): BedrockResponse {
    let content = '';
    let usage = { inputTokens: 0, outputTokens: 0 };
    let stopReason = 'end_turn';

    switch (modelId) {
      case BEDROCK_MODELS.CLAUDE_3_5_SONNET:
        content = responseBody.content?.[0]?.text || '';
        usage = {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0
        };
        stopReason = responseBody.stop_reason || 'end_turn';
        break;

      case BEDROCK_MODELS.LLAMA_3_1_405B:
        content = responseBody.generation || '';
        usage = {
          inputTokens: responseBody.prompt_token_count || 0,
          outputTokens: responseBody.generation_token_count || 0
        };
        stopReason = responseBody.stop_reason || 'end_turn';
        break;

      case BEDROCK_MODELS.NOVA_PRO:
        content = responseBody.results?.[0]?.outputText || '';
        usage = {
          inputTokens: responseBody.inputTextTokenCount || 0,
          outputTokens: responseBody.results?.[0]?.tokenCount || 0
        };
        stopReason = responseBody.results?.[0]?.completionReason || 'end_turn';
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
  async *invokeModelStream(
    systemPrompt: string,
    userMessage: string,
    context: ConversationContext
  ): AsyncGenerator<string, void, unknown> {
    try {
      const modelId = this.selectModel(context);
      const config = this.getModelConfig(modelId, context);
      const prompt = this.formatPrompt(modelId, systemPrompt, userMessage, context);

      const requestBody = this.buildRequestBody(modelId, prompt, config);

      const command = new InvokeModelWithResponseStreamCommand({
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
    } catch (error) {
      console.error('Error streaming from Bedrock model:', error);
      throw new Error('Failed to stream AI response');
    }
  }

  /**
   * Extract text from streaming chunk based on model type
   */
  private extractTextFromStreamChunk(modelId: string, chunkData: any): string {
    switch (modelId) {
      case BEDROCK_MODELS.CLAUDE_3_5_SONNET:
        return chunkData.delta?.text || '';
      case BEDROCK_MODELS.LLAMA_3_1_405B:
        return chunkData.generation || '';
      case BEDROCK_MODELS.NOVA_PRO:
        return chunkData.outputText || '';
      default:
        return chunkData.text || '';
    }
  }
}