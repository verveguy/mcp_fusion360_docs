/**
 * @fileoverview Secure Logging Utility
 * 
 * This module provides secure logging functions that sanitize sensitive data
 * to prevent information leakage in logs. All logging is done through this
 * utility to ensure consistent security practices.
 * 
 * SECURITY PRINCIPLES:
 * - Never log full request bodies or responses
 * - Sanitize error objects to remove stack traces and internal details
 * - Redact potentially sensitive parameters
 * - Limit data size in logs to prevent verbose output
 * - Use structured logging with controlled fields
 */

/** Environment variable to control logging level */
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/** Maximum length for logged strings to prevent verbose output */
const MAX_LOG_STRING_LENGTH = 100;

/** Maximum depth for object logging to prevent circular references */
const MAX_LOG_OBJECT_DEPTH = 2;

/**
 * Type for any value that might be logged
 */
type LoggableValue = string | number | boolean | null | undefined | object | unknown[];

/**
 * Type for sanitized log data
 */
type SanitizedData = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

/**
 * Log levels in order of severity
 */
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * Fields that should be redacted from any logged data
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'key',
  'secret',
  'auth',
  'authorization',
  'cookie',
  'session',
  'credentials',
  'apikey',
  'api_key'
] as const;

/**
 * Sanitizes a string by truncating it and removing potential sensitive content
 * 
 * @param str - String to sanitize
 * @param maxLength - Maximum allowed length (default: MAX_LOG_STRING_LENGTH)
 * @returns Sanitized string
 */
function sanitizeString(str: string, maxLength: number = MAX_LOG_STRING_LENGTH): string {
  if (!str) return '';
  
  // Truncate if too long
  let sanitized = str.length > maxLength ? str.substring(0, maxLength) + '...[truncated]' : str;
  
  // Remove potentially sensitive patterns (basic sanitization)
  sanitized = sanitized.replace(/[A-Za-z0-9+/]{20,}/g, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/sk-[A-Za-z0-9]{20,}/g, '[REDACTED_API_KEY]');
  
  return sanitized;
}

/**
 * Sanitizes an object by removing sensitive fields and limiting depth
 * 
 * @param obj - Object to sanitize
 * @param depth - Current depth (used internally for recursion)
 * @returns Sanitized object
 */
function sanitizeObject(obj: LoggableValue, depth: number = 0): SanitizedData {
  if (depth > MAX_LOG_OBJECT_DEPTH) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 5).map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      
      // Redact sensitive fields
      if (SENSITIVE_FIELDS.some(field => keyLower.includes(field))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize the value
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
    
    return sanitized;
  }

  return String(obj);
}

/**
 * Sanitizes an error object to prevent stack trace leakage
 * 
 * @param error - Error object to sanitize
 * @returns Sanitized error information
 */
function sanitizeError(unknown: LoggableValue): Record<string, unknown> | null {
  if (!unknown) return null;

  // For Error objects, only log safe information
  if (unknown instanceof Error) {
    return {
      name: unknown.name,
      message: sanitizeString(unknown.message),
      // Never log the stack trace - security risk
      type: 'Error'
    };
  }

  // For unknown error types, sanitize as object
  return sanitizeObject(unknown) as Record<string, unknown>;
}

/**
 * Checks if the current log level allows the specified level
 * 
 * @param level - Log level to check
 * @returns True if logging is allowed
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = LOG_LEVEL === 'debug' ? LogLevel.DEBUG :
                      LOG_LEVEL === 'info' ? LogLevel.INFO :
                      LOG_LEVEL === 'warn' ? LogLevel.WARN :
                      LogLevel.ERROR;
  
  return level <= currentLevel;
}

/**
 * Secure logging for informational messages
 * 
 * @param message - Log message
 * @param data - Optional data to log (will be sanitized)
 */
export function logInfo(message: string, data?: LoggableValue): void {
  if (!shouldLog(LogLevel.INFO)) return;
  
  const sanitizedMessage = sanitizeString(message);
  
  if (data) {
    const sanitizedData = sanitizeObject(data);
    console.log(`[INFO] ${sanitizedMessage}`, sanitizedData);
  } else {
    console.log(`[INFO] ${sanitizedMessage}`);
  }
}

/**
 * Secure logging for warning messages
 * 
 * @param message - Log message
 * @param data - Optional data to log (will be sanitized)
 */
export function logWarn(message: string, data?: LoggableValue): void {
  if (!shouldLog(LogLevel.WARN)) return;
  
  const sanitizedMessage = sanitizeString(message);
  
  if (data) {
    const sanitizedData = sanitizeObject(data);
    console.warn(`[WARN] ${sanitizedMessage}`, sanitizedData);
  } else {
    console.warn(`[WARN] ${sanitizedMessage}`);
  }
}

/**
 * Secure logging for error messages
 * 
 * @param message - Log message
 * @param error - Error object (will be sanitized to remove stack traces)
 */
export function logError(message: string, error?: LoggableValue): void {
  if (!shouldLog(LogLevel.ERROR)) return;
  
  const sanitizedMessage = sanitizeString(message);
  
  if (error) {
    const sanitizedError = sanitizeError(error);
    console.error(`[ERROR] ${sanitizedMessage}`, sanitizedError);
  } else {
    console.error(`[ERROR] ${sanitizedMessage}`);
  }
}

/**
 * Secure logging for debug messages (only in development)
 * 
 * @param message - Log message
 * @param data - Optional data to log (will be sanitized)
 */
export function logDebug(message: string, data?: LoggableValue): void {
  if (!shouldLog(LogLevel.DEBUG)) return;
  
  const sanitizedMessage = sanitizeString(message);
  
  if (data) {
    const sanitizedData = sanitizeObject(data);
    console.log(`[DEBUG] ${sanitizedMessage}`, sanitizedData);
  } else {
    console.log(`[DEBUG] ${sanitizedMessage}`);
  }
}

/**
 * Logs MCP request information with proper sanitization
 * 
 * @param method - MCP method name
 * @param id - Request ID
 * @param hasParams - Whether the request has parameters (don't log actual params)
 */
export function logMcpRequest(method: string, id: string | number | null, hasParams: boolean): void {
  logInfo('MCP Request received', {
    method: sanitizeString(method),
    id: id,
    hasParams: hasParams
  });
}

/**
 * Logs tool execution without logging arguments
 * 
 * @param toolName - Name of the tool being executed
 */
export function logToolExecution(toolName: string): void {
  logInfo('Executing MCP tool', {
    tool: sanitizeString(toolName)
  });
}

/**
 * Logs operation success without sensitive details
 * 
 * @param operation - Name of the operation
 * @param summary - Brief summary (will be sanitized)
 */
export function logOperationSuccess(operation: string, summary?: string): void {
  logInfo('Operation completed successfully', {
    operation: sanitizeString(operation),
    summary: summary ? sanitizeString(summary, 50) : undefined
  });
}

/**
 * Logs operation failure with sanitized error information
 * 
 * @param operation - Name of the operation
 * @param error - Error that occurred (will be sanitized)
 */
export function logOperationError(operation: string, error: LoggableValue): void {
  logError(`Operation failed: ${operation}`, error);
}

/**
 * Security configuration for the secure logger
 */
export const SECURE_LOGGER_CONFIG = {
  MAX_STRING_LENGTH: MAX_LOG_STRING_LENGTH,
  MAX_OBJECT_DEPTH: MAX_LOG_OBJECT_DEPTH,
  SENSITIVE_FIELDS: SENSITIVE_FIELDS,
  CURRENT_LOG_LEVEL: LOG_LEVEL,
  
  /** Warning message about secure logging */
  SECURITY_NOTICE: 'All logs are sanitized to prevent sensitive data leakage. Stack traces and full request bodies are never logged.'
} as const; 