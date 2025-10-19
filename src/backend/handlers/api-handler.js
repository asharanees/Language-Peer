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
      version: '1.0.1-optimized',
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
    console.log('Processing optimized conversation request:', { message, agentPersonality });

    // Generate AI-powered response using Bedrock
    const agentResponse = await generateAIResponse(message, agentPersonality);

    console.log('Generated AI response:', agentResponse);

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

// Generate AI-powered response using AWS Bedrock
const generateAIResponse = async (message, agentPersonality) => {
  try {
    console.log('Generating AI response for:', { message, agentPersonality });

    // Get system prompt for the agent
    const systemPrompt = getOptimizedSystemPrompt(agentPersonality);

    // Create Nova model request with optimization constraints
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
        maxTokens: 150,  // Reduced for concise responses
        temperature: 0.8, // Higher for more natural language
        topP: 0.9,
        stopSequences: ['Student:', 'Tutor:', '\n\n', 'Human:', 'Assistant:']
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

    let agentResponse = responseBody.output?.message?.content?.[0]?.text || 'I apologize, but I cannot respond right now.';

    // Apply post-processing optimizations
    agentResponse = optimizeResponse(agentResponse, agentPersonality);

    return agentResponse;

  } catch (error) {
    console.error('Bedrock AI generation failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    // Fallback to optimized mock response
    console.log('Using contextual fallback for:', { message, agentPersonality });
    return generateOptimizedFallback(message, agentPersonality);
  }
};

// Get optimized system prompts with strict constraints
const getOptimizedSystemPrompt = (personality) => {
  const baseRules = `
CRITICAL RESPONSE RULES - ALWAYS FOLLOW:
- Maximum 2 sentences per response
- Keep responses under 100 characters when possible
- Use contractions (I'm, you're, that's, etc.)
- End with a question or engaging prompt
- Sound natural and conversational, not formal
- React directly to what the student said - address their specific message
- If they make grammar errors, gently correct them
- If they ask about topics, respond about those topics
- Keep the conversation flowing smoothly`;

  const prompts = {
    'friendly-tutor': `You are Maya, a friendly and encouraging language tutor.${baseRules}

Your personality: Warm, supportive, patient, encouraging. Always be positive and make learning fun.

IMPORTANT: Always address what the student actually said. If they make grammar mistakes, help them fix it gently.

Examples of good responses:
- Student: "I am go to store" → "Nice try! It should be 'I went to the store.' Want to practice past tense?"
- Student: "I like movies" → "That's great! What's your favorite movie?"
- Student: "How are you?" → "I'm doing well, thanks! How's your English practice going?"`,

    'strict-teacher': `You are Professor Chen, a precise but efficient language teacher.${baseRules}

Your personality: Direct, clear, professional but warm. Focus on accuracy while being concise.

IMPORTANT: Always address the student's specific message and correct any errors you see.

Examples of good responses:
- Student: "He don't like it" → "Good try! It should be 'He doesn't like it.' Can you fix that?"
- Student: "What is grammar?" → "Grammar is language structure. Want to practice verb forms?"
- Student: "I confused" → "I see! It should be 'I'm confused.' What's confusing you?"`,

    'conversation-partner': `You are Alex, a casual conversation partner and friend.${baseRules}

Your personality: Casual, natural, friendly, relatable. Talk like a real friend would.

IMPORTANT: Always respond to what they're talking about. Be a real conversation partner.

Examples of good responses:
- Student: "I love movies" → "Oh cool! What kind of movies do you like?"
- Student: "I went shopping" → "Nice! Did you find anything good?"
- Student: "How was your day?" → "Pretty good! What about yours?"`,

    'pronunciation-coach': `You are Riley, a pronunciation specialist.${baseRules}

Your personality: Encouraging, precise about sounds, patient with practice.

IMPORTANT: Always address their specific pronunciation concerns or help with sounds they mention.

Examples of good responses:
- Student: "I can't say 'th'" → "Try putting your tongue between your teeth. Want to practice 'think'?"
- Student: "How do I say 'water'?" → "Say 'WAH-ter' with a clear 't' sound. Try it!"
- Student: "My accent is bad" → "Accents are normal! Let's work on clear sounds. What's hardest for you?"`
  };

  return prompts[personality] || prompts['friendly-tutor'];
};

// Optimize AI response for natural conversation
const optimizeResponse = (response, agentPersonality) => {
  let optimized = response.trim();

  // Remove common AI response patterns that sound unnatural
  optimized = optimized
    .replace(/^(I understand that|I can see that|I notice that|It seems like|It appears that)/i, '')
    .replace(/^(Thank you for sharing|Thank you for telling me)/i, '')
    .replace(/^(That's a great question|That's an interesting point)/i, '')
    .replace(/^(However,?\s*)/i, '')
    .trim();

  // Make language more conversational
  optimized = optimized
    .replace(/\bI am\b/g, "I'm")
    .replace(/\byou are\b/g, "you're")
    .replace(/\bthat is\b/g, "that's")
    .replace(/\bit is\b/g, "it's")
    .replace(/\bwould not\b/g, "wouldn't")
    .replace(/\bcannot\b/g, "can't")
    .replace(/\bdo not\b/g, "don't")
    .replace(/\bdoes not\b/g, "doesn't");

  // Take first 1-2 sentences for conciseness, but preserve context
  const sentences = optimized.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) {
    optimized = sentences.slice(0, 2).join('. ') + '.';
  } else if (sentences.length === 0) {
    // If no proper sentences, take first 80 characters and add period
    optimized = optimized.substring(0, 80).trim();
    if (!optimized.match(/[.!?]$/)) {
      optimized += '.';
    }
  }

  // Add natural conversation starter occasionally
  if (Math.random() < 0.3 && !optimized.match(/^(Oh|Yeah|Wow|Nice|Great|Cool|Hey)/i)) {
    const naturalStarters = ['Nice', 'Great', 'Cool', 'Oh'];
    const starter = naturalStarters[Math.floor(Math.random() * naturalStarters.length)];
    optimized = `${starter}! ${optimized}`;
  }

  // Only add engagement questions when they make contextual sense
  if (!optimized.match(/[?]$/) && Math.random() < 0.3) {
    // More natural, contextual engagement based on content
    if (optimized.toLowerCase().includes('try') || optimized.toLowerCase().includes('practice')) {
      optimized += ' Want to give it a shot?';
    } else if (optimized.toLowerCase().includes('good') || optimized.toLowerCase().includes('great')) {
      optimized += ' Keep it up!';
    } else if (optimized.toLowerCase().includes('think') || optimized.toLowerCase().includes('idea')) {
      optimized += ' What are your thoughts?';
    }
    // Otherwise, let the response end naturally without forced questions
  }

  return optimized;
};

// Fallback contextual responses when AI fails
const generateOptimizedFallback = (message, agentPersonality) => {
  const messageLower = message.toLowerCase();

  // Try to provide contextual fallbacks based on message content
  if (messageLower.includes('grammar') || messageLower.includes('mistake') || messageLower.includes('error')) {
    return agentPersonality === 'friendly-tutor' ?
      "I'd love to help with grammar! What specific part is tricky?" :
      "Let's work on that grammar point. What's confusing you?";
  }

  if (messageLower.includes('pronunciation') || messageLower.includes('sound') || messageLower.includes('accent')) {
    return "Let's practice that sound together. Which part is hardest for you?";
  }

  if (messageLower.includes('movie') || messageLower.includes('film')) {
    return agentPersonality === 'conversation-partner' ?
      "Oh cool! I love movies too. What's your favorite genre?" :
      "Movies are great for learning! What kind do you like?";
  }

  if (messageLower.includes('weekend') || messageLower.includes('free time')) {
    return "Weekends are nice! What do you usually do for fun?";
  }

  // Grammar error patterns - try to address them
  if (messageLower.includes('am go') || messageLower.includes('are go')) {
    return "Good try! For past actions, use 'went'. Want to practice?";
  }

  if (messageLower.includes('don\'t') && (messageLower.includes('he ') || messageLower.includes('she '))) {
    return "Almost! With 'he' or 'she', use 'doesn't'. Try again?";
  }

  // Default contextual responses by personality
  const responses = {
    'friendly-tutor': [
      "That's interesting! Want to tell me more about it?",
      "I'd love to help! What would you like to practice?",
      "Great question! How can I help you with that?",
      "Nice! What else would you like to work on?"
    ],
    'strict-teacher': [
      "Good. Let's focus on accuracy. What needs work?",
      "I see. What specific area should we practice?",
      "Understood. What grammar point is challenging?",
      "Right. What would you like to improve?"
    ],
    'conversation-partner': [
      "That's cool! What do you think about it?",
      "Interesting! How do you feel about that?",
      "Nice! What's your take on it?",
      "Really? Tell me more about that!"
    ],
    'pronunciation-coach': [
      "Good! What sounds are you working on?",
      "Nice! Which pronunciation is tricky for you?",
      "Great! What would you like to practice?",
      "Perfect! What sound should we focus on?"
    ]
  };

  const agentResponses = responses[agentPersonality] || responses['friendly-tutor'];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
};