/**
 * Clean API handler for LanguagePeer without AWS SDK dependencies
 * Provides basic routing and CORS support for development/testing environments
 */

/**
 * AWS API Gateway Lambda proxy integration event structure
 * Contains HTTP request information passed from API Gateway to Lambda
 */
interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: { [name: string]: string };
  queryStringParameters: { [name: string]: string } | null;
}

/**
 * AWS API Gateway Lambda proxy integration response structure
 * Defines the format Lambda must return for API Gateway to process
 */
interface APIGatewayProxyResult {
  statusCode: number;
  headers: { [name: string]: string };
  body: string;
}

// HTTP status codes used throughout the handler
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * CORS headers configuration for cross-origin requests
 * Allows all origins (*) for development - should be restricted in production
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
} as const;

/**
 * Main Lambda handler for LanguagePeer API requests
 * 
 * This is a simplified handler that provides basic routing without AWS SDK dependencies.
 * It serves as a development/testing endpoint while full AWS integration is being implemented.
 * 
 * @param event - API Gateway proxy event containing HTTP request details
 * @returns Promise<APIGatewayProxyResult> - HTTP response with status, headers, and body
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('API Handler - Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight requests (OPTIONS method)
  // Browsers send OPTIONS requests before actual requests to check CORS permissions
  if (event.httpMethod === 'OPTIONS') {
    return createSuccessResponse('', HTTP_STATUS.OK);
  }

  try {
    const requestPath = event.path;
    const requestMethod = event.httpMethod;

    // Route requests using pattern matching approach
    // This allows for clean, readable routing logic without complex if-else chains
    switch (true) {
      case requestPath === '/health' && requestMethod === 'GET':
        return handleHealthCheck();

      case requestPath === '/synthesize' && requestMethod === 'POST':
        return await handleTextToSpeechRequest(event.body);

      default:
        return createErrorResponse('Not Found', HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    console.error('API Handler Error:', error);
    return createErrorResponse(
      'Internal Server Error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};

/**
 * Handles health check requests for API monitoring and load balancer health checks
 * 
 * @returns APIGatewayProxyResult with health status information
 */
function handleHealthCheck(): APIGatewayProxyResult {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'LanguagePeer API Handler'
  };

  return createSuccessResponse(JSON.stringify(healthData));
}

/**
 * Handles text-to-speech synthesis requests
 * 
 * Currently returns a fallback response that triggers browser-based TTS
 * while AWS Polly integration is being implemented.
 * 
 * @param requestBody - Raw request body string from API Gateway
 * @returns Promise<APIGatewayProxyResult> with TTS response or error
 */
async function handleTextToSpeechRequest(requestBody: string | null): Promise<APIGatewayProxyResult> {
  console.log('Text-to-speech request received:', requestBody);
  
  // Validate request body exists
  if (!requestBody) {
    return createErrorResponse('Request body is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Parse and validate JSON request data
  let parsedRequestData: any;
  try {
    parsedRequestData = JSON.parse(requestBody);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    return createErrorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  // Extract and validate required parameters
  const { text, voiceId } = parsedRequestData;
  if (!text || typeof text !== 'string') {
    return createErrorResponse('Text parameter is required and must be a string', HTTP_STATUS.BAD_REQUEST);
  }

  console.log('TTS Request processed:', { 
    textLength: text.length, 
    voiceId: voiceId || 'default',
    timestamp: new Date().toISOString()
  });

  // Return fallback response that triggers browser TTS
  // This approach allows the frontend to gracefully handle missing AWS Polly integration
  const fallbackResponse = {
    audioUrl: null, // Null URL signals frontend to use browser TTS fallback
    contentType: 'audio/mpeg',
    requestCharacters: text.length,
    voiceId: voiceId || 'default',
    message: 'Using browser TTS fallback - AWS Polly integration pending',
    fallbackMode: true
  };

  return createSuccessResponse(JSON.stringify(fallbackResponse));
}

/**
 * Creates a standardized success response with CORS headers
 * 
 * @param body - Response body content (should be JSON string for API responses)
 * @param statusCode - HTTP status code (defaults to 200)
 * @returns APIGatewayProxyResult formatted for API Gateway
 */
function createSuccessResponse(body: string, statusCode: number = HTTP_STATUS.OK): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body
  };
}

/**
 * Creates a standardized error response with CORS headers
 * 
 * @param error - Main error message
 * @param statusCode - HTTP status code
 * @param details - Optional additional error details
 * @returns APIGatewayProxyResult formatted for API Gateway
 */
function createErrorResponse(
  error: string, 
  statusCode: number, 
  details?: string
): APIGatewayProxyResult {
  const errorBody = {
    error,
    ...(details && { message: details }),
    timestamp: new Date().toISOString()
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(errorBody)
  };
}