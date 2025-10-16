/**
 * Standalone API handler for LanguagePeer TTS functionality
 * 
 * This module provides a simplified Lambda handler for testing and development
 * of the LanguagePeer voice-first language learning platform. It includes
 * mock implementations of conversation endpoints and agent responses.
 */

/**
 * AWS API Gateway proxy event structure
 * Contains HTTP request details forwarded from API Gateway
 */
interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: { [name: string]: string };
  queryStringParameters: { [name: string]: string } | null;
}

/**
 * AWS API Gateway proxy response structure
 * Defines the expected response format for Lambda proxy integration
 */
interface APIGatewayProxyResult {
  statusCode: number;
  headers: { [name: string]: string };
  body: string;
}

/**
 * CORS headers for cross-origin resource sharing
 * Allows frontend applications to make requests from different domains
 * Note: '*' origin should be restricted to specific domains in production
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('API Handler - Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Route requests
    switch (true) {
      case path === '/health' && method === 'GET':
        return handleHealthCheck();

      case path === '/conversation' && method === 'POST':
        return await handleConversation(event);

      case path === '/agents' && method === 'GET':
        return handleGetAgents();

      case path.startsWith('/sessions') && method === 'POST':
        return await handleStartSession(event);

      case path.match(/\/sessions\/[^/]+$/) && method === 'DELETE':
        return await handleEndSession(event);



      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found' })
        };
    }
  } catch (error) {
    console.error('API Handler Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Health check endpoint
const handleHealthCheck = (): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  };
};

// Handle conversation messages
const handleConversation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  const { message, agentPersonality, sessionId, userId } = JSON.parse(event.body);

  if (!message || !agentPersonality) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Message and agentPersonality are required' })
    };
  }

  try {
    // Generate simple mock response
    const response = {
      content: generateMockResponse(message, agentPersonality)
    };

    // Generate mock feedback
    const feedback = {
      grammarScore: Math.floor(Math.random() * 30) + 70,
      fluencyScore: Math.floor(Math.random() * 25) + 75,
      vocabularyScore: Math.floor(Math.random() * 20) + 80,
      suggestions: ['Try using more varied vocabulary', 'Consider using transition words'],
      corrections: [],
      encouragement: "You're doing great! Keep practicing and you'll see improvement."
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        response: response.content,
        sessionId: sessionId || `session-${Date.now()}`,
        feedback
      })
    };
  } catch (error) {
    console.error('Conversation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to generate response' })
    };
  }
};

// Generate mock response for testing
const generateMockResponse = (message: string, agentPersonality: string): string => {
  const responses: Record<string, string[]> = {
    'friendly-tutor': [
      "Great job!",
      "Nice work!",
      "Good effort!",
      "Well done!"
    ],
    'strict-teacher': [
      "I notice an error.",
      "Pay attention here.",
      "Focus on accuracy.",
      "Remember the rule."
    ],
    'conversation-partner': [
      "That's interesting!",
      "I get it.",
      "Sounds cool!",
      "Nice story!"
    ],
    'pronunciation-coach': [
      "Good try!",
      "Better!",
      "Nice improvement!",
      "Getting clearer!"
    ]
  };

  const agentResponses = responses[agentPersonality] || responses['friendly-tutor'];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
};

// Get available agents
const handleGetAgents = (): APIGatewayProxyResult => {
  const agents = [
    {
      id: 'friendly-tutor',
      name: 'Emma',
      personality: 'friendly-tutor',
      description: 'A supportive and encouraging language tutor who makes learning fun',
      avatar: '👩‍🏫'
    },
    {
      id: 'strict-teacher',
      name: 'Professor Chen',
      personality: 'strict-teacher',
      description: 'A detail-oriented teacher focused on grammar and pronunciation accuracy',
      avatar: '👨‍🎓'
    },
    {
      id: 'conversation-partner',
      name: 'Alex',
      personality: 'conversation-partner',
      description: 'A casual conversation partner for natural, everyday practice',
      avatar: '🙋‍♂️'
    },
    {
      id: 'pronunciation-coach',
      name: 'Riley',
      personality: 'pronunciation-coach',
      description: 'A specialized coach focused on perfecting pronunciation and accent',
      avatar: '🎯'
    }
  ];

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(agents)
  };
};

// Start new session
const handleStartSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ sessionId })
  };
};

// End session
const handleEndSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true })
  };
};

// Handle text-to-speech synthesis
const handleSynthesize = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Synthesize request received:', event.body);
  
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  let requestData;
  try {
    requestData = JSON.parse(event.body);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  const { text, voiceId } = requestData;

  if (!text) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Text is required' })
    };
  }

  console.log('TTS Request processed:', { text, voiceId });

  // Return success response that triggers browser fallback
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      audioUrl: null, // This will trigger fallback to browser TTS
      contentType: 'audio/mpeg',
      requestCharacters: text.length,
      message: 'Using browser TTS fallback'
    })
  };
};

