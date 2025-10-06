import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AgentFactory } from '@/agents/coordination/agent-factory';
import { StrandsAgent } from '@/agents/base/strands-agent';
import { 
  ConversationSession, 
  ConversationMessage, 
  UserProfile,
  ConversationContext,
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse
} from '@/shared/types';
import { generateSessionId, generateMessageId, createErrorResponse, createSuccessResponse } from '@/shared/utils';

export interface ConversationOrchestrator {
  createSession(request: CreateSessionRequest): Promise<CreateSessionResponse>;
  sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;
  endSession(sessionId: string): Promise<void>;
  getSessionHistory(sessionId: string): Promise<ConversationSession | null>;
  getUserSessions(userId: string, limit?: number): Promise<ConversationSession[]>;
}

export class DynamoDBConversationOrchestrator implements ConversationOrchestrator {
  private dynamoClient: DynamoDBDocumentClient;
  private agentFactory: AgentFactory;
  private userTableName: string;
  private sessionTableName: string;
  private activeAgents: Map<string, StrandsAgent> = new Map();
  private sessionContexts: Map<string, ConversationContext> = new Map();

  constructor(
    userTableName: string,
    sessionTableName: string,
    region?: string
  ) {
    const client = new DynamoDBClient({ region: region || process.env.AWS_REGION });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.agentFactory = new AgentFactory(region);
    this.userTableName = userTableName;
    this.sessionTableName = sessionTableName;
  }

  /**
   * Create a new conversation session
   */
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(request.userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Recommend agent if not specified
      let agentId = request.agentId;
      if (!agentId) {
        const recommendation = this.agentFactory.recommendAgent(userProfile);
        agentId = recommendation.agentId;
      }

      // Get the agent
      const agent = this.agentFactory.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Create session
      const sessionId = generateSessionId();
      const session: ConversationSession = {
        sessionId,
        userId: request.userId,
        agentId,
        startTime: new Date(),
        topic: request.topic || 'General Conversation',
        difficulty: request.difficulty || 'adaptive',
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

      // Store session in DynamoDB
      await this.dynamoClient.send(new PutCommand({
        TableName: this.sessionTableName,
        Item: {
          ...session,
          timestamp: Date.now()
        }
      }));

      // Create conversation context
      const context: ConversationContext = {
        sessionId,
        userId: request.userId,
        conversationHistory: [],
        userProfile,
        currentTopic: session.topic
      };

      // Store active agent and context
      this.activeAgents.set(sessionId, agent);
      this.sessionContexts.set(sessionId, context);

      // Generate initial agent message
      const initialMessage = await this.generateInitialMessage(agent, context);

      return {
        sessionId,
        agentPersonality: agent.getPersonality(),
        initialMessage
      };

    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create conversation session');
    }
  }

  /**
   * Send a message in an active conversation
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      // Get session and context
      const session = await this.getSessionFromDB(request.sessionId);
      if (!session || session.status !== 'active') {
        throw new Error('Session not found or not active');
      }

      const context = this.sessionContexts.get(request.sessionId);
      const agent = this.activeAgents.get(request.sessionId);
      
      if (!context || !agent) {
        throw new Error('Session context not found');
      }

      // Create user message
      const userMessage: ConversationMessage = {
        messageId: generateMessageId(),
        sessionId: request.sessionId,
        sender: 'user',
        content: request.content,
        audioUrl: request.audioData ? await this.processAudioData(request.audioData) : undefined,
        timestamp: new Date(),
        transcriptionConfidence: this.calculateTranscriptionConfidence(request.content)
      };

      // Add to conversation history
      context.conversationHistory.push(userMessage);

      // Check for agent handoff recommendation
      const handoffRecommendation = this.agentFactory.recommendAgentHandoff(
        agent.getPersonality().id,
        context,
        context.userProfile!
      );

      let currentAgent = agent;
      if (handoffRecommendation && handoffRecommendation.confidence > 0.7) {
        // Perform agent handoff
        const newAgent = this.agentFactory.getAgent(handoffRecommendation.agentId);
        if (newAgent) {
          currentAgent = newAgent;
          this.activeAgents.set(request.sessionId, newAgent);
          
          // Update session with new agent
          await this.updateSessionAgent(request.sessionId, handoffRecommendation.agentId);
        }
      }

      // Generate agent response
      const agentResponse = await currentAgent.generateSupportiveResponse(context);

      // Create agent message
      const agentMessage: ConversationMessage = {
        messageId: generateMessageId(),
        sessionId: request.sessionId,
        sender: 'agent',
        content: agentResponse.content,
        timestamp: new Date()
      };

      // Add to conversation history
      context.conversationHistory.push(agentMessage);

      // Update session in database
      await this.updateSessionWithMessages(request.sessionId, [userMessage, agentMessage]);

      // Update performance metrics
      await this.updatePerformanceMetrics(request.sessionId, userMessage, agentResponse);

      // Store feedback if provided
      if (agentResponse.feedback && agentResponse.feedback.length > 0) {
        await this.storeFeedback(request.sessionId, agentResponse.feedback);
      }

      return {
        messageId: agentMessage.messageId,
        agentResponse: agentResponse.content,
        audioUrl: agentResponse.audioInstructions ? 
          await this.generateAudioResponse(agentResponse.content, agentResponse.audioInstructions) : 
          undefined,
        feedback: agentResponse.feedback,
        analysis: userMessage.languageAnalysis
      };

    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to process message');
    }
  }

  /**
   * End an active conversation session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSessionFromDB(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Calculate final performance metrics
      const finalMetrics = await this.calculateFinalMetrics(session);

      // Update session status and end time
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.sessionTableName,
        Key: { sessionId, timestamp: session.startTime.getTime() },
        UpdateExpression: 'SET #status = :status, endTime = :endTime, performanceMetrics = :metrics',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':endTime': new Date(),
          ':metrics': finalMetrics
        }
      }));

      // Clean up active session data
      this.activeAgents.delete(sessionId);
      this.sessionContexts.delete(sessionId);

      // Update user progress metrics
      await this.updateUserProgress(session.userId, finalMetrics);

    } catch (error) {
      console.error('Error ending session:', error);
      throw new Error('Failed to end session');
    }
  }

  /**
   * Get session history
   */
  async getSessionHistory(sessionId: string): Promise<ConversationSession | null> {
    try {
      return await this.getSessionFromDB(sessionId);
    } catch (error) {
      console.error('Error getting session history:', error);
      return null;
    }
  }

  /**
   * Get user's recent sessions
   */
  async getUserSessions(userId: string, limit: number = 10): Promise<ConversationSession[]> {
    try {
      const response = await this.dynamoClient.send(new QueryCommand({
        TableName: this.sessionTableName,
        IndexName: 'UserSessionIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit
      }));

      return response.Items as ConversationSession[] || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await this.dynamoClient.send(new GetCommand({
        TableName: this.userTableName,
        Key: { userId }
      }));

      return response.Item as UserProfile || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private async getSessionFromDB(sessionId: string): Promise<ConversationSession | null> {
    try {
      const response = await this.dynamoClient.send(new QueryCommand({
        TableName: this.sessionTableName,
        KeyConditionExpression: 'sessionId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': sessionId
        },
        Limit: 1
      }));

      return response.Items?.[0] as ConversationSession || null;
    } catch (error) {
      console.error('Error getting session from DB:', error);
      return null;
    }
  }

  private async generateInitialMessage(agent: StrandsAgent, context: ConversationContext): Promise<string> {
    const personality = agent.getPersonality();
    const userProfile = context.userProfile;
    
    // Create a welcoming initial message based on agent personality
    const welcomePrompts = {
      'friendly-tutor': `Hello! I'm ${personality.name}, and I'm so excited to practice with you today! What would you like to work on?`,
      'strict-teacher': `Good day. I am ${personality.name}. We will focus on improving your language skills systematically. What specific area needs attention?`,
      'conversation-partner': `Hey there! I'm ${personality.name}. Ready for a fun chat? What's been going on with you lately?`,
      'pronunciation-coach': `Hello! I'm ${personality.name}, your pronunciation coach. Let's work on making your speech clear and confident. Shall we start with a warm-up?`
    };

    return welcomePrompts[personality.conversationStyle] || welcomePrompts['friendly-tutor'];
  }

  private calculateTranscriptionConfidence(content: string): number {
    // Simple heuristic for transcription confidence
    // In real implementation, this would come from the transcription service
    const wordCount = content.split(' ').length;
    const hasNumbers = /\d/.test(content);
    const hasSpecialChars = /[^a-zA-Z0-9\s.,!?']/.test(content);
    
    let confidence = 0.8;
    
    if (wordCount < 3) confidence -= 0.2;
    if (hasNumbers) confidence -= 0.1;
    if (hasSpecialChars) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private async processAudioData(audioData: string): Promise<string> {
    // In real implementation, this would upload to S3 and return URL
    // For now, return a mock URL
    return `https://languagepeer-audio.s3.amazonaws.com/audio/${Date.now()}.wav`;
  }

  private async generateAudioResponse(content: string, audioInstructions: any): Promise<string> {
    // In real implementation, this would use Polly to generate speech
    // For now, return a mock URL
    return `https://languagepeer-audio.s3.amazonaws.com/responses/${Date.now()}.mp3`;
  }

  private async updateSessionWithMessages(sessionId: string, messages: ConversationMessage[]): Promise<void> {
    try {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.sessionTableName,
        Key: { sessionId, timestamp: Date.now() },
        UpdateExpression: 'SET messages = list_append(if_not_exists(messages, :empty_list), :new_messages)',
        ExpressionAttributeValues: {
          ':new_messages': messages,
          ':empty_list': []
        }
      }));
    } catch (error) {
      console.error('Error updating session with messages:', error);
    }
  }

  private async updateSessionAgent(sessionId: string, newAgentId: string): Promise<void> {
    try {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.sessionTableName,
        Key: { sessionId, timestamp: Date.now() },
        UpdateExpression: 'SET agentId = :agentId',
        ExpressionAttributeValues: {
          ':agentId': newAgentId
        }
      }));
    } catch (error) {
      console.error('Error updating session agent:', error);
    }
  }

  private async updatePerformanceMetrics(
    sessionId: string, 
    userMessage: ConversationMessage, 
    agentResponse: any
  ): Promise<void> {
    // Calculate metrics based on user message and agent response
    const wordsSpoken = userMessage.content.split(' ').length;
    const hasErrors = agentResponse.feedback?.some((f: any) => f.type === 'correction') || false;
    
    try {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.sessionTableName,
        Key: { sessionId, timestamp: Date.now() },
        UpdateExpression: 'ADD performanceMetrics.wordsSpoken :words, performanceMetrics.errorsCount :errors',
        ExpressionAttributeValues: {
          ':words': wordsSpoken,
          ':errors': hasErrors ? 1 : 0
        }
      }));
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  private async storeFeedback(sessionId: string, feedback: any[]): Promise<void> {
    try {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.sessionTableName,
        Key: { sessionId, timestamp: Date.now() },
        UpdateExpression: 'SET feedbackProvided = list_append(if_not_exists(feedbackProvided, :empty_list), :feedback)',
        ExpressionAttributeValues: {
          ':feedback': feedback,
          ':empty_list': []
        }
      }));
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  }

  private async calculateFinalMetrics(session: ConversationSession): Promise<any> {
    const duration = session.endTime ? 
      session.endTime.getTime() - session.startTime.getTime() : 
      Date.now() - session.startTime.getTime();

    return {
      ...session.performanceMetrics,
      duration,
      averageResponseTime: duration / Math.max(session.messages.length, 1)
    };
  }

  private async updateUserProgress(userId: string, sessionMetrics: any): Promise<void> {
    try {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.userTableName,
        Key: { userId },
        UpdateExpression: 'ADD progressMetrics.sessionsCompleted :one, progressMetrics.totalPracticeTime :duration',
        ExpressionAttributeValues: {
          ':one': 1,
          ':duration': sessionMetrics.duration
        }
      }));
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }
}