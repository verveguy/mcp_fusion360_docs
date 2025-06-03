/**
 * Represents a node in the Fusion 360 documentation table of contents tree.
 * This structure mirrors the JSON format returned by Autodesk's toctree.json endpoint.
 */
export interface TocTreeNode {
  /** The title/label of this documentation node */
  ttl?: string;
  /** The link/URL path for this documentation page */
  ln?: string;
  /** Unique identifier for this node */
  id?: string;
  /** Child nodes in the documentation hierarchy */
  children?: TocTreeNode[];
}

/**
 * Root structure of the Fusion 360 documentation table of contents.
 * Contains an array of top-level books that organize the documentation.
 */
export interface TocTreeData {
  /** Array of top-level documentation books/sections */
  books: TocTreeNode[];
}

/**
 * Represents an API-related entry extracted from the documentation tree.
 * Used to catalog and search through API documentation entries.
 */
export interface ApiEntry {
  /** Display title of the API entry */
  title: string;
  /** Full URL to the documentation page */
  url: string;
  /** Relative link path from the toctree */
  link: string;
  /** Unique identifier from the toctree */
  id: string;
  /** Hierarchical path showing the entry's location in the documentation tree */
  path: string;
}

/**
 * Parsed and processed API documentation content.
 * Contains extracted information from HTML documentation pages.
 */
export interface ParsedApiDoc {
  /** Page title extracted from HTML */
  title: string;
  /** Full URL of the documentation page */
  url: string;
  /** Truncated content preview (first 2000 characters) */
  content: string;
  /** Complete text content of the page */
  full_content: string;
  /** Array of code examples found on the page */
  code_examples: string[];
  /** List of class names identified in the content */
  classes: string[];
  /** List of method names identified in the content */
  methods: string[];
  /** List of property names identified in the content */
  properties: string[];
  /** Total character count of the full content */
  content_length: number;
}

/**
 * Configuration options for HTTP fetch operations.
 * Used to customize retry behavior and timeouts.
 */
export interface FetchOptions {
  /** Maximum number of retry attempts for failed requests */
  maxRetries?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
} 