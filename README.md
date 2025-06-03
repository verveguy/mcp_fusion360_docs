# About this project

This project is a Model Context Protocol (MCP) server that provides access to the Autodesk Fusion 360 API documentation. This server allows LLMs to query, search, and analyze the complete Fusion 360 API documentation directly. The MCP server is really just a simple tool wrapper around the [Fusion 360 API doc website](https://help.autodesk.com/view/fusion360/ENU/).

This app is a demonstration of using an MCP server to provide LLMs with access to current API documentation as an aid to developers building Autodesk product integrations. You see an example of such an app built by Cursor using this MCP server [here](https://git.autodesk.com/adamb1/fusion360_cylinder_app).

This MCP server itself was generated entirely by Cursor in about 30 minutes flat by someone that had never built an MCP server before.

You can run this endpoint locally. See instructions below. The endpoint is also deployable to Railway - a hosted Python environment. 

To configure Cursor yourself to use the public endpoint, the following Cursor MCP config suffices. You can find this under Cursor > Settings > MCP

```json
{
  "mcpServers": {
    "fusion360": {
      "url": "https://mcpfusion36docs-production.up.railway.app/mcp/"
    }
  }
}
```

# Fusion 360 API Documentation MCP Server


## Features

- 🔍 **Search API Documentation**: Find classes, methods, and properties by name or topic
- 📚 **Browse Documentation Structure**: Get an overview of all available API sections
- 🔎 **Detailed Class Analysis**: Deep dive into specific API classes with methods, properties, and examples
- 📖 **Content Caching**: Smart caching system for faster subsequent queries
- 🎯 **Specialized Arrange3D Analysis**: Dedicated tool for analyzing the Arrange3DDefinition object

## Installation

### Prerequisites

- Python 3.10 or higher
- `uv` package manager

### Setup

1. **Clone/Download** this project to your local machine

2. **Install uv** (if not already installed):
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Windows (PowerShell)
   powershell -c "irm https://astral.sh/uv/install.sh | iex"
   ```

3. **Navigate to the project directory**:
   ```bash
   cd fusion360-docs-mcp
   ```

4. **Create and activate virtual environment**:
   ```bash
   uv venv
   source .venv/bin/activate  # macOS/Linux
   # or
   .venv\Scripts\activate     # Windows
   ```

5. **Install dependencies**:
   ```bash
   uv add "mcp[cli]" httpx beautifulsoup4 lxml
   ```

## Usage

### Running the Server

To run the MCP server directly (in stdio mode, i.e., for Claud):

```bash
uv run fusion360_docs_server.py
```

To run a local web server hosting the MCP, on port 8000 (for Cursor):

```bash
uv run fusion360_docs_server_web.py
```

You can change the port using 

```bash
PORT=8080 uv run fusion360_docs_server_web.py
```

By default, the web server only binds to localhost. To serve on all network adapters:

```bash
HOST=0.0.0.0 uv run fusion360_docs_server_web.py
```

### Configure Cursor (or other tooling)
To configure Cursor yourself to use your local endpoint, the following Cursor MCP config suffices. You can find this under Cursor > Settings > MCP

```json
{
  "mcpServers": {
    "fusion360": {
      "url": "http://127.0.0.1:8000/mcp/"
    }
  }
}
```

(Claude Desktop configuration is a pain)

## Available Tools

### 1. `get_toctree_info()`
Get an overview of the Fusion 360 API documentation structure.

**Example usage in Claude Desktop:**
> "Show me the structure of the Fusion 360 API documentation"

### 2. `search_api_documentation(query, max_results=5)`
Search for specific topics in the API documentation.

**Parameters:**
- `query`: Search term (class name, method name, or topic)
- `max_results`: Maximum number of results (default: 5)

**Example usage:**
> "Search for 'extrude' in the Fusion 360 API"
> "Find documentation about sketches"

### 3. `get_api_class_info(class_name)`
Get detailed information about a specific API class.

**Parameters:**
- `class_name`: Name of the class to analyze

**Example usage:**
> "Get detailed information about the ExtrudeFeature class"
> "Tell me about the Sketch class in Fusion 360"

### 4. `analyze_arrange3d_definition()`
Specialized tool for analyzing the Arrange3DDefinition object.

**Example usage:**
> "Analyze the Arrange3DDefinition object in the Fusion 360 API"

## How It Works

1. **Documentation Fetching**: The server fetches the table of contents from Autodesk's official documentation site
2. **Content Parsing**: HTML pages are parsed to extract class information, methods, properties, and code examples
3. **Smart Caching**: Results are cached locally to improve performance on subsequent queries
4. **API Exposure**: Information is exposed through MCP tools that LLMs can call

## File Structure

```
fusion360-docs-mcp/
├── fusion360_docs_server.py    # Main MCP server
├── README.md                   # This file
├── pyproject.toml             # Project configuration
├── cache/                     # Local cache directory
│   ├── toctree.json          # Cached table of contents
│   └── docs/                 # Cached documentation pages
└── .venv/                    # Virtual environment
```

## Caching

The server implements a smart caching system:

- **Table of Contents**: Cached as `cache/toctree.json`
- **Documentation Pages**: Cached as JSON files in `cache/docs/`
- **Cache Benefits**: Faster subsequent queries, reduced API calls, offline capability

To clear the cache, simply delete the `cache/` directory.

## Troubleshooting

### Server Not Showing Up in Claude Desktop

1. Check that the path in `claude_desktop_config.json` is absolute and correct
2. Ensure the virtual environment is properly set up
3. Restart Claude Desktop completely
4. Check Claude's logs: `~/Library/Logs/Claude/mcp*.log` (macOS)

### Network Issues

If you encounter network errors:
- The server will retry failed requests automatically
- Check your internet connection
- Some corporate firewalls may block access to help.autodesk.com

### Performance

- First-time queries may be slow as content is fetched and cached
- Subsequent queries will be much faster due to caching
- Large documentation pages may take time to parse

## Examples

Once configured with Claude Desktop, you can ask questions like:

- "What's the structure of the Fusion 360 API documentation?"
- "Search for information about boolean operations in Fusion 360"
- "Tell me about the ExtrudeFeature class"
- "Find all documentation related to sketching"
- "Analyze the Arrange3DDefinition object"

## Development

To extend this server:

1. Add new tools by decorating functions with `@mcp.tool()`
2. Implement proper type hints and docstrings for automatic tool definition
3. Follow the existing pattern for error handling and caching
4. Test thoroughly with different queries

## License

This project is for educational and development purposes. The Fusion 360 API documentation belongs to Autodesk Inc. 
