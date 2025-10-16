"use strict";
// Continuation of BedrockService class methods
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockServiceMethods = void 0;
const bedrock_client_1 = require("./bedrock-client");
const constants_1 = require("@/shared/constants");
class BedrockServiceMethods extends bedrock_client_1.BedrockService {
    /**
     * Format prompt based on model type (continued from main file)
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

Tutor: Please respond as a supportive language learning tutor. Keep your response conversational and encouraging.`;
            case constants_1.BEDROCK_MODELS.LLAMA_3_1_70B:
                // Llama format
                return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${systemPrompt}

${profileContext}<|eot_id|><|start_header_id|>user<|end_header_id|>
${historyText}

${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
            default:
                // Default format for other models
                return `${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`;
        }
    }
}
exports.BedrockServiceMethods = BedrockServiceMethods;
