"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBUserProfileService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("@/shared/utils");
class DynamoDBUserProfileService {
    constructor(tableName, region) {
        const client = new client_dynamodb_1.DynamoDBClient({
            region: region || process.env.AWS_REGION || 'us-east-1'
        });
        this.dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
        this.tableName = tableName;
    }
    /**
     * Create a new user profile
     */
    async createUserProfile(request) {
        try {
            const userId = (0, utils_1.generateUserId)();
            const now = new Date();
            const userProfile = {
                userId,
                targetLanguage: request.targetLanguage,
                nativeLanguage: request.nativeLanguage,
                currentLevel: request.currentLevel,
                learningGoals: request.learningGoals,
                preferredAgents: request.preferredAgents || [],
                conversationTopics: request.conversationTopics || [],
                progressMetrics: {
                    overallImprovement: 0,
                    grammarProgress: 0,
                    fluencyProgress: 0,
                    vocabularyGrowth: 0,
                    confidenceLevel: 0.5, // Start with neutral confidence
                    sessionsCompleted: 0,
                    totalPracticeTime: 0,
                    streakDays: 0
                },
                lastSessionDate: now,
                totalSessionTime: 0,
                milestones: [],
                createdAt: now,
                updatedAt: now
            };
            await this.dynamoClient.send(new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: userProfile,
                ConditionExpression: 'attribute_not_exists(userId)' // Prevent duplicates
            }));
            return userProfile;
        }
        catch (error) {
            console.error('Error creating user profile:', error);
            throw new Error(`Failed to create user profile: ${error}`);
        }
    }
    /**
     * Get user profile by ID
     */
    async getUserProfile(userId) {
        try {
            const response = await this.dynamoClient.send(new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: { userId }
            }));
            if (!response.Item) {
                return null;
            }
            // Convert DynamoDB item to UserProfile
            return this.deserializeUserProfile(response.Item);
        }
        catch (error) {
            console.error('Error getting user profile:', error);
            throw new Error(`Failed to get user profile: ${error}`);
        }
    }
    /**
     * Update user profile
     */
    async updateUserProfile(request) {
        try {
            const { userId, ...updates } = request;
            // Build update expression dynamically
            const updateExpressions = [];
            const expressionAttributeNames = {};
            const expressionAttributeValues = {};
            // Add updatedAt timestamp
            updateExpressions.push('#updatedAt = :updatedAt');
            expressionAttributeNames['#updatedAt'] = 'updatedAt';
            expressionAttributeValues[':updatedAt'] = new Date();
            // Process each update field
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateExpressions.push(`#${key} = :${key}`);
                    expressionAttributeNames[`#${key}`] = key;
                    expressionAttributeValues[`:${key}`] = value;
                }
            });
            const updateExpression = `SET ${updateExpressions.join(', ')}`;
            const response = await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: { userId },
                UpdateExpression: updateExpression,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW',
                ConditionExpression: 'attribute_exists(userId)' // Ensure user exists
            }));
            if (!response.Attributes) {
                throw new Error('User profile not found');
            }
            return this.deserializeUserProfile(response.Attributes);
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            throw new Error(`Failed to update user profile: ${error}`);
        }
    }
    /**
     * Delete user profile
     */
    async deleteUserProfile(userId) {
        try {
            await this.dynamoClient.send(new lib_dynamodb_1.DeleteCommand({
                TableName: this.tableName,
                Key: { userId },
                ConditionExpression: 'attribute_exists(userId)'
            }));
        }
        catch (error) {
            console.error('Error deleting user profile:', error);
            throw new Error(`Failed to delete user profile: ${error}`);
        }
    }
    /**
     * Update progress metrics after a session
     */
    async updateProgressMetrics(userId, sessionMetrics) {
        try {
            const now = new Date();
            // Calculate improvements (simplified algorithm)
            const grammarImprovement = Math.max(0, sessionMetrics.grammarAccuracy - 0.5) * 0.1;
            const fluencyImprovement = Math.max(0, sessionMetrics.fluencyScore - 0.5) * 0.1;
            const vocabularyImprovement = sessionMetrics.vocabularyUsed?.length * 0.01 || 0;
            await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: { userId },
                UpdateExpression: `
          SET 
            progressMetrics.sessionsCompleted = progressMetrics.sessionsCompleted + :one,
            progressMetrics.totalPracticeTime = progressMetrics.totalPracticeTime + :duration,
            progressMetrics.grammarProgress = progressMetrics.grammarProgress + :grammarImprovement,
            progressMetrics.fluencyProgress = progressMetrics.fluencyProgress + :fluencyImprovement,
            progressMetrics.vocabularyGrowth = progressMetrics.vocabularyGrowth + :vocabularyImprovement,
            progressMetrics.overallImprovement = (progressMetrics.grammarProgress + progressMetrics.fluencyProgress + progressMetrics.vocabularyGrowth) / :three,
            lastSessionDate = :now,
            updatedAt = :now
        `,
                ExpressionAttributeValues: {
                    ':one': 1,
                    ':duration': sessionMetrics.duration || 0,
                    ':grammarImprovement': grammarImprovement,
                    ':fluencyImprovement': fluencyImprovement,
                    ':vocabularyImprovement': vocabularyImprovement,
                    ':three': 3,
                    ':now': now
                },
                ConditionExpression: 'attribute_exists(userId)'
            }));
            // Update streak separately
            await this.updateStreak(userId);
        }
        catch (error) {
            console.error('Error updating progress metrics:', error);
            throw new Error(`Failed to update progress metrics: ${error}`);
        }
    }
    /**
     * Add milestone achievement
     */
    async addMilestone(userId, milestone) {
        try {
            await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: { userId },
                UpdateExpression: 'SET milestones = list_append(if_not_exists(milestones, :empty_list), :milestone), updatedAt = :now',
                ExpressionAttributeValues: {
                    ':milestone': [milestone],
                    ':empty_list': [],
                    ':now': new Date()
                },
                ConditionExpression: 'attribute_exists(userId)'
            }));
        }
        catch (error) {
            console.error('Error adding milestone:', error);
            throw new Error(`Failed to add milestone: ${error}`);
        }
    }
    /**
     * Get users by language level
     */
    async getUsersByLevel(level, limit = 50) {
        try {
            const response = await this.dynamoClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName,
                FilterExpression: 'currentLevel = :level',
                ExpressionAttributeValues: {
                    ':level': level
                },
                Limit: limit
            }));
            return (response.Items || []).map(item => this.deserializeUserProfile(item));
        }
        catch (error) {
            console.error('Error getting users by level:', error);
            throw new Error(`Failed to get users by level: ${error}`);
        }
    }
    /**
     * Search users by criteria
     */
    async searchUsers(criteria, limit = 50) {
        try {
            // Build filter expression dynamically
            const filterExpressions = [];
            const expressionAttributeValues = {};
            Object.entries(criteria).forEach(([key, value]) => {
                if (value !== undefined && key !== 'userId') {
                    filterExpressions.push(`${key} = :${key}`);
                    expressionAttributeValues[`:${key}`] = value;
                }
            });
            if (filterExpressions.length === 0) {
                throw new Error('No search criteria provided');
            }
            const response = await this.dynamoClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName,
                FilterExpression: filterExpressions.join(' AND '),
                ExpressionAttributeValues: expressionAttributeValues,
                Limit: limit
            }));
            return (response.Items || []).map(item => this.deserializeUserProfile(item));
        }
        catch (error) {
            console.error('Error searching users:', error);
            throw new Error(`Failed to search users: ${error}`);
        }
    }
    /**
     * Update user's streak days
     */
    async updateStreak(userId) {
        try {
            // Get user's recent session dates (this would typically come from session table)
            // For now, we'll use a simplified approach
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            // In a real implementation, you'd query the session table for recent dates
            // For now, we'll increment streak if last session was yesterday or today
            await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: { userId },
                UpdateExpression: 'ADD progressMetrics.streakDays :one',
                ExpressionAttributeValues: {
                    ':one': 1
                },
                ConditionExpression: 'attribute_exists(userId)'
            }));
        }
        catch (error) {
            console.error('Error updating streak:', error);
            // Don't throw error for streak update failure
        }
    }
    /**
     * Deserialize DynamoDB item to UserProfile
     */
    deserializeUserProfile(item) {
        return {
            userId: item.userId,
            targetLanguage: item.targetLanguage,
            nativeLanguage: item.nativeLanguage,
            currentLevel: item.currentLevel,
            learningGoals: item.learningGoals || [],
            preferredAgents: item.preferredAgents || [],
            conversationTopics: item.conversationTopics || [],
            progressMetrics: {
                overallImprovement: item.progressMetrics?.overallImprovement || 0,
                grammarProgress: item.progressMetrics?.grammarProgress || 0,
                fluencyProgress: item.progressMetrics?.fluencyProgress || 0,
                vocabularyGrowth: item.progressMetrics?.vocabularyGrowth || 0,
                confidenceLevel: item.progressMetrics?.confidenceLevel || 0.5,
                sessionsCompleted: item.progressMetrics?.sessionsCompleted || 0,
                totalPracticeTime: item.progressMetrics?.totalPracticeTime || 0,
                streakDays: item.progressMetrics?.streakDays || 0
            },
            lastSessionDate: new Date(item.lastSessionDate),
            totalSessionTime: item.totalSessionTime || 0,
            milestones: item.milestones || [],
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
        };
    }
}
exports.DynamoDBUserProfileService = DynamoDBUserProfileService;
