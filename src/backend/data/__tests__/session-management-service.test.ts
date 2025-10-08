import { DynamoDBSessionManagementService, CreateSessionRequest, UpdateSessionRequest, AddMessageRequest } from '../session-management-service';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ConversationSession, ConversationMessage, SessionMetrics, FeedbackInstance } from '@/shared/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('DynamoDBSessionManagementService', () => {
  let sessionService: DynamoDBSessionManagementService;
  let mockDynamoClient: jest.Mocked<DynamoDBDocumentClient>;
  let mockSession: ConversationSession;

  beforeEach(() => {
    // Setup mocks
    mockDynamoClient = {
      send: jest.fn()
    } as any;

    // Create service instance
    sessionService = new DynamoDBSessionManagementService('test-sessions-table', 'us-east-1');
    (sessionService as any).dynamoClient = mockDynamoClient;

    // Mock session
    mockSession = {
      sessionId: 'session-123',
      userId: 'user-456',
      agentId: 'friendly-tutor',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: undefined,
      topic: 'Travel and Culture',
      difficulty: 'medium',
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    test('creates a new session successfully', async () => {
      const request: CreateSessionRequest = {
        userId: 'user-456',
        agentId: 'friendly-tutor',
        topic: 'Travel and Culture',
        difficulty: 'medium'
      };

      mockDynamoClient.send.mockResolvedValue({});

      const result = await sessionService.createSession(request);

      expect(result.sessionId).toBeDefined();
      expect(result.userId).toBe('user-456');
      expect(result.agentId).toBe('friendly-tutor');
      expect(result.topic).toBe('Travel and Culture');
      expect(result.difficulty).toBe('medium');
      expect(result.status).toBe('active');
      expect(result.messages).toEqual([]);
      expect(result.performanceMetrics.duration).toBe(0);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-sessions-table',
            ConditionExpression: 'attribute_not_exists(sessionId)'
          })
        })
      );
    });

    test('handles DynamoDB errors during creation', async () => {
      const request: CreateSessionRequest = {
        userId: 'user-456',
        agentId: 'strict-teacher',
        topic: 'Business English',
        difficulty: 'hard'
      };

      mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(sessionService.createSession(request)).rejects.toThrow('Failed to create session');
    });

    test('initializes session with correct default values', async () => {
      const request: CreateSessionRequest = {
        userId: 'user-789',
        agentId: 'pronunciation-coach',
        topic: 'Pronunciation Practice',
        difficulty: 'adaptive'
      };

      mockDynamoClient.send.mockResolvedValue({});

      const result = await sessionService.createSession(request);

      expect(result.status).toBe('active');
      expect(result.endTime).toBeUndefined();
      expect(result.messages).toEqual([]);
      expect(result.feedbackProvided).toEqual([]);
      expect(result.performanceMetrics.wordsSpoken).toBe(0);
      expect(result.performanceMetrics.errorsCount).toBe(0);
    });
  });

  describe('getSession', () => {
    test('retrieves session successfully', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: [mockSession]
      });

      const result = await sessionService.getSession('session-123');

      expect(result).toEqual(mockSession);
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-sessions-table',
            KeyConditionExpression: 'sessionId = :sessionId',
            ExpressionAttributeValues: {
              ':sessionId': 'session-123'
            },
            Limit: 1,
            ScanIndexForward: false
          })
        })
      );
    });

    test('returns null when session not found', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: []
      });

      const result = await sessionService.getSession('nonexistent-session');

      expect(result).toBeNull();
    });

    test('handles DynamoDB errors during retrieval', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(sessionService.getSession('session-123')).rejects.toThrow('Failed to get session');
    });

    test('returns most recent session when multiple exist', async () => {
      const olderSession = { ...mockSession, startTime: new Date('2024-01-14T10:00:00Z') };
      const newerSession = { ...mockSession, startTime: new Date('2024-01-15T10:00:00Z') };

      mockDynamoClient.send.mockResolvedValue({
        Items: [newerSession, olderSession] // DynamoDB returns in descending order
      });

      const result = await sessionService.getSession('session-123');

      expect(result!.startTime).toEqual(newerSession.startTime);
    });
  });

  describe('updateSession', () => {
    test('updates session status successfully', async () => {
      const request: UpdateSessionRequest = {
        sessionId: 'session-123',
        status: 'completed',
        endTime: new Date('2024-01-15T11:00:00Z')
      };

      // Mock getSession call
      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] }) // getSession
        .mockResolvedValueOnce({ Attributes: { ...mockSession, status: 'completed' } }); // UpdateCommand

      const result = await sessionService.updateSession(request);

      expect(result.status).toBe('completed');
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-sessions-table',
            UpdateExpression: 'SET #status = :status, #endTime = :endTime'
          })
        })
      );
    });

    test('updates performance metrics successfully', async () => {
      const request: UpdateSessionRequest = {
        sessionId: 'session-123',
        performanceMetrics: {
          duration: 1800,
          wordsSpoken: 150,
          grammarAccuracy: 0.85
        }
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockResolvedValueOnce({ Attributes: mockSession });

      await sessionService.updateSession(request);

      const updateCall = mockDynamoClient.send.mock.calls[1][0];
      const updateExpression = updateCall.input.UpdateExpression;

      expect(updateExpression).toContain('performanceMetrics.#duration');
      expect(updateExpression).toContain('performanceMetrics.#wordsSpoken');
      expect(updateExpression).toContain('performanceMetrics.#grammarAccuracy');
    });

    test('handles session not found error', async () => {
      const request: UpdateSessionRequest = {
        sessionId: 'nonexistent-session',
        status: 'completed'
      };

      mockDynamoClient.send.mockResolvedValueOnce({ Items: [] }); // getSession returns null

      await expect(sessionService.updateSession(request)).rejects.toThrow('Session not found');
    });

    test('returns unchanged session when no updates provided', async () => {
      const request: UpdateSessionRequest = {
        sessionId: 'session-123'
      };

      mockDynamoClient.send.mockResolvedValueOnce({ Items: [mockSession] });

      const result = await sessionService.updateSession(request);

      expect(result).toEqual(mockSession);
      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1); // Only getSession called
    });

    test('handles partial performance metrics updates', async () => {
      const request: UpdateSessionRequest = {
        sessionId: 'session-123',
        performanceMetrics: {
          wordsSpoken: 100,
          fluencyScore: 0.75
          // Other metrics not provided
        }
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockResolvedValueOnce({ Attributes: mockSession });

      await sessionService.updateSession(request);

      const updateCall = mockDynamoClient.send.mock.calls[1][0];
      const values = updateCall.input.ExpressionAttributeValues;

      expect(values[':wordsSpoken']).toBe(100);
      expect(values[':fluencyScore']).toBe(0.75);
      expect(values[':duration']).toBeUndefined();
    });
  });

  describe('endSession', () => {
    test('ends session with final metrics', async () => {
      const finalMetrics: SessionMetrics = {
        duration: 1800,
        wordsSpoken: 200,
        averageResponseTime: 2.5,
        grammarAccuracy: 0.88,
        fluencyScore: 0.82,
        vocabularyUsed: ['excellent', 'wonderful', 'amazing'],
        errorsCount: 3,
        improvementsShown: 5
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockResolvedValueOnce({ 
          Attributes: { 
            ...mockSession, 
            status: 'completed', 
            performanceMetrics: finalMetrics 
          } 
        });

      const result = await sessionService.endSession('session-123', finalMetrics);

      expect(result.status).toBe('completed');
      expect(result.endTime).toBeDefined();
      expect(result.performanceMetrics).toEqual(finalMetrics);
    });

    test('handles errors during session ending', async () => {
      const finalMetrics: SessionMetrics = {
        duration: 1200,
        wordsSpoken: 100,
        averageResponseTime: 3.0,
        grammarAccuracy: 0.75,
        fluencyScore: 0.70,
        vocabularyUsed: ['good', 'nice'],
        errorsCount: 5,
        improvementsShown: 3
      };

      mockDynamoClient.send.mockRejectedValue(new Error('Update failed'));

      await expect(sessionService.endSession('session-123', finalMetrics)).rejects.toThrow('Failed to end session');
    });
  });

  describe('addMessage', () => {
    test('adds user message successfully', async () => {
      const request: AddMessageRequest = {
        sessionId: 'session-123',
        sender: 'user',
        content: 'Hello, how are you today?',
        transcriptionConfidence: 0.95
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] }) // getSession
        .mockResolvedValueOnce({}); // UpdateCommand

      const result = await sessionService.addMessage(request);

      expect(result.messageId).toBeDefined();
      expect(result.sessionId).toBe('session-123');
      expect(result.sender).toBe('user');
      expect(result.content).toBe('Hello, how are you today?');
      expect(result.transcriptionConfidence).toBe(0.95);
      expect(result.timestamp).toBeInstanceOf(Date);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UpdateExpression: 'SET messages = list_append(if_not_exists(messages, :empty_list), :message)'
          })
        })
      );
    });

    test('adds agent message successfully', async () => {
      const request: AddMessageRequest = {
        sessionId: 'session-123',
        sender: 'agent',
        content: 'I am doing well, thank you! How can I help you practice today?',
        audioUrl: 'https://example.com/audio/response.mp3'
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockResolvedValueOnce({});

      const result = await sessionService.addMessage(request);

      expect(result.sender).toBe('agent');
      expect(result.audioUrl).toBe('https://example.com/audio/response.mp3');
      expect(result.transcriptionConfidence).toBeUndefined();
    });

    test('handles session not found error', async () => {
      const request: AddMessageRequest = {
        sessionId: 'nonexistent-session',
        sender: 'user',
        content: 'Hello'
      };

      mockDynamoClient.send.mockResolvedValueOnce({ Items: [] });

      await expect(sessionService.addMessage(request)).rejects.toThrow('Session not found');
    });

    test('handles message addition errors', async () => {
      const request: AddMessageRequest = {
        sessionId: 'session-123',
        sender: 'user',
        content: 'Test message'
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(sessionService.addMessage(request)).rejects.toThrow('Failed to add message');
    });
  });

  describe('addFeedback', () => {
    test('adds feedback successfully', async () => {
      const feedback: FeedbackInstance = {
        feedbackId: 'feedback-123',
        sessionId: 'session-123',
        messageId: 'message-456',
        type: 'correction',
        content: 'Try using "I am" instead of "I are"',
        deliveredAt: new Date()
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockResolvedValueOnce({});

      await sessionService.addFeedback('session-123', feedback);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UpdateExpression: 'SET feedbackProvided = list_append(if_not_exists(feedbackProvided, :empty_list), :feedback)',
            ExpressionAttributeValues: {
              ':feedback': [feedback],
              ':empty_list': []
            }
          })
        })
      );
    });

    test('handles feedback addition errors', async () => {
      const feedback: FeedbackInstance = {
        feedbackId: 'feedback-123',
        sessionId: 'session-123',
        messageId: 'message-456',
        type: 'encouragement',
        content: 'Great job!',
        deliveredAt: new Date()
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(sessionService.addFeedback('session-123', feedback)).rejects.toThrow('Failed to add feedback');
    });
  });

  describe('getUserSessions', () => {
    test('retrieves user sessions successfully', async () => {
      const mockSessions = [
        { ...mockSession, sessionId: 'session-1' },
        { ...mockSession, sessionId: 'session-2' }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockSessions
      });

      const result = await sessionService.getUserSessions('user-456', 10);

      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe('session-1');
      expect(result[1].sessionId).toBe('session-2');

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-sessions-table',
            IndexName: 'UserSessionIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': 'user-456'
            },
            ScanIndexForward: false,
            Limit: 10
          })
        })
      );
    });

    test('returns empty array when no sessions found', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: []
      });

      const result = await sessionService.getUserSessions('user-with-no-sessions');

      expect(result).toEqual([]);
    });

    test('uses default limit when not specified', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: []
      });

      await sessionService.getUserSessions('user-456');

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Limit: 20
          })
        })
      );
    });
  });

  describe('getActiveUserSessions', () => {
    test('retrieves only active sessions', async () => {
      const activeSessions = [
        { ...mockSession, sessionId: 'active-1', status: 'active' },
        { ...mockSession, sessionId: 'active-2', status: 'active' }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: activeSessions
      });

      const result = await sessionService.getActiveUserSessions('user-456');

      expect(result).toHaveLength(2);
      expect(result.every(session => session.status === 'active')).toBe(true);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':userId': 'user-456',
              ':status': 'active'
            }
          })
        })
      );
    });

    test('returns empty array when no active sessions', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: []
      });

      const result = await sessionService.getActiveUserSessions('user-456');

      expect(result).toEqual([]);
    });
  });

  describe('deleteSession', () => {
    test('deletes session successfully', async () => {
      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] }) // getSession
        .mockResolvedValueOnce({}); // DeleteCommand

      await sessionService.deleteSession('session-123');

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-sessions-table',
            Key: {
              sessionId: 'session-123',
              timestamp: mockSession.startTime.getTime()
            }
          })
        })
      );
    });

    test('handles session not found during deletion', async () => {
      mockDynamoClient.send.mockResolvedValueOnce({ Items: [] });

      await expect(sessionService.deleteSession('nonexistent-session')).rejects.toThrow('Session not found');
    });
  });

  describe('getSessionMetrics', () => {
    test('retrieves session metrics successfully', async () => {
      const sessionWithMetrics = {
        ...mockSession,
        performanceMetrics: {
          duration: 1800,
          wordsSpoken: 150,
          averageResponseTime: 2.5,
          grammarAccuracy: 0.85,
          fluencyScore: 0.80,
          vocabularyUsed: ['good', 'excellent'],
          errorsCount: 2,
          improvementsShown: 4
        }
      };

      mockDynamoClient.send.mockResolvedValue({
        Items: [sessionWithMetrics]
      });

      const result = await sessionService.getSessionMetrics('session-123');

      expect(result).toEqual(sessionWithMetrics.performanceMetrics);
    });

    test('returns null when session not found', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: []
      });

      const result = await sessionService.getSessionMetrics('nonexistent-session');

      expect(result).toBeNull();
    });
  });

  describe('data serialization', () => {
    test('correctly deserializes session dates', async () => {
      const dbItem = {
        ...mockSession,
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T11:00:00.000Z'
      };

      mockDynamoClient.send.mockResolvedValue({
        Items: [dbItem]
      });

      const result = await sessionService.getSession('session-123');

      expect(result!.startTime).toBeInstanceOf(Date);
      expect(result!.endTime).toBeInstanceOf(Date);
    });

    test('handles missing optional fields with defaults', async () => {
      const dbItem = {
        sessionId: 'session-123',
        userId: 'user-456',
        agentId: 'friendly-tutor',
        startTime: '2024-01-15T10:00:00.000Z',
        topic: 'Test Topic',
        difficulty: 'medium'
        // Missing messages, performanceMetrics, feedbackProvided, status
      };

      mockDynamoClient.send.mockResolvedValue({
        Items: [dbItem]
      });

      const result = await sessionService.getSession('session-123');

      expect(result!.messages).toEqual([]);
      expect(result!.feedbackProvided).toEqual([]);
      expect(result!.status).toBe('active');
      expect(result!.performanceMetrics.duration).toBe(0);
    });

    test('correctly deserializes performance metrics', async () => {
      const dbItem = {
        ...mockSession,
        performanceMetrics: {
          duration: 2400,
          wordsSpoken: 180,
          averageResponseTime: 3.2,
          grammarAccuracy: 0.92,
          fluencyScore: 0.88,
          vocabularyUsed: ['excellent', 'wonderful', 'amazing'],
          errorsCount: 1,
          improvementsShown: 6
        }
      };

      mockDynamoClient.send.mockResolvedValue({
        Items: [dbItem]
      });

      const result = await sessionService.getSession('session-123');

      expect(result!.performanceMetrics.duration).toBe(2400);
      expect(result!.performanceMetrics.vocabularyUsed).toEqual(['excellent', 'wonderful', 'amazing']);
      expect(result!.performanceMetrics.grammarAccuracy).toBe(0.92);
    });
  });

  describe('error handling', () => {
    test('handles DynamoDB service errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('Service unavailable'));

      await expect(sessionService.getSession('session-123')).rejects.toThrow('Failed to get session');
    });

    test('handles network errors during operations', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('Network timeout'));

      const request: CreateSessionRequest = {
        userId: 'user-456',
        agentId: 'friendly-tutor',
        topic: 'Test Topic',
        difficulty: 'medium'
      };

      await expect(sessionService.createSession(request)).rejects.toThrow('Failed to create session');
    });

    test('handles concurrent modification errors', async () => {
      const request: UpdateSessionRequest = {
        sessionId: 'session-123',
        status: 'completed'
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Items: [mockSession] })
        .mockRejectedValueOnce(new Error('ConditionalCheckFailedException'));

      await expect(sessionService.updateSession(request)).rejects.toThrow('Failed to update session');
    });
  });
});