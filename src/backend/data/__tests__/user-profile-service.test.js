"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_profile_service_1 = require("../user-profile-service");
// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
describe('DynamoDBUserProfileService', () => {
    let userProfileService;
    let mockDynamoClient;
    let mockUserProfile;
    beforeEach(() => {
        // Setup mocks
        mockDynamoClient = {
            send: jest.fn()
        };
        // Create service instance
        userProfileService = new user_profile_service_1.DynamoDBUserProfileService('test-users-table', 'us-east-1');
        userProfileService.dynamoClient = mockDynamoClient;
        // Mock user profile
        mockUserProfile = {
            userId: 'user-123',
            targetLanguage: 'en-US',
            nativeLanguage: 'es-ES',
            currentLevel: 'intermediate',
            learningGoals: ['conversation-fluency', 'grammar-accuracy'],
            preferredAgents: ['friendly-tutor'],
            conversationTopics: ['Travel and Culture', 'Food and Cooking'],
            progressMetrics: {
                overallImprovement: 0.7,
                grammarProgress: 0.6,
                fluencyProgress: 0.8,
                vocabularyGrowth: 0.5,
                confidenceLevel: 0.7,
                sessionsCompleted: 5,
                totalPracticeTime: 3600,
                streakDays: 3
            },
            lastSessionDate: new Date('2024-01-15'),
            totalSessionTime: 3600,
            milestones: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15')
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createUserProfile', () => {
        test('creates a new user profile successfully', async () => {
            const request = {
                targetLanguage: 'en-US',
                nativeLanguage: 'es-ES',
                currentLevel: 'intermediate',
                learningGoals: ['conversation-fluency'],
                conversationTopics: ['Travel and Culture'],
                preferredAgents: ['friendly-tutor']
            };
            mockDynamoClient.send.mockResolvedValue({});
            const result = await userProfileService.createUserProfile(request);
            expect(result.userId).toBeDefined();
            expect(result.targetLanguage).toBe('en-US');
            expect(result.nativeLanguage).toBe('es-ES');
            expect(result.currentLevel).toBe('intermediate');
            expect(result.learningGoals).toEqual(['conversation-fluency']);
            expect(result.progressMetrics.sessionsCompleted).toBe(0);
            expect(result.progressMetrics.confidenceLevel).toBe(0.5);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    ConditionExpression: 'attribute_not_exists(userId)'
                })
            }));
        });
        test('handles DynamoDB errors during creation', async () => {
            const request = {
                targetLanguage: 'en-US',
                nativeLanguage: 'es-ES',
                currentLevel: 'beginner',
                learningGoals: ['conversation-fluency']
            };
            mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));
            await expect(userProfileService.createUserProfile(request)).rejects.toThrow('Failed to create user profile');
        });
        test('creates profile with default values when optional fields are missing', async () => {
            const request = {
                targetLanguage: 'fr-FR',
                nativeLanguage: 'en-US',
                currentLevel: 'beginner',
                learningGoals: ['pronunciation-improvement']
            };
            mockDynamoClient.send.mockResolvedValue({});
            const result = await userProfileService.createUserProfile(request);
            expect(result.preferredAgents).toEqual([]);
            expect(result.conversationTopics).toEqual([]);
            expect(result.milestones).toEqual([]);
            expect(result.progressMetrics.overallImprovement).toBe(0);
        });
    });
    describe('getUserProfile', () => {
        test('retrieves user profile successfully', async () => {
            mockDynamoClient.send.mockResolvedValue({
                Item: mockUserProfile
            });
            const result = await userProfileService.getUserProfile('user-123');
            expect(result).toEqual(mockUserProfile);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    Key: { userId: 'user-123' }
                })
            }));
        });
        test('returns null when user profile not found', async () => {
            mockDynamoClient.send.mockResolvedValue({
                Item: undefined
            });
            const result = await userProfileService.getUserProfile('nonexistent-user');
            expect(result).toBeNull();
        });
        test('handles DynamoDB errors during retrieval', async () => {
            mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));
            await expect(userProfileService.getUserProfile('user-123')).rejects.toThrow('Failed to get user profile');
        });
        test('correctly deserializes dates from DynamoDB', async () => {
            const dbItem = {
                ...mockUserProfile,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-15T00:00:00.000Z',
                lastSessionDate: '2024-01-15T00:00:00.000Z'
            };
            mockDynamoClient.send.mockResolvedValue({
                Item: dbItem
            });
            const result = await userProfileService.getUserProfile('user-123');
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.lastSessionDate).toBeInstanceOf(Date);
        });
    });
    describe('updateUserProfile', () => {
        test('updates user profile successfully', async () => {
            const request = {
                userId: 'user-123',
                currentLevel: 'advanced',
                learningGoals: ['vocabulary-expansion', 'confidence-building']
            };
            const updatedProfile = {
                ...mockUserProfile,
                currentLevel: 'advanced',
                learningGoals: ['vocabulary-expansion', 'confidence-building'],
                updatedAt: new Date()
            };
            mockDynamoClient.send.mockResolvedValue({
                Attributes: updatedProfile
            });
            const result = await userProfileService.updateUserProfile(request);
            expect(result.currentLevel).toBe('advanced');
            expect(result.learningGoals).toEqual(['vocabulary-expansion', 'confidence-building']);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    Key: { userId: 'user-123' },
                    ConditionExpression: 'attribute_exists(userId)'
                })
            }));
        });
        test('handles partial updates correctly', async () => {
            const request = {
                userId: 'user-123',
                conversationTopics: ['Business', 'Technology']
            };
            const updatedProfile = {
                ...mockUserProfile,
                conversationTopics: ['Business', 'Technology']
            };
            mockDynamoClient.send.mockResolvedValue({
                Attributes: updatedProfile
            });
            const result = await userProfileService.updateUserProfile(request);
            expect(result.conversationTopics).toEqual(['Business', 'Technology']);
            expect(result.currentLevel).toBe(mockUserProfile.currentLevel); // Unchanged
        });
        test('handles user not found error', async () => {
            const request = {
                userId: 'nonexistent-user',
                currentLevel: 'advanced'
            };
            mockDynamoClient.send.mockRejectedValue(new Error('ConditionalCheckFailedException'));
            await expect(userProfileService.updateUserProfile(request)).rejects.toThrow('Failed to update user profile');
        });
        test('ignores undefined values in update request', async () => {
            const request = {
                userId: 'user-123',
                currentLevel: 'advanced',
                targetLanguage: undefined,
                learningGoals: ['vocabulary-expansion']
            };
            mockDynamoClient.send.mockResolvedValue({
                Attributes: mockUserProfile
            });
            await userProfileService.updateUserProfile(request);
            const updateCall = mockDynamoClient.send.mock.calls[0][0];
            const updateExpression = updateCall.input.UpdateExpression;
            expect(updateExpression).toContain('currentLevel');
            expect(updateExpression).toContain('learningGoals');
            expect(updateExpression).not.toContain('targetLanguage');
        });
    });
    describe('deleteUserProfile', () => {
        test('deletes user profile successfully', async () => {
            mockDynamoClient.send.mockResolvedValue({});
            await userProfileService.deleteUserProfile('user-123');
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    Key: { userId: 'user-123' },
                    ConditionExpression: 'attribute_exists(userId)'
                })
            }));
        });
        test('handles user not found during deletion', async () => {
            mockDynamoClient.send.mockRejectedValue(new Error('ConditionalCheckFailedException'));
            await expect(userProfileService.deleteUserProfile('nonexistent-user')).rejects.toThrow('Failed to delete user profile');
        });
    });
    describe('updateProgressMetrics', () => {
        test('updates progress metrics after session', async () => {
            const sessionMetrics = {
                duration: 1800, // 30 minutes
                grammarAccuracy: 0.8,
                fluencyScore: 0.75,
                vocabularyUsed: ['excellent', 'magnificent', 'wonderful']
            };
            mockDynamoClient.send.mockResolvedValue({});
            await userProfileService.updateProgressMetrics('user-123', sessionMetrics);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    Key: { userId: 'user-123' },
                    UpdateExpression: expect.stringContaining('progressMetrics.sessionsCompleted'),
                    ExpressionAttributeValues: expect.objectContaining({
                        ':one': 1,
                        ':duration': 1800
                    })
                })
            }));
        });
        test('calculates improvement scores correctly', async () => {
            const sessionMetrics = {
                grammarAccuracy: 0.9, // High accuracy
                fluencyScore: 0.6, // Moderate fluency
                vocabularyUsed: ['good', 'nice'] // 2 words
            };
            mockDynamoClient.send.mockResolvedValue({});
            await userProfileService.updateProgressMetrics('user-123', sessionMetrics);
            const updateCall = mockDynamoClient.send.mock.calls[0][0];
            const values = updateCall.input.ExpressionAttributeValues;
            expect(values[':grammarImprovement']).toBeGreaterThan(0);
            expect(values[':fluencyImprovement']).toBeGreaterThan(0);
            expect(values[':vocabularyImprovement']).toBe(0.02); // 2 words * 0.01
        });
        test('handles missing session metrics gracefully', async () => {
            const sessionMetrics = {
                duration: 1200
                // Missing other metrics
            };
            mockDynamoClient.send.mockResolvedValue({});
            await userProfileService.updateProgressMetrics('user-123', sessionMetrics);
            const updateCall = mockDynamoClient.send.mock.calls[0][0];
            const values = updateCall.input.ExpressionAttributeValues;
            expect(values[':duration']).toBe(1200);
            expect(values[':vocabularyImprovement']).toBe(0);
        });
    });
    describe('addMilestone', () => {
        test('adds milestone successfully', async () => {
            const milestone = {
                id: 'milestone-1',
                title: 'First Conversation',
                description: 'Completed your first conversation session',
                achievedAt: new Date(),
                category: 'confidence'
            };
            mockDynamoClient.send.mockResolvedValue({});
            await userProfileService.addMilestone('user-123', milestone);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    Key: { userId: 'user-123' },
                    UpdateExpression: 'SET milestones = list_append(if_not_exists(milestones, :empty_list), :milestone), updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':milestone': [milestone],
                        ':empty_list': [],
                        ':now': expect.any(Date)
                    }
                })
            }));
        });
        test('handles milestone addition errors', async () => {
            const milestone = {
                id: 'milestone-1',
                title: 'Test Milestone',
                description: 'Test description',
                achievedAt: new Date(),
                category: 'grammar'
            };
            mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));
            await expect(userProfileService.addMilestone('user-123', milestone)).rejects.toThrow('Failed to add milestone');
        });
    });
    describe('getUsersByLevel', () => {
        test('retrieves users by language level', async () => {
            const mockUsers = [
                { ...mockUserProfile, userId: 'user-1' },
                { ...mockUserProfile, userId: 'user-2' }
            ];
            mockDynamoClient.send.mockResolvedValue({
                Items: mockUsers
            });
            const result = await userProfileService.getUsersByLevel('intermediate', 10);
            expect(result).toHaveLength(2);
            expect(result[0].userId).toBe('user-1');
            expect(result[1].userId).toBe('user-2');
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    FilterExpression: 'currentLevel = :level',
                    ExpressionAttributeValues: {
                        ':level': 'intermediate'
                    },
                    Limit: 10
                })
            }));
        });
        test('returns empty array when no users found', async () => {
            mockDynamoClient.send.mockResolvedValue({
                Items: []
            });
            const result = await userProfileService.getUsersByLevel('proficient');
            expect(result).toEqual([]);
        });
        test('uses default limit when not specified', async () => {
            mockDynamoClient.send.mockResolvedValue({
                Items: []
            });
            await userProfileService.getUsersByLevel('beginner');
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    Limit: 50
                })
            }));
        });
    });
    describe('searchUsers', () => {
        test('searches users by criteria', async () => {
            const criteria = {
                targetLanguage: 'en-US',
                nativeLanguage: 'es-ES'
            };
            const mockUsers = [mockUserProfile];
            mockDynamoClient.send.mockResolvedValue({
                Items: mockUsers
            });
            const result = await userProfileService.searchUsers(criteria, 20);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockUserProfile);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    TableName: 'test-users-table',
                    FilterExpression: 'targetLanguage = :targetLanguage AND nativeLanguage = :nativeLanguage',
                    ExpressionAttributeValues: {
                        ':targetLanguage': 'en-US',
                        ':nativeLanguage': 'es-ES'
                    },
                    Limit: 20
                })
            }));
        });
        test('handles single criterion search', async () => {
            const criteria = {
                currentLevel: 'advanced'
            };
            mockDynamoClient.send.mockResolvedValue({
                Items: []
            });
            await userProfileService.searchUsers(criteria);
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    FilterExpression: 'currentLevel = :currentLevel',
                    ExpressionAttributeValues: {
                        ':currentLevel': 'advanced'
                    }
                })
            }));
        });
        test('throws error when no search criteria provided', async () => {
            await expect(userProfileService.searchUsers({})).rejects.toThrow('No search criteria provided');
        });
        test('ignores userId in search criteria', async () => {
            const criteria = {
                userId: 'should-be-ignored',
                targetLanguage: 'fr-FR'
            };
            mockDynamoClient.send.mockResolvedValue({
                Items: []
            });
            await userProfileService.searchUsers(criteria);
            const scanCall = mockDynamoClient.send.mock.calls[0][0];
            const filterExpression = scanCall.input.FilterExpression;
            expect(filterExpression).not.toContain('userId');
            expect(filterExpression).toContain('targetLanguage');
        });
        test('ignores undefined values in criteria', async () => {
            const criteria = {
                targetLanguage: 'en-US',
                nativeLanguage: undefined,
                currentLevel: 'intermediate'
            };
            mockDynamoClient.send.mockResolvedValue({
                Items: []
            });
            await userProfileService.searchUsers(criteria);
            const scanCall = mockDynamoClient.send.mock.calls[0][0];
            const filterExpression = scanCall.input.FilterExpression;
            expect(filterExpression).toContain('targetLanguage');
            expect(filterExpression).toContain('currentLevel');
            expect(filterExpression).not.toContain('nativeLanguage');
        });
    });
    describe('error handling', () => {
        test('handles DynamoDB service errors gracefully', async () => {
            mockDynamoClient.send.mockRejectedValue(new Error('Service unavailable'));
            await expect(userProfileService.getUserProfile('user-123')).rejects.toThrow('Failed to get user profile');
        });
        test('handles network errors during operations', async () => {
            mockDynamoClient.send.mockRejectedValue(new Error('Network error'));
            const request = {
                targetLanguage: 'en-US',
                nativeLanguage: 'es-ES',
                currentLevel: 'beginner',
                learningGoals: ['conversation-fluency']
            };
            await expect(userProfileService.createUserProfile(request)).rejects.toThrow('Failed to create user profile');
        });
    });
    describe('data serialization', () => {
        test('correctly deserializes progress metrics', async () => {
            const dbItem = {
                ...mockUserProfile,
                progressMetrics: {
                    overallImprovement: 0.8,
                    grammarProgress: 0.7,
                    fluencyProgress: 0.9,
                    vocabularyGrowth: 0.6,
                    confidenceLevel: 0.8,
                    sessionsCompleted: 10,
                    totalPracticeTime: 7200,
                    streakDays: 5
                }
            };
            mockDynamoClient.send.mockResolvedValue({
                Item: dbItem
            });
            const result = await userProfileService.getUserProfile('user-123');
            expect(result.progressMetrics.overallImprovement).toBe(0.8);
            expect(result.progressMetrics.sessionsCompleted).toBe(10);
            expect(result.progressMetrics.streakDays).toBe(5);
        });
        test('handles missing progress metrics with defaults', async () => {
            const dbItem = {
                ...mockUserProfile,
                progressMetrics: undefined
            };
            mockDynamoClient.send.mockResolvedValue({
                Item: dbItem
            });
            const result = await userProfileService.getUserProfile('user-123');
            expect(result.progressMetrics.overallImprovement).toBe(0);
            expect(result.progressMetrics.confidenceLevel).toBe(0.5);
            expect(result.progressMetrics.sessionsCompleted).toBe(0);
        });
    });
});
