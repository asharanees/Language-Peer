"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engagement_detection_service_1 = require("../engagement-detection-service");
describe('EngagementDetectionService', () => {
    let service;
    const mockUserProfile = {
        userId: 'user-123',
        targetLanguage: 'English',
        nativeLanguage: 'Spanish',
        currentLevel: 'intermediate',
        learningGoals: ['improve fluency'],
        preferredAgents: ['friendly-tutor'],
        conversationTopics: ['travel', 'technology'],
        progressMetrics: {
            overallScore: 75,
            grammarScore: 80,
            fluencyScore: 70,
            vocabularyScore: 75,
            sessionsCompleted: 10,
            totalPracticeTime: 300
        },
        lastSessionDate: new Date(),
        totalSessionTime: 300,
        milestones: []
    };
    beforeEach(() => {
        service = new engagement_detection_service_1.EngagementDetectionService();
    });
    describe('analyzeEngagement', () => {
        it('should detect high engagement from quality responses', () => {
            const highEngagementMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'Tell me about your favorite travel destination.',
                    timestamp: new Date(Date.now() - 10000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'I absolutely love visiting Japan because the culture is so fascinating and the food is incredible. The people are very welcoming and I enjoy learning about their traditions.',
                    timestamp: new Date(Date.now() - 8000),
                    confidence: 0.9
                },
                {
                    id: 'msg-3',
                    type: 'agent',
                    content: 'That sounds wonderful! What was your most memorable experience there?',
                    timestamp: new Date(Date.now() - 6000)
                },
                {
                    id: 'msg-4',
                    type: 'user',
                    content: 'The cherry blossom festival was amazing. I participated in a traditional tea ceremony and learned so much about Japanese customs.',
                    timestamp: new Date(Date.now() - 4000),
                    confidence: 0.85
                }
            ];
            const analysis = service.analyzeEngagement(highEngagementMessages, mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeGreaterThan(70);
            expect(analysis.riskLevel).toBe('low');
            expect(analysis.interventionUrgency).toBe('none');
        });
        it('should detect low engagement from short responses', () => {
            const lowEngagementMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'How was your weekend?',
                    timestamp: new Date(Date.now() - 20000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Good',
                    timestamp: new Date(Date.now() - 15000),
                    confidence: 0.4
                },
                {
                    id: 'msg-3',
                    type: 'agent',
                    content: 'What did you do?',
                    timestamp: new Date(Date.now() - 10000)
                },
                {
                    id: 'msg-4',
                    type: 'user',
                    content: 'Nothing',
                    timestamp: new Date(Date.now() - 5000),
                    confidence: 0.3
                }
            ];
            const analysis = service.analyzeEngagement(lowEngagementMessages, mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeLessThan(40);
            expect(analysis.riskLevel).toBe('medium');
            expect(analysis.recommendedActions.length).toBeGreaterThan(0);
        });
        it('should detect frustration indicators', () => {
            const frustratedMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'Let\'s practice some grammar.',
                    timestamp: new Date(Date.now() - 10000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'This is too difficult, I don\'t understand',
                    timestamp: new Date(Date.now() - 8000),
                    confidence: 0.5
                },
                {
                    id: 'msg-3',
                    type: 'agent',
                    content: 'Let me help you with that.',
                    timestamp: new Date(Date.now() - 6000)
                },
                {
                    id: 'msg-4',
                    type: 'user',
                    content: 'I\'m confused and can\'t do this',
                    timestamp: new Date(Date.now() - 4000),
                    confidence: 0.4
                }
            ];
            const analysis = service.analyzeEngagement(frustratedMessages, mockUserProfile, 300);
            expect(analysis.riskLevel).toBe('high');
            expect(analysis.interventionUrgency).toBe('high');
            expect(analysis.detectedPatterns).toContain('frustration_detected');
            expect(analysis.recommendedActions.some(action => action.type === 'encouragement')).toBe(true);
        });
        it('should handle empty conversation gracefully', () => {
            const analysis = service.analyzeEngagement([], mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeDefined();
            expect(analysis.riskLevel).toBeDefined();
            expect(analysis.recommendedActions).toBeDefined();
        });
    });
    describe('detectDisengagementPatterns', () => {
        it('should detect decreasing message length pattern', () => {
            const messages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoyed our conversation about travel and would love to share more stories about my experiences',
                    timestamp: new Date(Date.now() - 15000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'It was interesting to learn about different cultures',
                    timestamp: new Date(Date.now() - 10000)
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Yes, good',
                    timestamp: new Date(Date.now() - 5000)
                },
                {
                    id: 'msg-4',
                    type: 'user',
                    content: 'Ok',
                    timestamp: new Date(Date.now() - 2000)
                }
            ];
            const patterns = service.detectDisengagementPatterns(messages);
            expect(patterns.some(p => p.pattern === 'decreasing_verbosity')).toBe(true);
            expect(patterns.some(p => p.pattern === 'repetitive_responses')).toBe(true);
        });
        it('should detect declining confidence pattern', () => {
            const messages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I love traveling',
                    timestamp: new Date(Date.now() - 15000),
                    confidence: 0.9
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'It is interesting',
                    timestamp: new Date(Date.now() - 10000),
                    confidence: 0.7
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Yes maybe',
                    timestamp: new Date(Date.now() - 5000),
                    confidence: 0.4
                },
                {
                    id: 'msg-4',
                    type: 'user',
                    content: 'I think so',
                    timestamp: new Date(Date.now() - 2000),
                    confidence: 0.3
                }
            ];
            const patterns = service.detectDisengagementPatterns(messages);
            expect(patterns.some(p => p.pattern === 'declining_confidence')).toBe(true);
        });
        it('should detect frustration keywords', () => {
            const messages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'This is too hard for me',
                    timestamp: new Date()
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'I don\'t understand this at all',
                    timestamp: new Date()
                }
            ];
            const patterns = service.detectDisengagementPatterns(messages);
            expect(patterns.some(p => p.pattern === 'frustration_indicators')).toBe(true);
        });
        it('should return empty array for engaged conversation', () => {
            const messages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoy learning about different cultures through travel',
                    timestamp: new Date(Date.now() - 10000),
                    confidence: 0.9
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'My favorite destination was Japan because of the amazing food and friendly people',
                    timestamp: new Date(Date.now() - 5000),
                    confidence: 0.85
                }
            ];
            const patterns = service.detectDisengagementPatterns(messages);
            expect(patterns.length).toBe(0);
        });
    });
    describe('generateEngagementInterventions', () => {
        it('should generate immediate interventions for high-risk situations', () => {
            const highRiskAnalysis = {
                overallEngagement: 15,
                riskLevel: 'high',
                recommendedActions: [],
                detectedPatterns: ['frustration_detected'],
                interventionUrgency: 'high'
            };
            const interventions = service.generateEngagementInterventions(highRiskAnalysis, mockUserProfile, 'Grammar Practice');
            expect(interventions.immediate.length).toBeGreaterThan(0);
            expect(interventions.immediate.some(action => action.type === 'encouragement')).toBe(true);
            expect(interventions.immediate.some(action => action.priority === 'high')).toBe(true);
        });
        it('should generate topic change for medium urgency', () => {
            const mediumRiskAnalysis = {
                overallEngagement: 35,
                riskLevel: 'medium',
                recommendedActions: [],
                detectedPatterns: [],
                interventionUrgency: 'medium'
            };
            const interventions = service.generateEngagementInterventions(mediumRiskAnalysis, mockUserProfile, 'Grammar Practice');
            expect(interventions.immediate.some(action => action.type === 'topic_change')).toBe(true);
        });
        it('should generate long-term interventions for declining performance', () => {
            const decliningAnalysis = {
                overallEngagement: 30,
                riskLevel: 'medium',
                recommendedActions: [],
                detectedPatterns: ['declining_performance'],
                interventionUrgency: 'low'
            };
            const interventions = service.generateEngagementInterventions(decliningAnalysis, mockUserProfile, 'Current Topic');
            expect(interventions.longTerm.length).toBeGreaterThan(0);
        });
    });
    describe('monitorRealTimeEngagement', () => {
        it('should calculate current engagement correctly', () => {
            const recentMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'How are you today?',
                    timestamp: new Date(Date.now() - 30000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'I\'m doing great! I had a wonderful day exploring the city and trying new restaurants.',
                    timestamp: new Date(Date.now() - 25000),
                    confidence: 0.9
                }
            ];
            const result = service.monitorRealTimeEngagement(recentMessages, 60000);
            expect(result.currentEngagement).toBeGreaterThan(50);
            expect(result.trend).toBeDefined();
            expect(result.alertLevel).toBeDefined();
        });
        it('should detect declining trend', () => {
            const messages = [
                // Previous window - high engagement
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I love discussing travel experiences and learning about different cultures',
                    timestamp: new Date(Date.now() - 90000),
                    confidence: 0.9
                },
                // Current window - low engagement
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Ok',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.4
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Sure',
                    timestamp: new Date(Date.now() - 15000),
                    confidence: 0.3
                }
            ];
            const result = service.monitorRealTimeEngagement(messages, 60000);
            expect(result.trend).toBe('declining');
            expect(result.alertLevel).not.toBe('none');
        });
        it('should set high alert for critical engagement', () => {
            const criticalMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'No',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.2
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'I don\'t know',
                    timestamp: new Date(Date.now() - 15000),
                    confidence: 0.1
                }
            ];
            const result = service.monitorRealTimeEngagement(criticalMessages, 60000);
            expect(result.alertLevel).toBe('high');
        });
    });
    describe('pattern detection edge cases', () => {
        it('should handle insufficient data gracefully', () => {
            const singleMessage = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Hello',
                    timestamp: new Date()
                }
            ];
            const patterns = service.detectDisengagementPatterns(singleMessage);
            expect(patterns).toBeDefined();
            expect(Array.isArray(patterns)).toBe(true);
        });
        it('should handle messages without confidence scores', () => {
            const messagesWithoutConfidence = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'This is a message without confidence',
                    timestamp: new Date()
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Another message',
                    timestamp: new Date()
                }
            ];
            const analysis = service.analyzeEngagement(messagesWithoutConfidence, mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeDefined();
        });
        it('should handle mixed message types correctly', () => {
            const mixedMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'Hello, how are you?',
                    timestamp: new Date(Date.now() - 10000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'I\'m fine, thank you',
                    timestamp: new Date(Date.now() - 8000),
                    confidence: 0.8
                },
                {
                    id: 'msg-3',
                    type: 'agent',
                    content: 'Great! What would you like to talk about?',
                    timestamp: new Date(Date.now() - 6000)
                }
            ];
            const analysis = service.analyzeEngagement(mixedMessages, mockUserProfile, 300);
            expect(analysis).toBeDefined();
            expect(analysis.overallEngagement).toBeGreaterThan(0);
        });
    });
    describe('engagement scoring accuracy', () => {
        it('should score positive emotional tone higher', () => {
            const positiveMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I love this conversation! It\'s great and wonderful to learn new things.',
                    timestamp: new Date(),
                    confidence: 0.9
                }
            ];
            const negativeMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I hate this. It\'s terrible and bad.',
                    timestamp: new Date(),
                    confidence: 0.9
                }
            ];
            const positiveAnalysis = service.analyzeEngagement(positiveMessages, mockUserProfile, 300);
            const negativeAnalysis = service.analyzeEngagement(negativeMessages, mockUserProfile, 300);
            expect(positiveAnalysis.overallEngagement).toBeGreaterThan(negativeAnalysis.overallEngagement);
        });
        it('should score complex messages higher than simple ones', () => {
            const complexMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I thoroughly enjoyed exploring the magnificent architecture and experiencing the diverse culinary traditions during my recent journey to Barcelona.',
                    timestamp: new Date(),
                    confidence: 0.8
                }
            ];
            const simpleMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Yes',
                    timestamp: new Date(),
                    confidence: 0.8
                }
            ];
            const complexAnalysis = service.analyzeEngagement(complexMessages, mockUserProfile, 300);
            const simpleAnalysis = service.analyzeEngagement(simpleMessages, mockUserProfile, 300);
            expect(complexAnalysis.overallEngagement).toBeGreaterThan(simpleAnalysis.overallEngagement);
        });
    });
    // Additional comprehensive tests for engagement detection with various user behaviors
    describe('Advanced Engagement Detection Tests', () => {
        it('should detect engagement patterns across different user profiles', () => {
            const beginnerProfile = {
                ...mockUserProfile,
                currentLevel: 'beginner',
                learningGoals: ['basic communication']
            };
            const advancedProfile = {
                ...mockUserProfile,
                currentLevel: 'advanced',
                learningGoals: ['professional fluency']
            };
            const beginnerMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I like food. Good food.',
                    timestamp: new Date(),
                    confidence: 0.7
                }
            ];
            const advancedMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I appreciate the nuanced flavors and sophisticated culinary techniques.',
                    timestamp: new Date(),
                    confidence: 0.9
                }
            ];
            const beginnerAnalysis = service.analyzeEngagement(beginnerMessages, beginnerProfile, 300);
            const advancedAnalysis = service.analyzeEngagement(advancedMessages, advancedProfile, 300);
            // Both should be considered appropriate for their levels
            expect(beginnerAnalysis.overallEngagement).toBeGreaterThan(40);
            expect(advancedAnalysis.overallEngagement).toBeGreaterThan(60);
        });
        it('should detect response time patterns indicating disengagement', () => {
            const slowResponseMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'How was your day?',
                    timestamp: new Date(Date.now() - 25000)
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Fine',
                    timestamp: new Date(Date.now() - 5000), // 20 second delay
                    confidence: 0.6
                }
            ];
            const analysis = service.analyzeEngagement(slowResponseMessages, mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeLessThan(60);
            expect(analysis.detectedPatterns).toContain('slow_responses');
        });
        it('should identify participation level based on message frequency and length', () => {
            const highParticipationMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoyed visiting the museum yesterday and learning about ancient history.',
                    timestamp: new Date(Date.now() - 60000),
                    confidence: 0.9
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'The artifacts were fascinating and the guide provided excellent explanations.',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.85
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'I would definitely recommend it to anyone interested in cultural experiences.',
                    timestamp: new Date(Date.now() - 10000),
                    confidence: 0.88
                }
            ];
            const lowParticipationMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Yes',
                    timestamp: new Date(Date.now() - 180000), // 3 minutes ago
                    confidence: 0.5
                }
            ];
            const highAnalysis = service.analyzeEngagement(highParticipationMessages, mockUserProfile, 300);
            const lowAnalysis = service.analyzeEngagement(lowParticipationMessages, mockUserProfile, 300);
            expect(highAnalysis.overallEngagement).toBeGreaterThan(lowAnalysis.overallEngagement);
        });
        it('should detect confidence decline patterns', () => {
            const decliningConfidenceMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I understand this topic well',
                    timestamp: new Date(Date.now() - 15000),
                    confidence: 0.9
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Maybe I can try',
                    timestamp: new Date(Date.now() - 10000),
                    confidence: 0.6
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'I think so',
                    timestamp: new Date(Date.now() - 5000),
                    confidence: 0.3
                }
            ];
            const patterns = service.detectDisengagementPatterns(decliningConfidenceMessages);
            expect(patterns.some(p => p.pattern === 'declining_confidence')).toBe(true);
            expect(patterns.some(p => p.pattern === 'decreasing_verbosity')).toBe(true);
        });
        it('should generate appropriate interventions for different risk levels', () => {
            const criticalRiskAnalysis = {
                overallEngagement: 10,
                riskLevel: 'high',
                recommendedActions: [],
                detectedPatterns: ['frustration_detected', 'declining_confidence'],
                interventionUrgency: 'high'
            };
            const mediumRiskAnalysis = {
                overallEngagement: 35,
                riskLevel: 'medium',
                recommendedActions: [],
                detectedPatterns: ['slow_responses'],
                interventionUrgency: 'medium'
            };
            const criticalInterventions = service.generateEngagementInterventions(criticalRiskAnalysis, mockUserProfile, 'Grammar Practice');
            const mediumInterventions = service.generateEngagementInterventions(mediumRiskAnalysis, mockUserProfile, 'Conversation Practice');
            expect(criticalInterventions.immediate.length).toBeGreaterThan(mediumInterventions.immediate.length);
            expect(criticalInterventions.immediate.some(action => action.priority === 'high')).toBe(true);
        });
        it('should adapt interventions to user learning goals', () => {
            const confidenceProfile = {
                ...mockUserProfile,
                learningGoals: ['build confidence', 'overcome speaking anxiety']
            };
            const fluencyProfile = {
                ...mockUserProfile,
                learningGoals: ['improve fluency', 'advanced grammar']
            };
            const lowEngagementAnalysis = {
                overallEngagement: 25,
                riskLevel: 'medium',
                recommendedActions: [],
                detectedPatterns: ['low_confidence'],
                interventionUrgency: 'medium'
            };
            const confidenceInterventions = service.generateEngagementInterventions(lowEngagementAnalysis, confidenceProfile, 'Basic Conversation');
            const fluencyInterventions = service.generateEngagementInterventions(lowEngagementAnalysis, fluencyProfile, 'Advanced Discussion');
            // Both should provide interventions but potentially different types
            expect(confidenceInterventions.immediate.length).toBeGreaterThan(0);
            expect(fluencyInterventions.immediate.length).toBeGreaterThan(0);
        });
    });
    describe('Real-time Monitoring Tests', () => {
        it('should track engagement trends over time windows', () => {
            const trendMessages = [
                // Earlier window - high engagement
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I love discussing cultural differences and learning about various traditions around the world.',
                    timestamp: new Date(Date.now() - 90000), // 1.5 minutes ago
                    confidence: 0.9
                },
                // Current window - declining engagement
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Ok sure',
                    timestamp: new Date(Date.now() - 30000), // 30 seconds ago
                    confidence: 0.4
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Yes',
                    timestamp: new Date(Date.now() - 15000), // 15 seconds ago
                    confidence: 0.3
                }
            ];
            const result = service.monitorRealTimeEngagement(trendMessages, 60000);
            expect(result.trend).toBe('declining');
            expect(result.alertLevel).not.toBe('none');
        });
        it('should set appropriate alert levels based on engagement thresholds', () => {
            const criticalMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'No',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.1
                }
            ];
            const mediumMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I guess so',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.5
                }
            ];
            const goodMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoy learning about different cultures and sharing my own experiences.',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.9
                }
            ];
            const criticalResult = service.monitorRealTimeEngagement(criticalMessages, 60000);
            const mediumResult = service.monitorRealTimeEngagement(mediumMessages, 60000);
            const goodResult = service.monitorRealTimeEngagement(goodMessages, 60000);
            expect(criticalResult.alertLevel).toBe('high');
            expect(mediumResult.alertLevel).not.toBe('none');
            expect(goodResult.alertLevel).toBe('none');
        });
        it('should handle rapid engagement changes', () => {
            const rapidChangeMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'This is really difficult and I don\'t understand',
                    timestamp: new Date(Date.now() - 45000),
                    confidence: 0.2
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Oh wait, now I get it! This is actually quite interesting.',
                    timestamp: new Date(Date.now() - 15000),
                    confidence: 0.8
                }
            ];
            const result = service.monitorRealTimeEngagement(rapidChangeMessages, 60000);
            expect(result.trend).toBe('improving');
            expect(result.currentEngagement).toBeGreaterThan(50);
        });
    });
    describe('Edge Cases and Error Handling', () => {
        it('should handle conversations with only agent messages', () => {
            const agentOnlyMessages = [
                {
                    id: 'msg-1',
                    type: 'agent',
                    content: 'Hello, how are you today?',
                    timestamp: new Date()
                },
                {
                    id: 'msg-2',
                    type: 'agent',
                    content: 'What would you like to talk about?',
                    timestamp: new Date()
                }
            ];
            const analysis = service.analyzeEngagement(agentOnlyMessages, mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeDefined();
            expect(analysis.riskLevel).toBeDefined();
        });
        it('should handle messages with extreme timestamps', () => {
            const extremeMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Hello',
                    timestamp: new Date(0), // Very old timestamp
                    confidence: 0.8
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'How are you?',
                    timestamp: new Date(Date.now() + 86400000), // Future timestamp
                    confidence: 0.7
                }
            ];
            const analysis = service.analyzeEngagement(extremeMessages, mockUserProfile, 300);
            expect(analysis).toBeDefined();
            expect(analysis.overallEngagement).toBeGreaterThanOrEqual(0);
            expect(analysis.overallEngagement).toBeLessThanOrEqual(100);
        });
        it('should handle very long conversation sessions', () => {
            const longSessionMessages = Array.from({ length: 100 }, (_, i) => ({
                id: `msg-${i}`,
                type: i % 2 === 0 ? 'user' : 'agent',
                content: `Message ${i}`,
                timestamp: new Date(Date.now() - (100 - i) * 1000),
                confidence: 0.7 + (Math.random() * 0.3)
            }));
            const analysis = service.analyzeEngagement(longSessionMessages, mockUserProfile, 3600); // 1 hour session
            expect(analysis).toBeDefined();
            expect(analysis.overallEngagement).toBeGreaterThanOrEqual(0);
            expect(analysis.overallEngagement).toBeLessThanOrEqual(100);
        });
        it('should provide meaningful defaults for missing data', () => {
            const incompleteMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Hello',
                    timestamp: new Date()
                    // Missing confidence
                }
            ];
            const analysis = service.analyzeEngagement(incompleteMessages, mockUserProfile, 300);
            expect(analysis.overallEngagement).toBeDefined();
            expect(analysis.recommendedActions).toBeDefined();
            expect(Array.isArray(analysis.recommendedActions)).toBe(true);
        });
    });
    describe('Performance and Scalability Tests', () => {
        it('should handle analysis of large message volumes efficiently', () => {
            const startTime = Date.now();
            const largeMessageSet = Array.from({ length: 1000 }, (_, i) => ({
                id: `msg-${i}`,
                type: i % 2 === 0 ? 'user' : 'agent',
                content: `This is message number ${i} with some content to analyze`,
                timestamp: new Date(Date.now() - (1000 - i) * 1000),
                confidence: Math.random()
            }));
            const analysis = service.analyzeEngagement(largeMessageSet, mockUserProfile, 3600);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(analysis).toBeDefined();
            expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
        });
        it('should maintain accuracy with varying message patterns', () => {
            const patterns = [
                // Pattern 1: Consistent engagement
                Array.from({ length: 10 }, (_, i) => ({
                    id: `consistent-${i}`,
                    type: 'user',
                    content: 'I really enjoy this conversation and find it very engaging.',
                    timestamp: new Date(Date.now() - (10 - i) * 5000),
                    confidence: 0.8 + Math.random() * 0.1
                })),
                // Pattern 2: Declining engagement
                Array.from({ length: 10 }, (_, i) => ({
                    id: `declining-${i}`,
                    type: 'user',
                    content: i < 5 ? 'This is interesting and I want to learn more.' : 'Ok',
                    timestamp: new Date(Date.now() - (10 - i) * 5000),
                    confidence: 0.9 - (i * 0.08)
                })),
                // Pattern 3: Improving engagement
                Array.from({ length: 10 }, (_, i) => ({
                    id: `improving-${i}`,
                    type: 'user',
                    content: i < 5 ? 'Yes' : 'This is becoming more interesting and I understand better now.',
                    timestamp: new Date(Date.now() - (10 - i) * 5000),
                    confidence: 0.3 + (i * 0.07)
                }))
            ];
            const results = patterns.map(pattern => service.analyzeEngagement(pattern, mockUserProfile, 300));
            // Consistent should have stable engagement
            expect(results[0].overallEngagement).toBeGreaterThan(60);
            // Declining should have lower engagement and interventions
            expect(results[1].overallEngagement).toBeLessThan(results[0].overallEngagement);
            expect(results[1].recommendedActions.length).toBeGreaterThan(0);
            // Improving should show positive trend
            expect(results[2].overallEngagement).toBeGreaterThan(results[1].overallEngagement);
        });
    });
});
