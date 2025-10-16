"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBSessionManagementService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("@/shared/utils");
class DynamoDBSessionManagementService {
    constructor(tableName, region) {
        const client = new client_dynamodb_1.DynamoDBClient({
            region: region || process.env.AWS_REGION || 'us-east-1'
        });
        this.dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
        this.tableName = tableName;
    }
    /**
     * Create a new conversation session
     */
    async createSession(request) {
        try {
            const sessionId = (0, utils_1.generateSessionId)();
            const now = new Date();
            const session = {
                sessionId,
                userId: request.userId,
                agentId: request.agentId,
                startTime: now,
                topic: request.topic,
                difficulty: request.difficulty,
                messages: [],
                performanceMetrics: {
                    duration: 0,
                    wordsSpoken: 0,
                    averageResponseTime: 0,
                    grammarAccuracy: 0,
                    fluencyScore: 0,
                    vocabularyUsed: [],
                    errorsCount: 0,
                    improvementsShown: 0
                },
                feedbackProvided: [],
                status: 'active'
            };
            await this.dynamoClient.send(new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: {
                    ...session,
                    timestamp: now.getTime() // For sorting
                },
                ConditionExpression: 'attribute_not_exists(sessionId)'
            }));
            return session;
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw new Error(`Failed to create session: ${error}`);
        }
    }
    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        try {
            const response = await this.dynamoClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'sessionId = :sessionId',
                ExpressionAttributeValues: {
                    ':sessionId': sessionId
                },
                Limit: 1,
                ScanIndexForward: false // Get most recent
            }));
            if (!response.Items || response.Items.length === 0) {
                return null;
            }
            return this.deserializeSession(response.Items[0]);
        }
        catch (error) {
            console.error('Error getting session:', error);
            throw new Error(`Failed to get session: ${error}`);
        }
    }
    /**
     * Update session
     */
    async updateSession(request) {
        try {
            const { sessionId, ...updates } = request;
            // Get current session to get timestamp
            const currentSession = await this.getSession(sessionId);
            if (!currentSession) {
                throw new Error('Session not found');
            }
            // Build update expression dynamically
            const updateExpressions = [];
            const expressionAttributeNames = {};
            const expressionAttributeValues = {};
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'performanceMetrics') {
                        // Handle nested performance metrics updates
                        Object.entries(value).forEach(([metricKey, metricValue]) => {
                            updateExpressions.push(`performanceMetrics.#${metricKey} = :${metricKey}`);
                            expressionAttributeNames[`#${metricKey}`] = metricKey;
                            expressionAttributeValues[`:${metricKey}`] = metricValue;
                        });
                    }
                    else {
                        updateExpressions.push(`#${key} = :${key}`);
                        expressionAttributeNames[`#${key}`] = key;
                        expressionAttributeValues[`:${key}`] = value;
                    }
                }
            });
            if (updateExpressions.length === 0) {
                return currentSession;
            }
            const updateExpression = `SET ${updateExpressions.join(', ')}`;
            const response = await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    sessionId,
                    timestamp: currentSession.startTime.getTime()
                },
                UpdateExpression: updateExpression,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW'
            }));
            if (!response.Attributes) {
                throw new Error('Failed to update session');
            }
            return this.deserializeSession(response.Attributes);
        }
        catch (error) {
            console.error('Error updating session:', error);
            throw new Error(`Failed to update session: ${error}`);
        }
    }
    /**
     * End session with final metrics
     */
    async endSession(sessionId, finalMetrics) {
        try {
            const endTime = new Date();
            return await this.updateSession({
                sessionId,
                status: 'completed',
                endTime,
                performanceMetrics: finalMetrics
            });
        }
        catch (error) {
            console.error('Error ending session:', error);
            throw new Error(`Failed to end session: ${error}`);
        }
    }
    /**
     * Add message to session
     */
    async addMessage(request) {
        try {
            const messageId = (0, utils_1.generateMessageId)();
            const now = new Date();
            const message = {
                messageId,
                sessionId: request.sessionId,
                sender: request.sender,
                content: request.content,
                audioUrl: request.audioUrl,
                timestamp: now,
                transcriptionConfidence: request.transcriptionConfidence
            };
            // Get current session to get timestamp
            const currentSession = await this.getSession(request.sessionId);
            if (!currentSession) {
                throw new Error('Session not found');
            }
            // Add message to session
            await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    sessionId: request.sessionId,
                    timestamp: currentSession.startTime.getTime()
                },
                UpdateExpression: 'SET messages = list_append(if_not_exists(messages, :empty_list), :message)',
                ExpressionAttributeValues: {
                    ':message': [message],
                    ':empty_list': []
                }
            }));
            return message;
        }
        catch (error) {
            console.error('Error adding message:', error);
            throw new Error(`Failed to add message: ${error}`);
        }
    }
    /**
     * Add feedback to session
     */
    async addFeedback(sessionId, feedback) {
        try {
            // Get current session to get timestamp
            const currentSession = await this.getSession(sessionId);
            if (!currentSession) {
                throw new Error('Session not found');
            }
            await this.dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    sessionId,
                    timestamp: currentSession.startTime.getTime()
                },
                UpdateExpression: 'SET feedbackProvided = list_append(if_not_exists(feedbackProvided, :empty_list), :feedback)',
                ExpressionAttributeValues: {
                    ':feedback': [feedback],
                    ':empty_list': []
                }
            }));
        }
        catch (error) {
            console.error('Error adding feedback:', error);
            throw new Error(`Failed to add feedback: ${error}`);
        }
    }
    /**
     * Get user's sessions
     */
    async getUserSessions(userId, limit = 20) {
        try {
            const response = await this.dynamoClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'UserSessionIndex',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                },
                ScanIndexForward: false, // Most recent first
                Limit: limit
            }));
            return (response.Items || []).map(item => this.deserializeSession(item));
        }
        catch (error) {
            console.error('Error getting user sessions:', error);
            throw new Error(`Failed to get user sessions: ${error}`);
        }
    }
    /**
     * Get user's active sessions
     */
    async getActiveUserSessions(userId) {
        try {
            const response = await this.dynamoClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'UserSessionIndex',
                KeyConditionExpression: 'userId = :userId',
                FilterExpression: '#status = :status',
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':userId': userId,
                    ':status': 'active'
                }
            }));
            return (response.Items || []).map(item => this.deserializeSession(item));
        }
        catch (error) {
            console.error('Error getting active user sessions:', error);
            throw new Error(`Failed to get active user sessions: ${error}`);
        }
    }
    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        try {
            // Get current session to get timestamp
            const currentSession = await this.getSession(sessionId);
            if (!currentSession) {
                throw new Error('Session not found');
            }
            await this.dynamoClient.send(new lib_dynamodb_1.DeleteCommand({
                TableName: this.tableName,
                Key: {
                    sessionId,
                    timestamp: currentSession.startTime.getTime()
                }
            }));
        }
        catch (error) {
            console.error('Error deleting session:', error);
            throw new Error(`Failed to delete session: ${error}`);
        }
    }
    /**
     * Get session metrics
     */
    async getSessionMetrics(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            return session?.performanceMetrics || null;
        }
        catch (error) {
            console.error('Error getting session metrics:', error);
            throw new Error(`Failed to get session metrics: ${error}`);
        }
    }
    /**
     * Deserialize DynamoDB item to ConversationSession
     */
    deserializeSession(item) {
        return {
            sessionId: item.sessionId,
            userId: item.userId,
            agentId: item.agentId,
            startTime: new Date(item.startTime),
            endTime: item.endTime ? new Date(item.endTime) : undefined,
            topic: item.topic,
            difficulty: item.difficulty,
            messages: item.messages || [],
            performanceMetrics: {
                duration: item.performanceMetrics?.duration || 0,
                wordsSpoken: item.performanceMetrics?.wordsSpoken || 0,
                averageResponseTime: item.performanceMetrics?.averageResponseTime || 0,
                grammarAccuracy: item.performanceMetrics?.grammarAccuracy || 0,
                fluencyScore: item.performanceMetrics?.fluencyScore || 0,
                vocabularyUsed: item.performanceMetrics?.vocabularyUsed || [],
                errorsCount: item.performanceMetrics?.errorsCount || 0,
                improvementsShown: item.performanceMetrics?.improvementsShown || 0
            },
            feedbackProvided: item.feedbackProvided || [],
            status: item.status || 'active'
        };
    }
}
exports.DynamoDBSessionManagementService = DynamoDBSessionManagementService;
