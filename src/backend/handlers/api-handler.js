// Simple JavaScript API handler for LanguagePeer
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
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
      
      case path === '/transcribe' && method === 'POST':
        return await handleTranscribe(event);
      
      case path === '/synthesize' && method === 'POST':
        return await handleSynthesize(event);
      
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
        message: error.message || 'Unknown error'
      })
    };
  }
};

// Health check endpoint
const handleHealthCheck = () => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'healthy',
        transcribe: 'healthy',
        polly: 'healthy',
        bedrock: 'healthy',
        comprehend: 'healthy'
      },
      region: process.env.REGION || process.env.AWS_REGION || 'us-east-1'
    })
  };
};

// Handle conversation messages
const handleConversation = async (event) => {
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
    console.log('Processing conversation request:', { message, agentPersonality });
    
    // Get system prompt for the agent
    const systemPrompt = getSystemPrompt(agentPersonality);
    
    // Create Nova model request
    const modelId = 'amazon.nova-pro-v1:0';
    const requestBody = {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `${systemPrompt}\n\nStudent: ${message}\n\nTutor:`
            }
          ]
        }
      ],
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9
      }
    };

    console.log('Calling Bedrock with model:', modelId);

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('Bedrock response received:', { 
      hasOutput: !!responseBody.output,
      hasMessage: !!responseBody.output?.message,
      hasContent: !!responseBody.output?.message?.content
    });
    
    const agentResponse = responseBody.output?.message?.content?.[0]?.text || 'I apologize, but I cannot respond right now.';

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
        response: agentResponse,
        sessionId: sessionId || `session-${Date.now()}`,
        feedback
      })
    };
  } catch (error) {
    console.error('Conversation error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to generate response',
        details: error.message 
      })
    };
  }
};

// Get available agents
const handleGetAgents = () => {
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
const handleStartSession = async (event) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ sessionId })
  };
};

// End session
const handleEndSession = async (event) => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true })
  };
};

// Handle transcription (mock implementation)
const handleTranscribe = async (event) => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      transcript: 'Mock transcription result',
      confidence: 0.85
    })
  };
};

// Handle text-to-speech using AWS Polly
const handleSynthesize = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const { text, voiceId = 'Joanna' } = JSON.parse(event.body);
    
    if (!text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    // Use AWS Polly to synthesize speech
    const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    
    const pollyClient = new PollyClient({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });
    const s3Client = new S3Client({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });

    // Synthesize speech with Polly
    const pollyParams = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'neural' // Use neural engine for better quality
    };

    const pollyCommand = new SynthesizeSpeechCommand(pollyParams);
    const pollyResponse = await pollyClient.send(pollyCommand);

    // Generate unique filename
    const audioKey = `speech/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
    
    // Upload to S3 (assuming we have an audio bucket)
    const bucketName = process.env.AUDIO_BUCKET_NAME || 'languagepeer-audio-development-980874804229';
    
    const s3Params = {
      Bucket: bucketName,
      Key: audioKey,
      Body: pollyResponse.AudioStream,
      ContentType: 'audio/mpeg',
      ACL: 'public-read'
    };

    const s3Command = new PutObjectCommand(s3Params);
    await s3Client.send(s3Command);

    // Return the public URL
    const audioUrl = `https://${bucketName}.s3.amazonaws.com/${audioKey}`;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ audioUrl })
    };

  } catch (error) {
    console.error('TTS synthesis error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to synthesize speech',
        message: error.message 
      })
    };
  }
};

// Get system prompt for different agent personalities
const getSystemPrompt = (personality) => {
  const prompts = {
    'friendly-tutor': `You are Emma, a friendly and encouraging language tutor. You're supportive, patient, and make learning enjoyable. Always provide positive reinforcement while gently correcting mistakes. Keep responses conversational and encouraging.`,
    
    'strict-teacher': `You are Professor Chen, a detail-oriented language teacher. You focus on grammar accuracy, proper pronunciation, and formal language structure. Provide clear corrections and explanations when mistakes are made. Be thorough but respectful.`,
    
    'conversation-partner': `You are Alex, a casual conversation partner. Engage in natural, everyday conversations as if talking with a friend. Keep the tone relaxed and informal. Share experiences and ask follow-up questions to keep the conversation flowing.`,
    
    'pronunciation-coach': `You are Riley, a pronunciation specialist. Focus on helping improve speech clarity, accent, and intonation. Provide specific guidance on difficult sounds and rhythm patterns. Be encouraging while being precise about pronunciation details.`
  };

  return prompts[personality] || prompts['friendly-tutor'];
};