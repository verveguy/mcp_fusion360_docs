#!/bin/bash

# Fusion 360 API Documentation MCP Server Startup Script

echo "🚀 Starting Fusion 360 API Documentation MCP Server..."

# Change to project directory
cd "$(dirname "$0")"

# Activate virtual environment
source .venv/bin/activate

# Start the server
PORT=8000 uv run fusion360_docs_server_web.py

echo "🛑 MCP Server stopped." 