"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = void 0;
const friendly_tutor_1 = require("../personalities/friendly-tutor");
const strict_teacher_1 = require("../personalities/strict-teacher");
const conversation_partner_1 = require("../personalities/conversation-partner");
const pronunciation_coach_1 = require("../personalities/pronunciation-coach");
const constants_1 = require("@/shared/constants");
class AgentFactory {
    constructor(region) {
        this.agents = new Map();
        this.region = region || process.env.AWS_REGION || 'us-east-1';
        this.initializeAgents();
    }
    /**
     * Initialize all available agents
     */
    initializeAgents() {
        this.agents.set(constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR, new friendly_tutor_1.FriendlyTutorAgent(this.region));
        this.agents.set(constants_1.AGENT_PERSONALITIES.STRICT_TEACHER, new strict_teacher_1.StrictTeacherAgent(this.region));
        this.agents.set(constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER, new conversation_partner_1.ConversationPartnerAgent(this.region));
        this.agents.set(constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH, new pronunciation_coach_1.PronunciationCoachAgent(this.region));
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }
    /**
     * Get all available agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get all agent personalities (metadata only)
     */
    getAllAgentPersonalities() {
        return Array.from(this.agents.values()).map(agent => agent.getPersonality());
    }
    /**
     * Recommend the best agent based on user profile and context
     */
    recommendAgent(userProfile, context) {
        const recommendations = [];
        // Analyze user profile for agent recommendation
        const { currentLevel, learningGoals, preferredAgents } = userProfile;
        // Check user preferences first
        if (preferredAgents && preferredAgents.length > 0) {
            const preferredAgent = preferredAgents[0];
            if (this.agents.has(preferredAgent)) {
                recommendations.push({
                    agentId: preferredAgent,
                    confidence: 0.9,
                    reason: 'User preference'
                });
            }
        }
        // Recommend based on learning goals
        learningGoals.forEach(goal => {
            switch (goal) {
                case 'pronunciation-improvement':
                    recommendations.push({
                        agentId: constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH,
                        confidence: 0.8,
                        reason: 'Specialized in pronunciation improvement'
                    });
                    break;
                case 'grammar-accuracy':
                    recommendations.push({
                        agentId: constants_1.AGENT_PERSONALITIES.STRICT_TEACHER,
                        confidence: 0.8,
                        reason: 'Focused on grammar accuracy and structure'
                    });
                    break;
                case 'conversation-fluency':
                    recommendations.push({
                        agentId: constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER,
                        confidence: 0.8,
                        reason: 'Natural conversation practice'
                    });
                    break;
                case 'confidence-building':
                    recommendations.push({
                        agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                        confidence: 0.8,
                        reason: 'Supportive and encouraging approach'
                    });
                    break;
            }
        });
        // Recommend based on language level
        switch (currentLevel) {
            case 'beginner':
            case 'elementary':
                recommendations.push({
                    agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                    confidence: 0.7,
                    reason: 'Patient and supportive for beginners'
                });
                break;
            case 'intermediate':
                recommendations.push({
                    agentId: constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER,
                    confidence: 0.7,
                    reason: 'Natural conversation practice for intermediate level'
                });
                break;
            case 'upper-intermediate':
            case 'advanced':
                recommendations.push({
                    agentId: constants_1.AGENT_PERSONALITIES.STRICT_TEACHER,
                    confidence: 0.7,
                    reason: 'Structured approach for advanced learners'
                });
                break;
            case 'proficient':
                recommendations.push({
                    agentId: constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER,
                    confidence: 0.8,
                    reason: 'Natural conversation for proficient speakers'
                });
                break;
        }
        // Analyze conversation context if provided
        if (context) {
            const contextRecommendation = this.analyzeContextForRecommendation(context);
            if (contextRecommendation) {
                recommendations.push(contextRecommendation);
            }
        }
        // Return the highest confidence recommendation
        if (recommendations.length === 0) {
            // Default recommendation
            return {
                agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                confidence: 0.5,
                reason: 'Default friendly approach'
            };
        }
        // Sort by confidence and return the best match
        recommendations.sort((a, b) => b.confidence - a.confidence);
        return recommendations[0];
    }
    /**
     * Recommend agent handoff based on conversation analysis
     */
    recommendAgentHandoff(currentAgentId, context, userProfile) {
        const conversationHistory = context.conversationHistory;
        // Analyze recent conversation for handoff triggers
        const recentMessages = conversationHistory.slice(-10);
        const userMessages = recentMessages.filter(msg => msg.sender === 'user');
        // Check for frustration indicators
        const frustrationLevel = this.analyzeFrustrationLevel(userMessages);
        if (frustrationLevel > 0.7 && currentAgentId !== constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR) {
            return {
                agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                confidence: 0.8,
                reason: 'High frustration detected - switching to supportive approach'
            };
        }
        // Check for pronunciation issues
        const pronunciationIssues = this.analyzePronunciationIssues(userMessages);
        if (pronunciationIssues > 0.6 && currentAgentId !== constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH) {
            return {
                agentId: constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH,
                confidence: 0.8,
                reason: 'Pronunciation challenges detected'
            };
        }
        // Check for grammar focus needs
        const grammarFocus = this.analyzeGrammarFocusNeed(userMessages);
        if (grammarFocus > 0.7 && currentAgentId !== constants_1.AGENT_PERSONALITIES.STRICT_TEACHER) {
            return {
                agentId: constants_1.AGENT_PERSONALITIES.STRICT_TEACHER,
                confidence: 0.7,
                reason: 'Grammar improvement needed'
            };
        }
        // Check for conversation practice readiness
        const conversationReadiness = this.analyzeConversationReadiness(userMessages, userProfile);
        if (conversationReadiness > 0.7 && currentAgentId !== constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER) {
            return {
                agentId: constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER,
                confidence: 0.7,
                reason: 'Ready for natural conversation practice'
            };
        }
        return null; // No handoff recommended
    }
    /**
     * Get agents suitable for specific scenarios
     */
    getAgentsForScenario(scenario) {
        const scenarioAgentMap = {
            'pronunciation-practice': [constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH, constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR],
            'grammar-lesson': [constants_1.AGENT_PERSONALITIES.STRICT_TEACHER, constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR],
            'casual-conversation': [constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER, constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR],
            'confidence-building': [constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR, constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER],
            'advanced-practice': [constants_1.AGENT_PERSONALITIES.STRICT_TEACHER, constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER],
            'beginner-support': [constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR, constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH]
        };
        const agentIds = scenarioAgentMap[scenario] || [];
        return agentIds.map(id => this.agents.get(id)).filter(agent => agent !== undefined);
    }
    analyzeContextForRecommendation(context) {
        const { conversationHistory, currentTopic } = context;
        // Analyze conversation patterns
        if (conversationHistory.length > 0) {
            const recentUserMessages = conversationHistory
                .filter(msg => msg.sender === 'user')
                .slice(-5);
            // Check for pronunciation issues in transcription confidence
            const lowConfidenceMessages = recentUserMessages.filter(msg => msg.transcriptionConfidence && msg.transcriptionConfidence < 0.6);
            if (lowConfidenceMessages.length >= 2) {
                return {
                    agentId: constants_1.AGENT_PERSONALITIES.PRONUNCIATION_COACH,
                    confidence: 0.8,
                    reason: 'Low transcription confidence indicates pronunciation issues'
                };
            }
            // Check for grammar-focused conversation
            const grammarKeywords = ['grammar', 'correct', 'mistake', 'error', 'rule'];
            const grammarFocused = recentUserMessages.some(msg => grammarKeywords.some(keyword => msg.content.toLowerCase().includes(keyword)));
            if (grammarFocused) {
                return {
                    agentId: constants_1.AGENT_PERSONALITIES.STRICT_TEACHER,
                    confidence: 0.7,
                    reason: 'Grammar-focused conversation detected'
                };
            }
        }
        return null;
    }
    analyzeFrustrationLevel(userMessages) {
        let frustrationScore = 0;
        const totalMessages = userMessages.length || 1;
        userMessages.forEach(msg => {
            const content = msg.content.toLowerCase();
            if (content.includes('difficult') || content.includes('hard'))
                frustrationScore += 0.3;
            if (content.includes('confused') || content.includes('don\'t understand'))
                frustrationScore += 0.4;
            if (content.includes('give up') || content.includes('too hard'))
                frustrationScore += 0.5;
            if (content.length < 10)
                frustrationScore += 0.2; // Short responses
        });
        return Math.min(frustrationScore / totalMessages, 1);
    }
    analyzePronunciationIssues(userMessages) {
        let issueScore = 0;
        const totalMessages = userMessages.length || 1;
        userMessages.forEach(msg => {
            if (msg.transcriptionConfidence && msg.transcriptionConfidence < 0.6) {
                issueScore += 0.4;
            }
            if (msg.transcriptionConfidence && msg.transcriptionConfidence < 0.4) {
                issueScore += 0.6;
            }
        });
        return Math.min(issueScore / totalMessages, 1);
    }
    analyzeGrammarFocusNeed(userMessages) {
        let grammarScore = 0;
        const totalMessages = userMessages.length || 1;
        userMessages.forEach(msg => {
            const content = msg.content.toLowerCase();
            // Check for grammar-related questions or issues
            if (content.includes('grammar') || content.includes('correct'))
                grammarScore += 0.4;
            if (content.includes('mistake') || content.includes('error'))
                grammarScore += 0.3;
            if (content.includes('rule') || content.includes('why'))
                grammarScore += 0.2;
        });
        return Math.min(grammarScore / totalMessages, 1);
    }
    analyzeConversationReadiness(userMessages, userProfile) {
        let readinessScore = 0;
        // Check user level
        if (['intermediate', 'upper-intermediate', 'advanced', 'proficient'].includes(userProfile.currentLevel)) {
            readinessScore += 0.4;
        }
        // Check message complexity and length
        const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / (userMessages.length || 1);
        if (avgMessageLength > 30)
            readinessScore += 0.3;
        // Check for conversational elements
        const conversationalElements = userMessages.some(msg => {
            const content = msg.content.toLowerCase();
            return content.includes('?') || content.includes('what') || content.includes('how') || content.includes('why');
        });
        if (conversationalElements)
            readinessScore += 0.3;
        return Math.min(readinessScore, 1);
    }
}
exports.AgentFactory = AgentFactory;
