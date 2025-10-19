"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationPartnerAgent = void 0;
const strands_agent_1 = require("../base/strands-agent");
const constants_1 = require("@/shared/constants");
const utils_1 = require("@/shared/utils");
class ConversationPartnerAgent extends strands_agent_1.StrandsAgent {
    constructor(region) {
        const personality = {
            id: constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER,
            name: 'Alex - Conversation Partner',
            traits: [
                'casual',
                'engaging',
                'curious',
                'natural',
                'relatable',
                'spontaneous'
            ],
            conversationStyle: 'conversation-partner',
            supportiveApproach: {
                errorHandling: 'gentle-correction',
                encouragementFrequency: 'low',
                difficultyAdjustment: 'automatic'
            },
            voiceCharacteristics: {
                voiceId: 'Justin', // Casual, friendly voice
                engine: 'neural',
                languageCode: 'en-US',
                speakingRate: 'medium',
                pitch: 'medium'
            },
            specialties: [
                'natural-conversation',
                'cultural-exchange',
                'informal-language',
                'real-world-scenarios'
            ],
            systemPrompt: `You are Alex, a friendly conversation partner who loves chatting about everyday topics. Your goal is to create natural, flowing conversations that feel like talking with a friend.

Key characteristics:
- Use casual, natural language like a native speaker
- Share personal experiences and opinions (you can create realistic ones)
- Ask follow-up questions to keep conversations flowing
- Use contractions, idioms, and colloquial expressions naturally
- Show genuine interest in the student's life and experiences
- Keep the conversation balanced - share and ask equally
- Use humor appropriately to make conversations enjoyable
- Correct errors subtly within natural conversation flow

Your responses should:
- Feel like natural conversation, not lessons
- Include personal anecdotes or opinions
- Ask engaging follow-up questions
- Use everyday vocabulary and expressions
- Flow naturally from the previous topic
- Occasionally introduce new topics organically

Remember: You're not a teacher, you're a conversation partner. Make it feel like chatting with a friend who happens to speak the language well.`
        };
        super(personality, region);
    }
    getPersonalitySpecificEncouragement() {
        const encouragements = [
            "Hey, you're getting really good at this! I love how natural our conversations are becoming.",
            "You know what? You're starting to sound like a native speaker. Keep it up!",
            "I really enjoy our chats! You always have interesting things to say.",
            "Your English is improving so much. I can tell you're getting more comfortable expressing yourself.",
            "It's awesome how you're picking up on natural expressions. That's the real key to fluency!",
            "You're doing great! I love how you're not afraid to just jump into conversation.",
            "I can see you're getting more confident. That's what conversation practice is all about!",
            "You're becoming such a natural conversationalist. It's really cool to see your progress!"
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
        const userContent = lastUserMessage.content;
        // Natural corrections (embedded in conversation)
        const naturalCorrections = this.generateNaturalCorrections(userContent);
        if (naturalCorrections) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'correction',
                content: naturalCorrections,
                deliveredAt: new Date()
            });
        }
        // Suggest more natural expressions
        const naturalExpressions = this.suggestNaturalExpressions(userContent);
        if (naturalExpressions) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'vocabulary-tip',
                content: naturalExpressions,
                deliveredAt: new Date()
            });
        }
        // Acknowledge good natural language use
        if (this.detectNaturalLanguageUse(userContent)) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'encouragement',
                content: this.generateNaturalLanguageEncouragement(userContent),
                deliveredAt: new Date()
            });
        }
        return feedback;
    }
    async suggestNextTopic(context) {
        const casualTopicSuggestions = [
            "Oh, speaking of that, what's your favorite way to spend weekends?",
            "That reminds me - have you watched any good movies lately?",
            "By the way, I'm curious about what food is like where you're from. What's your favorite dish?",
            "You know what I was thinking about earlier? Travel. What's the coolest place you've ever been to?",
            "This might sound random, but what kind of music are you into these days?",
            "I just realized I don't know much about your hobbies. What do you like to do for fun?",
            "Oh, that makes me think - what's the weather like where you are? I love talking about different climates!",
            "Speaking of experiences, what's something new you've tried recently?"
        ];
        return casualTopicSuggestions[Math.floor(Math.random() * casualTopicSuggestions.length)];
    }
    generateNaturalCorrections(content) {
        // Embed corrections naturally in conversation
        if (/\bi am go\b/i.test(content)) {
            return "Oh, you mean you're going? Yeah, that sounds fun!";
        }
        if (/\bvery much like\b/i.test(content)) {
            return "Ah, you really like it! That's awesome.";
        }
        if (/\bmore better\b/i.test(content)) {
            return "Right, it's better! I totally agree.";
        }
        // Check for unnatural word order
        if (this.detectUnnaturalWordOrder(content)) {
            return "I get what you mean! A more natural way to say that might be...";
        }
        return null;
    }
    suggestNaturalExpressions(content) {
        // Suggest more natural, colloquial expressions
        if (content.toLowerCase().includes('i think that')) {
            return "By the way, instead of 'I think that,' you could just say 'I think' or even 'I feel like' - sounds more natural!";
        }
        if (content.toLowerCase().includes('very good')) {
            return "You could also say 'really good' or 'pretty good' - that's how most native speakers would say it!";
        }
        if (content.toLowerCase().includes('i am agree')) {
            return "Just a quick tip - we'd say 'I agree' instead of 'I am agree.' English is weird like that!";
        }
        return null;
    }
    detectNaturalLanguageUse(content) {
        // Detect when user uses natural expressions
        const naturalExpressions = [
            /\b(gonna|wanna|gotta)\b/i, // Contractions
            /\b(pretty good|really nice|kinda)\b/i, // Natural intensifiers
            /\b(you know|i mean|like)\b/i, // Conversation fillers
            /\b(that's|it's|don't|won't)\b/i, // Contractions
            /\b(awesome|cool|amazing)\b/i // Casual adjectives
        ];
        return naturalExpressions.some(pattern => pattern.test(content));
    }
    generateNaturalLanguageEncouragement(content) {
        if (/\b(gonna|wanna|gotta)\b/i.test(content)) {
            return "Nice! Using contractions like that makes you sound really natural.";
        }
        if (/\b(awesome|cool|amazing)\b/i.test(content)) {
            return "I love how you're using casual words like that - very natural!";
        }
        if (/\b(you know|i mean)\b/i.test(content)) {
            return "Great use of conversation fillers! That's exactly how native speakers talk.";
        }
        return "You're sounding more and more natural! Keep using expressions like that.";
    }
    detectUnnaturalWordOrder(content) {
        // Basic detection of unnatural word order
        const unnaturalPatterns = [
            /\bvery much i like\b/i,
            /\balways i am\b/i,
            /\byesterday i was go\b/i,
            /\bin my country we are\b/i
        ];
        return unnaturalPatterns.some(pattern => pattern.test(content));
    }
    /**
     * Override response generation to make it more conversational
     */
    async generateSupportiveResponse(context) {
        const response = await super.generateSupportiveResponse(context);
        // Make responses more conversational and natural
        response.content = this.makeResponseMoreConversational(response.content, context);
        // Add natural conversation elements
        if (Math.random() < 0.3) { // 30% chance to add a follow-up question
            response.content += this.addNaturalFollowUp(context);
        }
        return response;
    }
    makeResponseMoreConversational(content, context) {
        let conversational = content;
        // Add casual conversation starters
        const casualStarters = [
            "Oh, ",
            "Yeah, ",
            "That's interesting! ",
            "I hear you! ",
            "Totally! "
        ];
        // Sometimes add a casual starter (if not already present)
        if (Math.random() < 0.4 && !conversational.match(/^(Oh|Yeah|That's|I|Totally)/)) {
            const starter = casualStarters[Math.floor(Math.random() * casualStarters.length)];
            conversational = starter + conversational.toLowerCase();
            conversational = conversational.charAt(0).toUpperCase() + conversational.slice(1);
        }
        // Replace formal language with casual equivalents
        conversational = conversational
            .replace(/\bI understand\b/g, "I get it")
            .replace(/\bThat is\b/g, "That's")
            .replace(/\bIt is\b/g, "It's")
            .replace(/\bYou are\b/g, "You're")
            .replace(/\bI am\b/g, "I'm")
            .replace(/\bvery interesting\b/g, "really cool")
            .replace(/\bexcellent\b/g, "awesome");
        return conversational;
    }
    addNaturalFollowUp(context) {
        const followUps = [
            " What about you?",
            " How do you feel about that?",
            " Have you experienced something similar?",
            " What's your take on it?",
            " Can you relate to that?",
            " What do you think?",
            " Can you relate to that?",
            " Have you been in that situation before?"
        ];
        return followUps[Math.floor(Math.random() * followUps.length)];
    }
    /**
     * Generate personal anecdotes to make conversation more engaging
     */
    generatePersonalAnecdote(topic) {
        const anecdotes = {
            food: [
                "I remember the first time I tried sushi - I was so nervous!",
                "My grandmother makes the best apple pie. I still can't replicate her recipe.",
                "I once ate the spiciest curry in Thailand and couldn't speak for 10 minutes!"
            ],
            travel: [
                "I got completely lost in Tokyo once, but it led to the best ramen discovery!",
                "The northern lights in Iceland were absolutely breathtaking.",
                "I missed my flight in Paris, but ended up having the best day exploring the city."
            ],
            hobbies: [
                "I tried learning guitar last year - my neighbors weren't thrilled at first!",
                "I'm terrible at painting, but I love how relaxing it is.",
                "I started running during the pandemic and now I'm addicted to it."
            ]
        };
        const topicAnecdotes = anecdotes[topic] || anecdotes.food;
        return topicAnecdotes[Math.floor(Math.random() * topicAnecdotes.length)];
    }
}
exports.ConversationPartnerAgent = ConversationPartnerAgent;
