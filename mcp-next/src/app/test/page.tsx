/**
 * @fileoverview MCP Test Page
 * 
 * This page provides a simple interface for testing the MCP server functionality
 * directly in the browser. Users can see server information and test basic connectivity.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServerInfo {
  name: string;
  version: string;
  description: string;
  capabilities: {
    tools: number;
  };
}

export default function McpTestPage() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration strings to avoid JSX quote escaping issues
  const cursorConfig = `{
  "mcpServers": {
    "fusion360": {
      "url": "http://localhost:3000/mcp"
    }
  }
}`;

  const curlExample = `curl -X POST http://localhost:3000/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'`;

  useEffect(() => {
    // Test the MCP server by fetching basic info
    fetch('/mcp', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setServerInfo(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const testJsonRpcCall = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('MCP Response:', data);
      alert(`Success! Found ${data.result?.tools?.length || 0} available tools. Check console for details.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">MCP Server Test</h1>
          <p className="mt-2 text-gray-600">
            Test the Fusion 360 API Documentation MCP Server functionality
          </p>
        </div>

        {/* Server Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Server Status</h2>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Testing connection...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Connection Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {serverInfo && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <h3 className="text-sm font-medium text-green-800">Server Online</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-600">{serverInfo.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Version:</span>
                  <span className="ml-2 text-gray-600">{serverInfo.version}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Description:</span>
                  <span className="ml-2 text-gray-600">{serverInfo.description}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Available Tools:</span>
                  <span className="ml-2 text-gray-600">{serverInfo.capabilities.tools}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test MCP Functionality</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to test a JSON-RPC call to list available tools:
          </p>
          <button
            onClick={testJsonRpcCall}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing...
              </>
            ) : (
              'Test tools/list Call'
            )}
          </button>
        </div>

        {/* Integration Examples */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Examples</h2>
          
          <div className="space-y-6">
            {/* Cursor Integration */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Cursor MCP Client</h3>
              <p className="text-gray-600 mb-3">
                Add this to your Cursor MCP settings to use this server:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{cursorConfig}</code>
                </pre>
              </div>
            </div>

            {/* cURL Example */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Direct cURL Test</h3>
              <p className="text-gray-600 mb-3">
                Test the server directly with cURL:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{curlExample}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 