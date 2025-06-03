import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Fusion360Service } from './fusion360-service.js';

/**
 * MCP Server instance configured for Fusion 360 API documentation access.
 * Provides tools for querying and analyzing Fusion 360 API documentation
 * through the Model Context Protocol.
 */
const server = new Server(
  {
    name: 'fusion360-docs',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/** Service instance for accessing Fusion 360 documentation */

/* Issue: Fusion360Service is instantiated as a global singleton in both the HTTP and stdio server contexts.

Risk: If the service ever needs to be stateless, or if multiple requests mutate shared state, this could cause subtle bugs (especially with caching).

Correction: Consider instantiating the service per request or ensuring all state is safely encapsulated and immutable per request.
*/

const fusion360Service = new Fusion360Service();

/**
 * Tool definitions for the MCP server.
 * Each tool provides a specific capability for interacting with
 * the Fusion 360 API documentation system.
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
 * Registers the tools/list handler to provide available tools to MCP clients.
 * This is called when clients want to discover what tools are available.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

/**
 * Registers the tools/call handler to execute tool requests from MCP clients.
 * Routes tool calls to the appropriate Fusion360Service methods and handles
 * error cases with proper MCP error responses.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'mcp_fusion360_get_toctree_info': {
        const result = await fusion360Service.getTocTreeInfo();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'mcp_fusion360_search_api_documentation': {
        if (!args || typeof args !== 'object' || !('query' in args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameter: query'
          );
        }
        
        const query = args.query as string;
        const maxResults = (args.max_results as number) || 5;
        
        const result = await fusion360Service.searchApiDocumentation(query, maxResults);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'mcp_fusion360_get_api_class_info': {
        if (!args || typeof args !== 'object' || !('class_name' in args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameter: class_name'
          );
        }
        
        const className = args.class_name as string;
        const result = await fusion360Service.getApiClassInfo(className);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'mcp_fusion360_analyze_arrange3d_definition': {
        const result = await fusion360Service.analyzeArrange3dDefinition();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'mcp_fusion360_health_check': {
        const result = await fusion360Service.healthCheck();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Starts the MCP server using stdio transport for communication.
 * 
 * This function initializes the server connection and begins listening
 * for MCP requests over standard input/output streams. This is the
 * standard mode for MCP servers used with Claude Desktop and similar
 * stdio-based clients.
 * 
 * @example
 * ```typescript
 * // Start the stdio MCP server
 * await runMcpServer();
 * ```
 */
export async function runMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fusion 360 API Documentation MCP server running on stdio');
}

/**
 * Export the service instance for direct testing without MCP protocol.
 * This allows for unit testing and direct API access when needed.
 */
export { fusion360Service }; 