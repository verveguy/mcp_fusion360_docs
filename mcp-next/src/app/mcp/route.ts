import { NextRequest, NextResponse } from 'next/server';
import { 
  JSONRPCRequest,
  ErrorCode,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Fusion360Service } from '@/lib/fusion360-service';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/cors-security';
import { 
  logMcpRequest, 
  logToolExecution, 
  logOperationSuccess, 
  logOperationError,
  logInfo,
  logError 
} from '@/lib/secure-logger';

/** Global service instance for handling documentation requests */
const fusion360Service = new Fusion360Service();

/**
 * JSON-RPC error response structure for MCP protocol compliance.
 * Used when requests fail or contain invalid parameters.
 */
interface JSONRPCErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: ErrorCode;
    message: string;
  };
}

/**
 * JSON-RPC success response structure for MCP protocol compliance.
 * Used for successful tool executions and other valid responses.
 */
interface JSONRPCSuccessResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result: unknown;
}

/** Union type for all possible JSON-RPC response formats */
type JSONRPCResponse = JSONRPCErrorResponse | JSONRPCSuccessResponse;

/**
 * Available MCP tools for the Fusion 360 API documentation server.
 * Each tool provides specific functionality for querying and analyzing
 * the Fusion 360 API documentation.
 */
const TOOLS: Tool[] = [
  {
    name: 'mcp_fusion360_get_toctree_info',
    description: 'Get information about the Fusion 360 API documentation structure.\n\nReturns overview of available documentation sections and API-related content.',
    inputSchema: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['random_string']
    }
  },
  {
    name: 'mcp_fusion360_search_api_documentation',
    description: 'Search the Fusion 360 API documentation for specific topics.\n\nArgs:\n    query: Search query (class name, method name, or topic)\n    max_results: Maximum number of results to return (default: 5)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant API documentation'
        },
        max_results: {
          type: 'integer',
          description: 'Maximum number of results to return',
          default: 5
        }
      },
      required: ['query']
    }
  },
  {
    name: 'mcp_fusion360_get_api_class_info',
    description: 'Get detailed information about a specific API class.\n\nArgs:\n    class_name: Name of the class to look up (e.g., "ExtrudeFeature", "Sketch")',
    inputSchema: {
      type: 'object',
      properties: {
        class_name: {
          type: 'string',
          description: 'Name of the class to analyze'
        }
      },
      required: ['class_name']
    }
  },
  {
    name: 'mcp_fusion360_analyze_arrange3d_definition',
    description: 'Specifically analyze the Arrange3DDefinition object in the Fusion 360 API.\n\nThis tool searches for and analyzes documentation related to the Arrange3DDefinition\nobject, its API, and functional role in the Fusion API.',
    inputSchema: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['random_string']
    }
  },
  {
    name: 'mcp_fusion360_health_check',
    description: 'Health check endpoint for monitoring the service.',
    inputSchema: {
      type: 'object',
      properties: {
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['random_string']
    }
  }
];

/**
 * Creates a standardized JSON-RPC error response.
 * 
 * @param id - Request ID from the original JSON-RPC request
 * @param code - MCP error code indicating the type of error
 * @param message - Human-readable error description
 * @returns Formatted JSON-RPC error response
 */
function createErrorResponse(id: string | number | null, code: ErrorCode, message: string): JSONRPCErrorResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  };
}

/**
 * Creates a standardized JSON-RPC success response.
 * 
 * @param id - Request ID from the original JSON-RPC request
 * @param result - The successful result data to return
 * @returns Formatted JSON-RPC success response
 */
function createSuccessResponse(id: string | number | null, result: unknown): JSONRPCSuccessResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Processes a single MCP JSON-RPC request and routes it to the appropriate handler.
 * 
 * This function implements the core MCP protocol handling, including:
 * - Server initialization
 * - Tool listing
 * - Tool execution with parameter validation
 * - Error handling and logging
 * 
 * SECURITY NOTE: All logging is done through secure logger to prevent
 * sensitive data leakage. Request bodies and full error objects are never logged.
 * 
 * @param request - The JSON-RPC request object to process
 * @returns Promise resolving to a JSON-RPC response
 */
async function handleMcpRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
  const { method, params, id } = request;
  
  // SECURITY: Log request info without exposing sensitive parameters
  logMcpRequest(method, id, params !== undefined && params !== null);

  try {
    switch (method) {
      case 'initialize': {
        // SECURITY: Don't log full params as they might contain sensitive client info
        logInfo('Handling initialize request');
        const result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'fusion360-docs',
            version: '0.1.0',
          },
        };
        logOperationSuccess('initialize');
        return createSuccessResponse(id, result);
      }

      case 'tools/list': {
        logInfo('Handling tools/list request');
        logOperationSuccess('tools/list', `${TOOLS.length} tools available`);
        return createSuccessResponse(id, {
          tools: TOOLS,
        });
      }

      case 'tools/call': {
        if (!params || !('name' in params)) {
          logError('Tool call missing required name parameter');
          return createErrorResponse(id, ErrorCode.InvalidParams, 'Missing tool name');
        }

        const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };
        
        // SECURITY: Log tool execution without exposing arguments (they might contain sensitive search terms)
        logToolExecution(name);

        switch (name) {
          case 'mcp_fusion360_get_toctree_info': {
            const result = await fusion360Service.getTocTreeInfo();
            logOperationSuccess('get_toctree_info', 'Documentation structure retrieved');
            return createSuccessResponse(id, {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            });
          }

          case 'mcp_fusion360_search_api_documentation': {
            if (!args || typeof args !== 'object' || !('query' in args)) {
              logError('Search API documentation missing required query parameter');
              return createErrorResponse(id, ErrorCode.InvalidParams, 'Missing required parameter: query');
            }
            
            const query = args.query as string;
            const maxResults = (args.max_results as number) || 5;
            
            const result = await fusion360Service.searchApiDocumentation(query, maxResults);
            logOperationSuccess('search_api_documentation', 'Search completed');
            return createSuccessResponse(id, {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            });
          }

          case 'mcp_fusion360_get_api_class_info': {
            if (!args || typeof args !== 'object' || !('class_name' in args)) {
              logError('Get API class info missing required class_name parameter');
              return createErrorResponse(id, ErrorCode.InvalidParams, 'Missing required parameter: class_name');
            }
            
            const className = args.class_name as string;
            const result = await fusion360Service.getApiClassInfo(className);
            logOperationSuccess('get_api_class_info', 'Class information retrieved');
            return createSuccessResponse(id, {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            });
          }

          case 'mcp_fusion360_analyze_arrange3d_definition': {
            const result = await fusion360Service.analyzeArrange3dDefinition();
            logOperationSuccess('analyze_arrange3d_definition', 'Analysis completed');
            return createSuccessResponse(id, {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            });
          }

          case 'mcp_fusion360_health_check': {
            const result = await fusion360Service.healthCheck();
            logOperationSuccess('health_check', 'Health check completed');
            return createSuccessResponse(id, {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            });
          }

          default:
            logError(`Unknown tool requested: ${name}`);
            return createErrorResponse(id, ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      }

      default:
        logError(`Unknown MCP method: ${method}`);
        return createErrorResponse(id, ErrorCode.MethodNotFound, `Unknown method: ${method}`);
    }
  } catch (error) {
    // SECURITY: Log error without exposing stack trace or internal details
    logOperationError('handleMcpRequest', error as Error);
    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handles CORS preflight OPTIONS requests.
 * 
 * SECURITY: This endpoint enforces localhost-only CORS policy.
 * Only requests from localhost origins (http://localhost:3000) are permitted.
 * This prevents unauthorized external websites from discovering or accessing
 * the MCP server endpoints through browser-based attacks.
 * 
 * @returns NextJS response with appropriate CORS headers
 */
export async function OPTIONS() {
  return createCorsPreflightResponse();
}

/**
 * Handles POST requests containing MCP JSON-RPC messages.
 * 
 * SECURITY: This endpoint is protected by localhost-only CORS policy.
 * External websites cannot make requests to this endpoint due to browser
 * same-origin policy enforcement. Only localhost-based MCP clients
 * (like MCP Inspector, Cursor, or other local tools) can access this endpoint.
 * 
 * This endpoint serves as the HTTP transport for the MCP protocol,
 * allowing web-based clients to communicate with the Fusion 360 
 * documentation server in a secure manner.
 * 
 * Supports both single requests and batch request arrays as per
 * the JSON-RPC specification.
 * 
 * SECURITY NOTE: Request bodies and responses are never logged in full
 * to prevent sensitive data leakage. Only sanitized metadata is logged.
 * 
 * @param request - NextJS request object containing the JSON-RPC payload
 * @returns NextJS response with the MCP result or error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // SECURITY: Never log full request body - could contain sensitive data
    // Only log safe metadata about the request structure
    const isBatch = Array.isArray(body);
    const requestCount = isBatch ? body.length : 1;
    logInfo('Received POST request', { 
      type: isBatch ? 'batch' : 'single',
      requestCount: requestCount 
    });
    
    // Handle both single requests and batch requests
    if (isBatch) {
      const responses = await Promise.all(
        body.map((req: JSONRPCRequest) => handleMcpRequest(req))
      );
      const response = NextResponse.json(responses);
      logOperationSuccess('POST batch request', `${responses.length} requests processed`);
      return addCorsHeaders(response);
    } else {
      const mcpResponse = await handleMcpRequest(body as JSONRPCRequest);
      // SECURITY: Never log full response - could contain sensitive API documentation
      logOperationSuccess('POST single request', 'Request processed');
      const response = NextResponse.json(mcpResponse);
      return addCorsHeaders(response);
    }
  } catch (error) {
    // SECURITY: Log error without exposing request details or stack trace
    logOperationError('POST request processing', error as Error);
    const errorResponse = NextResponse.json(
      createErrorResponse(null, ErrorCode.ParseError, 'Invalid JSON-RPC request'),
      { status: 400 }
    );
    return addCorsHeaders(errorResponse);
  }
}

/**
 * Handles GET requests to provide server information and capabilities.
 * 
 * SECURITY: This endpoint is protected by localhost-only CORS policy.
 * While this endpoint provides non-sensitive server metadata, access
 * is still restricted to localhost origins to prevent information
 * disclosure to unauthorized parties.
 * 
 * This endpoint allows clients to discover the server's capabilities
 * and basic information without initiating a full MCP session.
 * Useful for health checks and service discovery by trusted local clients.
 * 
 * @returns NextJS response with server metadata
 */
export async function GET() {
  const response = NextResponse.json({
    name: 'fusion360-docs',
    version: '0.1.0',
    description: 'Fusion 360 API Documentation MCP Server',
    capabilities: {
      tools: TOOLS.length,
    },
  });
  return addCorsHeaders(response);
}