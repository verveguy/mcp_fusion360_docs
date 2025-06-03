/**
 * Base URL for the Autodesk Help documentation website.
 * All relative URLs from the toctree are resolved against this base.
 */
export const BASE_URL = "https://help.autodesk.com";

/**
 * URL endpoint for the Fusion 360 documentation table of contents JSON.
 * This endpoint provides the complete structure of the documentation hierarchy.
 */
export const TOCTREE_URL = "https://help.autodesk.com/view/fusion360/ENU/data/toctree.json";

/**
 * User-Agent string sent with HTTP requests to identify this MCP server.
 * Helps with server logs and potential rate limiting identification.
 */
export const USER_AGENT = "fusion360-docs-mcp/1.0";

/**
 * Configuration settings for HTTP fetch operations.
 * Controls retry behavior, timeouts, and backoff strategies.
 */
export const FETCH_CONFIG = {
  /** Maximum number of retry attempts for failed HTTP requests */
  maxRetries: 3,
  /** Request timeout in milliseconds (30 seconds) */
  timeout: 30000,
  /** Base delay in milliseconds between retry attempts */
  retryDelay: 1000,
} as const;

/**
 * Configuration settings for the in-memory cache.
 * Uses node-cache for storing parsed documentation and toctree data.
 */
export const CACHE_CONFIG = {
  /** Standard time-to-live in seconds (10 minutes) */
  stdTTL: 600,
  /** Check period for expired items in seconds (1 minute) */
  checkperiod: 60,
} as const;

/**
 * Keywords used to identify API-related content in documentation titles.
 * These indicators help filter relevant documentation from the full toctree.
 */
export const API_INDICATORS = [
  "API", "Class", "Method", "Property", "Function", "Object", 
  "Definition", "Interface", "Reference", "Programming"
] as const;

/**
 * Regular expression patterns for extracting class names from documentation content.
 * Each pattern targets different formats of class declarations and references.
 */
export const CLASS_PATTERNS = [
  /** Matches "class ClassName" declarations */
  /class\s+(\w+)/gi,
  /** Matches "ClassName class" references */
  /(\w+)\s+class/gi,
  /** Matches "ClassName object" references */
  /(\w+)\s+object/gi,
  /** Matches "ClassName interface" references */
  /(\w+)\s+interface/gi
] as const;

/**
 * Regular expression patterns for extracting method names from documentation content.
 * Covers various method declaration and reference formats.
 */
export const METHOD_PATTERNS = [
  /** Matches "methodName(parameters)" declarations */
  /(\w+)\s*\([^)]*\)\s*[:-]/g,
  /** Matches Python-style "def methodName" declarations */
  /def\s+(\w+)/g,
  /** Matches JavaScript-style "function methodName" declarations */
  /function\s+(\w+)/g,
  /** Matches "methodName method" references */
  /(\w+)\s+method/gi
] as const;

/**
 * Regular expression patterns for extracting property names from documentation content.
 * Identifies properties, attributes, and type annotations.
 */
export const PROPERTY_PATTERNS = [
  /** Matches "propertyName property" references */
  /(\w+)\s+property/gi,
  /** Matches "property propertyName" references */
  /property\s+(\w+)/gi,
  /** Matches "propertyName: type" type annotations */
  /(\w+)\s*:\s*\w+/g
] as const; 