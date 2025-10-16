"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendlyTutorAgent = void 0;
const strands_agent_1 = require("../base/strands-agent");
const constants_1 = require("@/shared/constants");
const utils_1 = require("@/shared/utils");
class FriendlyTutorAgent extends strands_agent_1.StrandsAgent {
    constructor(region) {
        const personality = {
            id: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
            name: 'Maya - Friendly Tutor',
            traits: [
                'patient',
                'encouraging',
                'warm',
                'understanding',
                'positive',
                'supportive'
            ],
            conversationStyle: 'friendly-tutor',
            supportiveApproach: {
                errorHandling: 'gentle-correction',
                encouragementFrequency: 'high',
                difficultyAdjustment: 'automatic'
            },
            voiceCharacteristics: {
                voiceId: 'Joanna', // Warm, friendly female voice
                engine: 'neural',
                languageCode: 'en-US',
                speakingRate: 'medium',
                pitch: 'medium'
            },
            specialties: [
                'conversation-practice',
                'confidence-building',
                'beginner-support',
                'motivation'
            ],
            systemPrompt: `You are Maya, a friendly and patient language learning tutor. Your goal is to create a warm, supportive environment where students feel comfortable making mistakes and learning from them.

Key characteristics:
- Always maintain a positive, encouraging tone
- Celebrate small victories and progress
- When correcting errors, do so gently and constructively
- Use lots of encouragement and positive reinforcement
- Break down complex concepts into manageable pieces
- Show genuine interest in the student's progress and well-being
- Use friendly, conversational language
- Offer multiple ways to explain concepts if the student doesn't understand

Your responses should:
- Start with encouragement or acknowledgment
- Provide clear, helpful explanations
- Include practical examples
- End with motivation or next steps
- Use emojis sparingly but appropriately to convey warmth

Remember: Every student is on their own journey. Your job is to make that journey enjoyable and confidence-building.`
        };
        super(personality, region);
    }
    getPersonalitySpecificEncouragement() {
        const encouragements = [
            "You're doing wonderfully! Every conversation is a step forward in your language journey.",
            "I love your enthusiasm for learning! Keep up the great work.",
            "Remember, making mistakes is part of learning. You're being so brave by practicing!",
            "Your progress might feel slow, but trust me, you're improving with every session.",
            "I'm so proud of how hard you're working. Language learning takes dedication, and you have it!",
            "You have such a positive attitude! That's one of the most important ingredients for success.",
            "Every word you practice brings you closer to fluency. Keep going!",
            "I can see your confidence growing. That's the most beautiful part of this journey."
        ];
        return encouragements[Math.floor(Math.random() * encouragements.length)];
    }
    async generateContextualFeedback(context, response) {
        const feedback = [];
        const lastUserMessage = context.conversationHistory
            .filter(msg => msg.sender === 'user')
            .slice(-1)[0];
        if (!lastUserMessage)
            return feedback;
        // Analyze the user's message for learning opportunities
        const userContent = lastUserMessage.content.toLowerCase();
        // Grammar feedback (gentle approach)
        if (this.detectGrammarIssues(userContent)) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'correction',
                content: this.generateGentleGrammarFeedback(userContent),
                deliveredAt: new Date()
            });
        }
        // Vocabulary enhancement (encouraging approach)
        if (this.canSuggestVocabularyEnhancement(userContent)) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'vocabulary-tip',
                content: this.generateVocabularyEnhancement(userContent),
                deliveredAt: new Date()
            });
        }
        // Encouragement for effort
        if (userContent.length > 20 || this.detectComplexAttempt(userContent)) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'encouragement',
                content: "I love how you're expressing yourself! You're using more complex sentences, which shows great progress.",
                deliveredAt: new Date()
            });
        }
        return feedback;
    }
    async suggestNextTopic(context) {
        const userProfile = context.userProfile;
        const currentTopic = context.currentTopic;
        // Friendly suggestions based on user level and interests
        const suggestions = [
            "How about we practice talking about your hobbies? I'd love to hear what you enjoy doing!",
            "Would you like to practice ordering food at a restaurant? It's super practical and fun!",
            "Let's try describing your daily routine. It's great for practicing different tenses!",
            "How about we practice talking about travel? Even if it's just dream destinations!",
            "Would you like to practice giving directions? It's really useful in everyday situations!"
        ];
        // Filter suggestions based on user level
        if (userProfile?.currentLevel === 'beginner') {
            return "How about we practice some basic introductions? We can work on talking about yourself and your family!";
        }
        else if (userProfile?.currentLevel === 'advanced') {
            return "Would you like to discuss current events or share your opinions on interesting topics? It's great for advanced practice!";
        }
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    detectGrammarIssues(content) {
        // Simple grammar issue detection
        const commonIssues = [
            /\bi am go\b/i, // "I am go" instead of "I go" or "I am going"
            /\bhe don't\b/i, // "he don't" instead of "he doesn't"
            /\bshe don't\b/i, // "she don't" instead of "she doesn't"
            /\bit don't\b/i, // "it don't" instead of "it doesn't"
            /\bi can to\b/i, // "I can to" instead of "I can"
            /\bmore better\b/i, // "more better" instead of "better"
            /\bvery much\b/i // Context-dependent, but often incorrect
        ];
        return commonIssues.some(pattern => pattern.test(content));
    }
    generateGentleGrammarFeedback(content) {
        if (/\bi am go\b/i.test(content)) {
            return "Great effort! Just a small tip: we can say 'I go' for habits or 'I am going' for current actions. Both sound natural! 😊";
        }
        if (/\b(he|she|it) don't\b/i.test(content)) {
            return "Nice try! For 'he', 'she', or 'it', we use 'doesn't' instead of 'don't'. You're getting the hang of it!";
        }
        if (/\bi can to\b/i.test(content)) {
            return "Good thinking! After 'can', we don't need 'to' - just say 'I can go' or 'I can help'. You're doing great!";
        }
        return "I can see you're working hard on your grammar! Let me suggest a small adjustment that might help...";
    }
    canSuggestVocabularyEnhancement(content) {
        // Check if user is using basic vocabulary that could be enhanced
        const basicWords = ['good', 'bad', 'nice', 'big', 'small', 'very'];
        return basicWords.some(word => content.includes(word));
    }
    generateVocabularyEnhancement(content) {
        if (content.includes('good')) {
            return "You used 'good' - that's perfect! You could also try 'excellent', 'wonderful', or 'fantastic' to add variety. 🌟";
        }
        if (content.includes('big')) {
            return "Great use of 'big'! You might also enjoy using 'huge', 'enormous', or 'massive' for even bigger things!";
        }
        if (content.includes('very')) {
            return "Nice use of 'very'! You could also try 'extremely', 'incredibly', or 'really' to mix things up!";
        }
        return "I love your word choice! Here's a fun synonym you could try next time...";
    }
    detectComplexAttempt(content) {
        // Detect if user is attempting complex structures
        const complexIndicators = [
            /\bbecause\b/i,
            /\balthough\b/i,
            /\bhowever\b/i,
            /\btherefore\b/i,
            /\bif.*then\b/i,
            /\bwhen.*i\b/i
        ];
        return complexIndicators.some(pattern => pattern.test(content)) ||
            content.split(' ').length > 15; // Long sentences indicate complexity attempt
    }
    /**
     * Override response generation to add friendly touches
     */
    async generateSupportiveResponse(context) {
        const response = await super.generateSupportiveResponse(context);
        // Add friendly touches to the response
        if (response.emotionalTone === 'encouraging') {
            // Add warm opening phrases
            const warmOpenings = [
                "That's wonderful! ",
                "I'm so glad you asked! ",
                "Great question! ",
                "You're doing amazing! "
            ];
            if (!response.content.match(/^(That's|I'm|Great|You're)/)) {
                const opening = warmOpenings[Math.floor(Math.random() * warmOpenings.length)];
                response.content = opening + response.content;
            }
        }
        return response;
    }
}
exports.FriendlyTutorAgent = FriendlyTutorAgent;
