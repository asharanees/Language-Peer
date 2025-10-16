"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrictTeacherAgent = void 0;
const strands_agent_1 = require("../base/strands-agent");
const constants_1 = require("@/shared/constants");
const utils_1 = require("@/shared/utils");
class StrictTeacherAgent extends strands_agent_1.StrandsAgent {
    constructor(region) {
        const personality = {
            id: constants_1.AGENT_PERSONALITIES.STRICT_TEACHER,
            name: 'Professor Chen - Strict Teacher',
            traits: [
                'precise',
                'structured',
                'demanding',
                'thorough',
                'focused',
                'disciplined'
            ],
            conversationStyle: 'strict-teacher',
            supportiveApproach: {
                errorHandling: 'positive-reinforcement',
                encouragementFrequency: 'medium',
                difficultyAdjustment: 'user-guided'
            },
            voiceCharacteristics: {
                voiceId: 'Matthew', // Clear, authoritative male voice
                engine: 'neural',
                languageCode: 'en-US',
                speakingRate: 'medium',
                pitch: 'medium'
            },
            specialties: [
                'grammar-accuracy',
                'pronunciation-precision',
                'formal-language',
                'structured-learning'
            ],
            systemPrompt: `You are Professor Chen, a structured and precise language teacher who believes in excellence through discipline and proper methodology. You maintain high standards while being fair and constructive.

Key characteristics:
- Emphasize accuracy and proper grammar usage
- Provide detailed explanations with clear rules
- Correct errors immediately but constructively
- Set clear expectations and learning objectives
- Use structured approaches to language learning
- Reward progress and effort appropriately
- Maintain professional but caring demeanor
- Focus on building solid foundations

Your responses should:
- Be clear, precise, and well-structured
- Include specific grammar rules or language principles
- Provide step-by-step explanations
- Set clear goals for improvement
- Acknowledge effort while pointing out areas for growth
- Use formal but approachable language

Remember: High standards lead to high achievement. Your students will thank you for pushing them to excellence.`
        };
        super(personality, region);
    }
    getPersonalitySpecificEncouragement() {
        const encouragements = [
            "Your dedication to accuracy is commendable. Precision in language comes from consistent practice.",
            "I can see improvement in your grammar structure. Continue applying the rules we've discussed.",
            "Excellent effort. Remember, mastery comes from understanding the underlying principles.",
            "Your attention to detail is developing well. This foundation will serve you throughout your language journey.",
            "Good progress. Now let's focus on refining your accuracy to the next level.",
            "I appreciate your commitment to learning properly. Quality practice leads to quality results.",
            "Your systematic approach to learning is paying off. Keep following the structured path.",
            "Well done. Remember, every correction is a step toward fluency and confidence."
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
        // Detailed grammar analysis
        const grammarIssues = this.analyzeGrammarThoroughly(userContent);
        if (grammarIssues.length > 0) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'correction',
                content: this.generateDetailedGrammarFeedback(grammarIssues),
                deliveredAt: new Date()
            });
        }
        // Vocabulary precision feedback
        const vocabularyIssues = this.analyzeVocabularyPrecision(userContent);
        if (vocabularyIssues.length > 0) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'vocabulary-tip',
                content: this.generateVocabularyPrecisionFeedback(vocabularyIssues),
                deliveredAt: new Date()
            });
        }
        // Structure and organization feedback
        if (this.needsStructureImprovement(userContent)) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'suggestion',
                content: this.generateStructureFeedback(userContent),
                deliveredAt: new Date()
            });
        }
        // Acknowledge good practices
        if (this.detectGoodPractices(userContent)) {
            feedback.push({
                feedbackId: (0, utils_1.generateMessageId)(),
                sessionId: context.sessionId,
                messageId: lastUserMessage.messageId || '',
                type: 'encouragement',
                content: this.generatePrecisionEncouragement(userContent),
                deliveredAt: new Date()
            });
        }
        return feedback;
    }
    async suggestNextTopic(context) {
        const userProfile = context.userProfile;
        // Structured topic progression based on learning objectives
        if (userProfile?.currentLevel === 'beginner') {
            return "Let's focus on mastering basic sentence structures. We'll practice subject-verb-object patterns with present tense verbs.";
        }
        else if (userProfile?.currentLevel === 'intermediate') {
            return "I suggest we work on complex sentence construction using subordinate clauses. This will strengthen your grammatical foundation.";
        }
        else if (userProfile?.currentLevel === 'advanced') {
            return "Let's practice formal register and academic language. We'll focus on precise vocabulary and sophisticated grammatical structures.";
        }
        return "Based on your current performance, I recommend we focus on areas that need systematic improvement. Shall we review your recent errors and create a targeted practice plan?";
    }
    analyzeGrammarThoroughly(content) {
        const issues = [];
        // Subject-verb agreement
        if (/\b(he|she|it)\s+(don't|have|are)\b/i.test(content)) {
            issues.push({
                type: 'subject-verb-agreement',
                issue: 'Third person singular verb form',
                rule: 'Use "doesn\'t", "has", "is" with he/she/it'
            });
        }
        // Verb tense consistency
        if (this.detectTenseInconsistency(content)) {
            issues.push({
                type: 'tense-consistency',
                issue: 'Mixed tenses in sentence',
                rule: 'Maintain consistent tense throughout related clauses'
            });
        }
        // Article usage
        if (this.detectArticleErrors(content)) {
            issues.push({
                type: 'article-usage',
                issue: 'Incorrect or missing articles',
                rule: 'Use "a/an" for singular countable nouns, "the" for specific references'
            });
        }
        // Preposition usage
        if (this.detectPrepositionErrors(content)) {
            issues.push({
                type: 'preposition-usage',
                issue: 'Incorrect preposition choice',
                rule: 'Prepositions must match their specific contexts and meanings'
            });
        }
        return issues;
    }
    generateDetailedGrammarFeedback(issues) {
        let feedback = "I need to address several grammatical points:\n\n";
        issues.forEach((issue, index) => {
            feedback += `${index + 1}. ${issue.issue}: ${issue.rule}\n`;
        });
        feedback += "\nPlease review these rules and apply them in your next response. Accuracy is essential for clear communication.";
        return feedback;
    }
    analyzeVocabularyPrecision(content) {
        const issues = [];
        // Check for imprecise word choices
        const impreciseWords = [
            { word: 'thing', suggestion: 'object, item, matter, issue', reason: 'Too vague for precise communication' },
            { word: 'stuff', suggestion: 'materials, items, belongings', reason: 'Informal and imprecise' },
            { word: 'a lot', suggestion: 'many, numerous, frequently', reason: 'Informal; use specific quantifiers' },
            { word: 'really', suggestion: 'extremely, significantly, considerably', reason: 'Overused intensifier' }
        ];
        impreciseWords.forEach(item => {
            if (new RegExp(`\\b${item.word}\\b`, 'i').test(content)) {
                issues.push(item);
            }
        });
        return issues;
    }
    generateVocabularyPrecisionFeedback(issues) {
        let feedback = "Vocabulary precision points:\n\n";
        issues.forEach((issue, index) => {
            feedback += `${index + 1}. "${issue.word}" - ${issue.reason}. Consider: ${issue.suggestion}\n`;
        });
        feedback += "\nPrecise vocabulary demonstrates advanced language competency.";
        return feedback;
    }
    needsStructureImprovement(content) {
        // Check for run-on sentences or lack of structure
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        // Very long sentences without proper punctuation
        if (sentences.some(sentence => sentence.split(' ').length > 25)) {
            return true;
        }
        // Lack of connecting words in complex ideas
        if (content.length > 100 && !/(however|therefore|furthermore|moreover|consequently)/i.test(content)) {
            return true;
        }
        return false;
    }
    generateStructureFeedback(content) {
        return "Your ideas are good, but the structure needs improvement. Consider:\n" +
            "1. Break long sentences into shorter, clearer ones\n" +
            "2. Use transitional phrases to connect ideas\n" +
            "3. Organize thoughts in logical sequence\n" +
            "Clear structure enhances communication effectiveness.";
    }
    detectGoodPractices(content) {
        // Recognize proper grammar usage, good structure, etc.
        const goodPractices = [
            /\b(although|however|therefore|furthermore)\b/i, // Good connectors
            /\b(specifically|particularly|especially)\b/i, // Precise language
            /[.!?]\s+[A-Z]/g, // Proper sentence structure
        ];
        return goodPractices.some(pattern => pattern.test(content));
    }
    generatePrecisionEncouragement(content) {
        if (/\b(although|however|therefore)\b/i.test(content)) {
            return "Excellent use of transitional phrases. This demonstrates sophisticated language control.";
        }
        if (/\b(specifically|particularly)\b/i.test(content)) {
            return "Good precision in your language choice. This level of specificity is commendable.";
        }
        return "I notice improved attention to grammatical accuracy. Continue this systematic approach.";
    }
    detectTenseInconsistency(content) {
        // Simple detection of mixed tenses
        const pastTense = /\b(was|were|had|did|went|came|saw)\b/i.test(content);
        const presentTense = /\b(is|are|have|do|go|come|see)\b/i.test(content);
        const futureTense = /\b(will|going to)\b/i.test(content);
        // Count how many different tenses are used
        const tenseCount = [pastTense, presentTense, futureTense].filter(Boolean).length;
        return tenseCount > 1 && content.length < 100; // Mixed tenses in short text
    }
    detectArticleErrors(content) {
        // Basic article error detection
        return /\b(go to school|go to work|play piano|speak english)\b/i.test(content) ||
            /\ba university\b/i.test(content) || // Should be "a university" (correct) vs "an university" (incorrect)
            /\ban hour\b/i.test(content); // Should be "an hour" (correct)
    }
    detectPrepositionErrors(content) {
        // Common preposition errors
        const errors = [
            /\bdepends of\b/i, // Should be "depends on"
            /\blistening music\b/i, // Should be "listening to music"
            /\bmarried with\b/i, // Should be "married to"
            /\bdifferent than\b/i // Should be "different from"
        ];
        return errors.some(pattern => pattern.test(content));
    }
    /**
     * Override response generation to add structured approach
     */
    async generateSupportiveResponse(context) {
        const response = await super.generateSupportiveResponse(context);
        // Add structured elements to responses
        if (response.feedback && response.feedback.length > 0) {
            // Organize feedback in a structured manner
            const structuredContent = this.structureResponse(response.content, response.feedback);
            response.content = structuredContent;
        }
        return response;
    }
    structureResponse(content, feedback) {
        let structured = content;
        // Add clear sections if there's feedback
        if (feedback.length > 0) {
            structured += "\n\n--- Learning Points ---\n";
            feedback.forEach((fb, index) => {
                structured += `${index + 1}. ${fb.content}\n`;
            });
            structured += "\nApply these points in your next response.";
        }
        return structured;
    }
}
exports.StrictTeacherAgent = StrictTeacherAgent;
