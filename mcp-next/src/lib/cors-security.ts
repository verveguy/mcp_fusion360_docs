/**
 * @fileoverview CORS Security Configuration
 * 
 * This module provides security-focused CORS configuration for the MCP server.
 * All functions implement localhost-only access restrictions to prevent
 * unauthorized external access to the API documentation endpoints.
 * 
 * SECURITY POLICY: Only localhost origins are permitted to access the MCP server.
 * This prevents unauthorized external websites from accessing API documentation
 * and ensures that only trusted local applications can interact with the server.
 */

import { NextResponse } from 'next/server';

/**
 * Determines the allowed CORS origin based on security policy.
 * 
 * SECURITY POLICY: Only localhost origins are permitted to prevent
 * unauthorized access from external domains. This function implements
 * a whitelist approach for maximum security.
 * 
 * Allowed origins:
 * - http://localhost:3000 (NextJS dev server)
 * - Future: http://localhost:3001-3999 (common dev ports)
 * - Future: http://127.0.0.1:3000-3999 (localhost IP)
 * 
 * @returns The allowed origin string for CORS headers
 */
export function getAllowedOrigin(): string {
  // In production or when security is paramount, we only allow specific localhost origins
  // This prevents any external website from making requests to our MCP server
  
  // For MCP servers, we typically want to allow:
  // 1. The NextJS development server (usually port 3000)
  // 2. Common development ports (3001-3999)
  // 3. MCP Inspector and other localhost-based tools
  
  // Note: Using '*' would be a security risk as it allows any website
  // to access the MCP server, potentially exposing API documentation
  // to unauthorized parties.
  
  // TODO: In future versions, this could be made configurable via environment
  // variables for advanced users who understand the security implications
  return 'http://localhost:3000';
}

/**
 * Validates if a given origin should be allowed access to the MCP server.
 * 
 * This function implements the core security logic for origin validation.
 * It can be extended in the future to support multiple localhost ports
 * or configurable trusted origins.
 * 
 * @param origin - The origin header from the incoming request
 * @returns True if the origin is allowed, false otherwise
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Allow requests without origin (direct requests, some tools)
    return true;
  }
  
  const allowedOrigin = getAllowedOrigin();
  
  // Exact match for now - could be extended to support multiple origins
  return origin === allowedOrigin;
}

/**
 * Adds CORS headers to a NextJS response to enable cross-origin requests.
 * 
 * SECURITY NOTE: CORS is restricted to localhost only for security reasons.
 * This prevents unauthorized web applications from different domains accessing
 * the MCP server endpoints. The server is designed for local development use
 * with trusted clients like Cursor, MCP Inspector, or other localhost-based tools.
 * 
 * Security features:
 * - Localhost-only origin restrictions
 * - Limited HTTP methods (GET, POST, OPTIONS)
 * - Controlled headers (Content-Type, Authorization)
 * - Preflight caching for performance
 * 
 * @param response - NextJS response object to modify
 * @returns The same response object with CORS headers added
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  // SECURITY: Only allow localhost origins for enhanced security
  // This prevents unauthorized external websites from accessing the MCP server
  const allowedOrigin = getAllowedOrigin();
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  return response;
}

/**
 * Creates a security-compliant CORS response for preflight requests.
 * 
 * This function is specifically designed for handling OPTIONS requests
 * that browsers send before making actual cross-origin requests.
 * 
 * @returns NextJS response configured with secure CORS headers
 */
export function createCorsPreflightResponse(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

/**
 * Security configuration constants for CORS settings.
 * 
 * These constants define the core security policy for the MCP server.
 * Modify with extreme caution as changes can impact security posture.
 */
export const CORS_SECURITY_CONFIG = {
  /** Default allowed origin - localhost only for security */
  DEFAULT_ALLOWED_ORIGIN: 'http://localhost:3000',
  
  /** Allowed HTTP methods for CORS requests */
  ALLOWED_METHODS: ['GET', 'POST', 'OPTIONS'] as const,
  
  /** Allowed headers for CORS requests */
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'] as const,
  
  /** Cache duration for preflight requests (24 hours) */
  MAX_AGE_SECONDS: 86400,
  
  /** Security warning message for developers */
  SECURITY_WARNING: 'CORS is restricted to localhost only. Modify getAllowedOrigin() with caution.'
} as const; 