import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { 
  TocTreeNode, 
  ApiEntry, 
  ParsedApiDoc, 
  FetchOptions 
} from '@/types/fusion360';
import { 
  BASE_URL, 
  USER_AGENT, 
  FETCH_CONFIG, 
  API_INDICATORS,
  CLASS_PATTERNS,
  METHOD_PATTERNS,
  PROPERTY_PATTERNS
} from './constants';

/**
 * Fetches content from a URL with automatic retry logic and exponential backoff.
 * 
 * This function implements robust error handling for network requests, including:
 * - Automatic retries with exponential backoff
 * - Proper User-Agent headers for identification
 * - Timeout protection
 * - Error logging for debugging
 * 
 * @param url - The URL to fetch content from
 * @param options - Optional configuration for retry behavior and timeout
 * @returns Promise resolving to the response content as a string, or null if all retries failed
 * 
 * @example
 * ```typescript
 * const content = await fetchWithRetry('https://example.com/api/data');
 * if (content) {
 *   console.log('Successfully fetched:', content.length, 'characters');
 * }
 * ```
 */
export async function fetchWithRetry(
  url: string, 
  options: FetchOptions = {}
): Promise<string | null> {
  const { maxRetries = FETCH_CONFIG.maxRetries, timeout = FETCH_CONFIG.timeout } = options;
  
  const config: AxiosRequestConfig = {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout,
    responseType: 'text' // Ensure we get text response
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, config);
      // Ensure we return a string
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`Failed to fetch ${url} after ${maxRetries} attempts:`, error);
        return null;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, FETCH_CONFIG.retryDelay * (attempt + 1)));
    }
  }
  return null;
}

/**
 * Recursively extracts API-related entries from the documentation table of contents tree.
 * 
 * This function traverses the hierarchical documentation structure and identifies
 * entries that appear to be API-related based on title keywords and URL patterns.
 * It builds a flat list of API entries with their hierarchical paths preserved.
 * 
 * @param node - A toctree node or array of nodes to process
 * @param path - Current hierarchical path (used for recursion, typically empty for initial call)
 * @returns Array of API entries found in the tree structure
 * 
 * @example
 * ```typescript
 * const apiEntries = extractApiEntries(tocTreeData.books);
 * console.log(`Found ${apiEntries.length} API entries`);
 * apiEntries.forEach(entry => {
 *   console.log(`${entry.title} at ${entry.path}`);
 * });
 * ```
 */
export function extractApiEntries(node: TocTreeNode | TocTreeNode[], path: string = ""): ApiEntry[] {
  const entries: ApiEntry[] = [];

  if (Array.isArray(node)) {
    for (const item of node) {
      entries.push(...extractApiEntries(item, path));
    }
  } else if (typeof node === 'object' && node !== null) {
    const title = node.ttl || "";
    const link = node.ln || "";
    const nodeId = node.id || "";

    // Check if this is an API-related entry
    const isApiRelated = API_INDICATORS.some(indicator => 
      title.includes(indicator) || title.toLowerCase().includes(indicator.toLowerCase())
    ) || (link && link.includes("Fusion-360-API"));

    if (isApiRelated && link) {
      const fullUrl = new URL(link, BASE_URL).toString();
      entries.push({
        title,
        url: fullUrl,
        link,
        id: nodeId,
        path
      });
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      const childPath = path ? `${path}/${title}` : title;
      for (const child of node.children) {
        entries.push(...extractApiEntries(child, childPath));
      }
    }
  }

  return entries;
}

/**
 * Parses HTML documentation content to extract structured API information.
 * 
 * This function processes raw HTML content from documentation pages and extracts:
 * - Page title and metadata
 * - Main text content with formatting normalized
 * - Code examples and snippets
 * - Class, method, and property names using regex patterns
 * - Content statistics and previews
 * 
 * The parsing is designed to handle various documentation formats and extract
 * meaningful API information that can be searched and analyzed.
 * 
 * @param htmlContent - Raw HTML content from a documentation page
 * @param url - The URL of the page being parsed (for reference)
 * @returns Structured object containing parsed API documentation data
 * 
 * @example
 * ```typescript
 * const htmlContent = await fetchWithRetry('https://help.autodesk.com/some-api-page');
 * if (htmlContent) {
 *   const parsed = parseApiDocumentation(htmlContent, 'https://help.autodesk.com/some-api-page');
 *   console.log(`Found ${parsed.methods.length} methods and ${parsed.classes.length} classes`);
 * }
 * ```
 */
export function parseApiDocumentation(htmlContent: string, url: string): ParsedApiDoc {
  const $ = cheerio.load(htmlContent);

  // Remove script and style elements to clean up content
  $('script, style').remove();

  // Extract title from various possible sources
  const titleElement = $('title').first();
  const h1Element = $('h1').first();
  const title = titleElement.length ? titleElement.text().trim() : 
                h1Element.length ? h1Element.text().trim() : "Unknown";

  // Find main content container using common selectors
  const contentSelectors = [
    'main', '.content', '#content', '.main-content', 
    '.documentation', '.api-doc', 'article'
  ];

  // Start with body as the default content container
  let contentToExtract = $('body').text();
  
  // Try to find a more specific content container
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length) {
      contentToExtract = element.text();
      break;
    }
  }

  // Extract and normalize text content
  const textContent = contentToExtract.replace(/\s+/g, ' ').trim();

  // Extract code examples from code and pre tags
  const codeBlocks: string[] = [];
  $('code, pre').each((_, element) => {
    const codeText = $(element).text().trim();
    if (codeText.length > 10) { // Filter out small inline code
      codeBlocks.push(codeText);
    }
  });

  // Extract classes using predefined patterns
  const classes: string[] = [];
  for (const pattern of CLASS_PATTERNS) {
    const matches = [...textContent.matchAll(new RegExp(pattern.source, pattern.flags))];
    classes.push(...matches.map(match => match[1]).filter(Boolean));
  }

  // Extract methods using predefined patterns
  const methods: string[] = [];
  for (const pattern of METHOD_PATTERNS) {
    const matches = [...textContent.matchAll(new RegExp(pattern.source, pattern.flags))];
    methods.push(...matches.map(match => match[1]).filter(Boolean));
  }

  // Extract properties using predefined patterns
  const properties: string[] = [];
  for (const pattern of PROPERTY_PATTERNS) {
    const matches = [...textContent.matchAll(new RegExp(pattern.source, pattern.flags))];
    properties.push(...matches.map(match => match[1]).filter(Boolean));
  }

  return {
    title,
    url,
    content: textContent.substring(0, 2000), // Truncate for storage efficiency
    full_content: textContent,
    code_examples: codeBlocks.slice(0, 5), // Limit to first 5 code examples
    classes: Array.from(new Set(classes)).slice(0, 10), // Deduplicate and limit
    methods: Array.from(new Set(methods)).slice(0, 20),
    properties: Array.from(new Set(properties)).slice(0, 20),
    content_length: textContent.length
  };
} 