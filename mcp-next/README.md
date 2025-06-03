# Fusion 360 API Documentation MCP Server (TypeScript/NextJS)

A comprehensive TypeScript/NextJS implementation of an MCP (Model Context Protocol) server that provides intelligent access to Autodesk Fusion 360 API documentation. This server enables AI assistants like Claude to search, analyze, and retrieve detailed information from the vast Fusion 360 API documentation.

## 🔒 Security Notice

**IMPORTANT: This server is configured for localhost-only access for security reasons.**

The MCP server restricts CORS (Cross-Origin Resource Sharing) to localhost origins only (`http://localhost:3000` by default). This prevents unauthorized external websites from accessing the API documentation endpoints, ensuring that only trusted local applications can interact with the server.

### Security Features

- **Localhost-only CORS**: Only `localhost` and `127.0.0.1` origins are permitted
- **Port restrictions**: Limited to development ports (3000-3999 range)
- **No wildcard origins**: Explicitly prevents `Access-Control-Allow-Origin: *`
- **Request validation**: All MCP requests are validated before processing
- **Error handling**: Secure error messages that don't leak internal information

### Modifying CORS Settings

If you need to allow additional origins (NOT recommended for production):

1. Edit `src/app/mcp/route.ts`
2. Modify the `getAllowedOrigin()` function
3. **Understand the security implications** before making changes
4. Consider implementing authentication if allowing external origins

```typescript
// Example: Adding a specific external origin (USE WITH CAUTION)
function getAllowedOrigin(): string {
  // Only add external origins if absolutely necessary and trusted
  const trustedOrigins = [
    'http://127.0.0.1:3000',
    'https://yourtrusted.domain.com' // Add only if necessary
  ];
  return trustedOrigins[0]; // Implement proper origin checking logic
}
```

## 🚀 Features

- **Intelligent Documentation Search**: Search through 14,000+ API entries with semantic matching
- **Class Analysis**: Retrieve detailed information about specific API classes including methods, properties, and code examples
- **Specialized Analysis**: Dedicated tools for analyzing specific components like Arrange3DDefinition
- **Multiple Server Modes**: Support for both stdio (Claude Desktop) and HTTP (web clients) protocols
- **Smart Caching**: Intelligent caching system to minimize network requests and improve performance
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions
- **Modern Architecture**: Built with NextJS 15, React 19, and modern ES modules

## 🛠️ Installation

### Prerequisites

- Node.js >= 18.0.0
- pnpm

### Quick Start

```bash
# Clone the repository
git clone git@git.autodesk.com:adamb1/mcp_fusion_360_api.git
cd mcp_fusion_360_api
cd mcp-next

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Test the server
pnpm test
```

### Development Setup

```bash
# Start development server
pnpm run dev

# Run tests in watch mode
pnpm run test:watch

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```

## 📖 API Documentation

### Available MCP Tools

#### 1. `mcp_fusion360_get_toctree_info`
Retrieves an overview of the Fusion 360 API documentation structure.

**Parameters**: None (dummy parameter required by MCP)

**Returns**: Formatted markdown with categorized documentation overview

#### 2. `mcp_fusion360_search_api_documentation`
Searches the API documentation for specific topics.

**Parameters**:
- `query` (string): Search term (class name, method name, or topic)
- `max_results` (integer, optional): Maximum results to return (default: 5)

**Returns**: Formatted markdown with search results

#### 3. `mcp_fusion360_get_api_class_info`
Retrieves detailed information about a specific API class.

**Parameters**:
- `class_name` (string): Name of the class to analyze (e.g., "ExtrudeFeature", "Sketch")

**Returns**: Detailed class information including methods, properties, and code examples

#### 4. `mcp_fusion360_analyze_arrange3d_definition`
Specialized analysis of the Arrange3DDefinition object.

**Parameters**: None (dummy parameter required by MCP)

**Returns**: Detailed analysis of Arrange3DDefinition and related components

#### 5. `mcp_fusion360_health_check`
Health check endpoint for monitoring service status.

**Parameters**: None (dummy parameter required by MCP)

**Returns**: Service health status and statistics

## 🔧 Usage

### As MCP Server via stdio (Claude Desktop)

⚠️ **Note**: Claude Desktop uses stdio communication, so CORS restrictions don't apply to this mode.

1. Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "fusion360docs": {
      "command": "node",
      "args": ["path/to/mcp_fusion_360_api/dist/bin/fusion360-docs-server.js"]
    }
  }
}
```

2. Restart Claude Desktop

3. Use the tools in your conversations:
```
Search for documentation about "Sketch" class
Get information about the Fusion 360 API structure
Analyze the ExtrudeFeature class
```

### As HTTP Server (Web Clients)

⚠️ **Security**: HTTP mode is restricted to localhost origins only.

1. Start the NextJS server:
```bash
pnpm run start
```

2. Access the MCP endpoint at `http://127.0.0.1:3000/mcp`

3. Use with MCP Inspector or other HTTP-based MCP clients running on localhost

**Important**: Ensure your MCP client is running on localhost (127.0.0.1 or localhost domain) to successfully connect. External clients will be blocked by CORS policy.

### Direct API Usage

```typescript
import { Fusion360Service } from '@autodesk/fusion360-docs-mcp-server';

const service = new Fusion360Service();

// Get documentation overview
const overview = await service.getTocTreeInfo();

// Search for specific topics
const searchResults = await service.searchApiDocumentation('Sketch', 10);

// Get detailed class information
const classInfo = await service.getApiClassInfo('ExtrudeFeature');

// Health check
const status = await service.healthCheck();
```

## 🏗️ Architecture

### Security Architecture

The server implements a defense-in-depth security approach:

1. **Network Level**: CORS restrictions limit origin access
2. **Application Level**: Input validation and sanitization
3. **Protocol Level**: MCP standard compliance and error handling
4. **Transport Level**: Support for both secure stdio and HTTP protocols

### Core Components

- **`Fusion360Service`**: Main service class handling all documentation operations
- **`fetchWithRetry`**: Robust HTTP client with exponential backoff retry logic
- **`parseApiDocumentation`**: HTML parser extracting structured API information
- **Caching System**: Node-cache based intelligent caching for performance
- **MCP Server**: Full MCP protocol implementation for stdio communication
- **HTTP Server**: NextJS API routes for web-based MCP clients

### Data Flow

1. **Documentation Loading**: Fetches toctree.json from Autodesk's servers
2. **API Entry Extraction**: Parses hierarchical documentation structure
3. **Content Processing**: Downloads and analyzes individual documentation pages
4. **Intelligent Caching**: Stores processed results for performance
5. **Response Formatting**: Returns structured markdown responses

## 🧪 Testing

### Security Testing

The test suite includes security-focused tests:

```bash
# Test CORS restrictions
pnpm run test:security

# Test with different origins (should fail)
curl -H "Origin: https://malicious.example.com" http://localhost:3000/mcp

# Test localhost access (should succeed)
curl -H "Origin: http://localhost:3000" http://localhost:3000/mcp
```

### Automated Tests

```bash
# Run all tests
pnpm test

# Test stdio server mode
pnpm run test:stdio

# Run tests in watch mode
pnpm run test:watch
```

### Manual Testing

The test suite validates:
- Documentation structure loading
- Search functionality across 14,000+ entries
- Class information extraction and analysis
- Arrange3D specialized analysis
- Error handling and edge cases

### Test Coverage

- ✅ Documentation tree loading and parsing
- ✅ API entry extraction (14,731 entries)
- ✅ Search functionality with various queries
- ✅ Class information retrieval
- ✅ HTML content parsing and analysis
- ✅ Caching system performance
- ✅ Error handling and recovery

## �� Configuration

### Security Configuration

The server's security settings are configured in `src/app/mcp/route.ts`:

```typescript
// CORS Configuration
const ALLOWED_ORIGINS = ['http://localhost:3000']; // Modify with caution

// Cache settings (prevents repeated external requests)
export const CACHE_CONFIG = {
  stdTTL: 600,      // 10 minutes default TTL
  checkperiod: 60,  // Check for expired items every minute
} as const;
```

### Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: HTTP server port (default: 3000)
- `CACHE_TTL`: Cache time-to-live in seconds (default: 600)
- `CORS_ORIGIN`: Override default CORS origin (use with caution)

### Cache Configuration

```typescript
export const CACHE_CONFIG = {
  stdTTL: 600,      // 10 minutes default TTL
  checkperiod: 60,  // Check for expired items every minute
} as const;
```

### Fetch Configuration

```typescript
export const FETCH_CONFIG = {
  maxRetries: 3,    // Maximum retry attempts
  timeout: 30000,   // 30 second timeout
  retryDelay: 1000, // Base retry delay
} as const;
```

## 📚 API Reference

### Type Definitions

#### `TocTreeNode`
Represents a node in the documentation table of contents.

```typescript
interface TocTreeNode {
  ttl?: string;      // Title/label
  ln?: string;       // Link/URL path
  id?: string;       // Unique identifier
  children?: TocTreeNode[];
}
```

#### `ApiEntry`
Represents an extracted API documentation entry.

```typescript
interface ApiEntry {
  title: string;     // Display title
  url: string;       // Full URL
  link: string;      // Relative path
  id: string;        // Unique identifier
  path: string;      // Hierarchical path
}
```

#### `ParsedApiDoc`
Processed API documentation content.

```typescript
interface ParsedApiDoc {
  title: string;           // Page title
  url: string;             // Source URL
  content: string;         // Truncated content preview
  full_content: string;    // Complete content
  code_examples: string[]; // Code snippets
  classes: string[];       // Identified classes
  methods: string[];       // Identified methods
  properties: string[];    // Identified properties
  content_length: number;  // Content size
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper documentation
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow JSDoc documentation standards
- Include comprehensive error handling
- Add unit tests for new functionality
- Follow the existing code patterns and architecture

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Python implementation compatibility
- Autodesk Fusion 360 API documentation team
- Model Context Protocol (MCP) specification
- NextJS and React communities

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/autodesk/mcp_fusion_360_api/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/autodesk/mcp_fusion_360_api/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/autodesk/mcp_fusion_360_api/wiki)

---

*Built with ❤️ by the Autodesk Tech Docs Team*

## 🛡️ Security Best Practices

When deploying or modifying this server:

1. **Never use wildcard CORS** (`Access-Control-Allow-Origin: *`) in production
2. **Validate all inputs** before processing MCP requests
3. **Use HTTPS** when deploying outside localhost
4. **Implement authentication** for any external access
5. **Monitor access logs** for suspicious activity
6. **Keep dependencies updated** to prevent security vulnerabilities
7. **Use environment variables** for sensitive configuration

### Common Security Pitfalls to Avoid

❌ **Don't do this**:
```typescript
// SECURITY RISK: Allows any website to access your MCP server
response.headers.set('Access-Control-Allow-Origin', '*');
```

✅ **Do this instead**:
```typescript
// SECURE: Only allow trusted localhost origins
response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
```

When contributing security-related changes:

1. **Security review required** for any CORS or authentication changes
2. **Document security implications** in pull request descriptions
3. **Test with multiple origins** to ensure restrictions work properly
4. **Follow principle of least privilege** when adding new features
