/**
 * @fileoverview Main landing page for the Fusion 360 API Documentation MCP Server
 * 
 * This page provides an overview of the server capabilities, configuration instructions,
 * and direct access to test the MCP endpoint. Built with NextJS and Tailwind CSS.
 */

import Link from 'next/link';

export default function Home() {
  // Configuration strings for better JSX handling
  const cursorConfig = `{
  "mcpServers": {
    "fusion360": {
      "url": "http://localhost:3000/mcp"
    }
  }
}`;

  const claudeDesktopConfig = `{
  "mcpServers": {
    "fusion360-docs": {
      "command": "node",
      "args": ["path/to/mcp_fusion_360_api/dist/bin/fusion360-docs-server.js"]
    }
  }
}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Fusion 360 API Docs
          </h1>
          <h2 className="text-xl font-semibold text-indigo-600 mt-2">
            MCP Server (TypeScript/NextJS)
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Model Context Protocol server providing access to Autodesk Fusion 360 API documentation.
            Built with TypeScript, NextJS, and modern web technologies.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* MCP Endpoint Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">MCP Endpoint</h3>
            <p className="text-gray-600 mb-4">
              Use this endpoint with Cursor or other MCP clients:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto border">
              <code>http://localhost:3000/mcp</code>
            </div>
            <Link 
              href="/test" 
              className="inline-flex items-center mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
            >
              Test MCP endpoint →
            </Link>
          </div>

          {/* Available Tools Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Tools</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Get documentation structure
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Search API documentation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Get class information
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Analyze Arrange3D definitions
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Health check
              </li>
            </ul>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration for Cursor</h3>
          <p className="text-gray-600 mb-4">
            Add this configuration to your Cursor MCP settings:
          </p>
          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto border">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              <code>{cursorConfig}</code>
            </pre>
          </div>
        </div>

        {/* Claude Desktop Configuration */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration for Claude Desktop</h3>
          <p className="text-gray-600 mb-4">
            For stdio mode with Claude Desktop, use this configuration:
          </p>
          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto border">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              <code>{claudeDesktopConfig}</code>
            </pre>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Start</h3>
          <p className="text-gray-600 mb-4">
            Build and run the server:
          </p>
          <div className="space-y-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1"># Install dependencies and build</div>
              <code className="text-green-400 font-mono text-sm">
                pnpm install && pnpm run build
              </code>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1"># Start HTTP server (for web clients)</div>
              <code className="text-green-400 font-mono text-sm">
                pnpm run start
              </code>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
              <div className="text-gray-400 text-xs mb-1"># Test the server</div>
              <code className="text-green-400 font-mono text-sm">
                pnpm test
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-500 mb-2">
              <strong>TypeScript/NextJS implementation</strong> of the original Python MCP server
            </p>
            <p className="text-gray-400 text-sm">
              Both versions provide identical functionality for accessing Fusion 360 API documentation.
              <br />
              Built with ❤️ using TypeScript, NextJS, and the Model Context Protocol.
            </p>
            <div className="mt-4 flex justify-center space-x-4 text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                TypeScript
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                NextJS 15
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                MCP Protocol
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Fusion 360 API
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
