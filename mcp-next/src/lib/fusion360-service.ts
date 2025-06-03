import NodeCache from 'node-cache';
import { 
  TocTreeData, 
  ApiEntry, 
  ParsedApiDoc 
} from '@/types/fusion360';
import { 
  TOCTREE_URL, 
  CACHE_CONFIG
} from './constants';
import { 
  fetchWithRetry, 
  extractApiEntries, 
  parseApiDocumentation 
} from './utils';
import { logError, logOperationError } from './secure-logger';

/**
 * Main service class for accessing and processing Fusion 360 API documentation.
 * 
 * This service provides a high-level interface for:
 * - Loading and caching the documentation table of contents
 * - Searching through API documentation entries
 * - Retrieving detailed information about specific API classes
 * - Analyzing specialized components like Arrange3DDefinition
 * - Health checking the documentation system
 * 
 * The service implements intelligent caching to minimize network requests
 * and improve response times for repeated queries.
 * 
 * @example
 * ```typescript
 * const service = new Fusion360Service();
 * const tocInfo = await service.getTocTreeInfo();
 * const searchResults = await service.searchApiDocumentation('Sketch');
 * ```
 */
export class Fusion360Service {
  /** In-memory cache for storing documentation data and parsed content */
  private cache: NodeCache;
  /** Cached table of contents data to avoid repeated fetches */
  private tocTreeData: TocTreeData | null = null;

  /**
   * Initializes a new Fusion360Service instance.
   * Sets up the internal cache with configured TTL and cleanup intervals.
   */
  constructor() {
    this.cache = new NodeCache(CACHE_CONFIG);
  }

  /**
   * Loads the Fusion 360 documentation table of contents.
   * 
   * This method fetches the complete documentation structure from Autodesk's
   * servers and caches it for subsequent use. It implements a multi-level
   * caching strategy:
   * 1. In-memory instance variable for immediate access
   * 2. Node cache for session persistence
   * 3. Network fetch as fallback
   * 
   * @returns Promise resolving to the complete documentation table of contents
   * 
   * @example
   * ```typescript
   * const tocTree = await service.loadTocTree();
   * console.log(`Loaded ${tocTree.books.length} documentation books`);
   * ```
   */
  async loadTocTree(): Promise<TocTreeData> {
    if (this.tocTreeData) {
      return this.tocTreeData;
    }

    // Try to load from cache first
    const cachedTocTree = this.cache.get<TocTreeData>('toctree');
    if (cachedTocTree) {
      this.tocTreeData = cachedTocTree;
      return cachedTocTree;
    }

    // Fetch from web
    const content = await fetchWithRetry(TOCTREE_URL);
    if (content) {
      try {
        // Handle case where content might already be parsed as JSON
        let tocTreeData: TocTreeData;
        if (typeof content === 'string') {
          tocTreeData = JSON.parse(content) as TocTreeData;
        } else {
          tocTreeData = content as TocTreeData;
        }
        
        this.tocTreeData = tocTreeData;
        // Cache the result
        this.cache.set('toctree', tocTreeData);
        return tocTreeData;
      } catch (error) {
        // SECURITY: Don't log full content or detailed error information
        // that could expose internal API structure or sensitive data
        logOperationError('Failed to parse toctree JSON', error as Error);
        logError('Content parsing failed', { 
          contentType: typeof content,
          contentSize: typeof content === 'string' ? content.length : 0,
          // Never log the actual content - could contain sensitive URLs or structure
        });
      }
    }

    return { books: [] };
  }

  /**
   * Retrieves a formatted overview of the Fusion 360 API documentation structure.
   * 
   * This method provides a high-level summary of the available API documentation,
   * categorizing entries by type (classes, methods, properties) and providing
   * statistics about the documentation coverage.
   * 
   * @returns Promise resolving to a formatted markdown string describing the documentation structure
   * 
   * @example
   * ```typescript
   * const overview = await service.getTocTreeInfo();
   * console.log(overview); // Displays categorized documentation summary
   * ```
   */
  async getTocTreeInfo(): Promise<string> {
    const tocTree = await this.loadTocTree();
    if (!tocTree.books || tocTree.books.length === 0) {
      return "Failed to load documentation structure.";
    }

    // Extract API entries
    const apiEntries: ApiEntry[] = [];
    for (const book of tocTree.books) {
      apiEntries.push(...extractApiEntries(book));
    }

    // Categorize entries by type
    const categories: Record<string, ApiEntry[]> = {};
    for (const entry of apiEntries) {
      const title = entry.title;
      let category = "General";
      
      if (title.toLowerCase().includes("class") || title.toLowerCase().includes("object")) {
        category = "Classes & Objects";
      } else if (title.toLowerCase().includes("method") || title.toLowerCase().includes("function")) {
        category = "Methods & Functions";
      } else if (title.toLowerCase().includes("property") || title.toLowerCase().includes("attribute")) {
        category = "Properties & Attributes";
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(entry);
    }

    // Format the response as markdown
    let result = "# Fusion 360 API Documentation Structure\n\n";
    result += `Found ${apiEntries.length} API-related entries across ${Object.keys(categories).length} categories:\n\n`;

    for (const [categoryName, entries] of Object.entries(categories)) {
      result += `## ${categoryName} (${entries.length} entries)\n`;
      const sampleEntries = entries.slice(0, 5);
      for (const entry of sampleEntries) {
        result += `- ${entry.title}\n`;
      }
      if (entries.length > 5) {
        result += `- ... and ${entries.length - 5} more\n`;
      }
      result += "\n";
    }

    return result;
  }

  /**
   * Searches the API documentation for entries matching a query string.
   * 
   * This method performs a case-insensitive search across API entry titles
   * and hierarchical paths. It's useful for finding specific classes, methods,
   * or topics within the vast Fusion 360 API documentation.
   * 
   * @param query - Search term to match against entry titles and paths
   * @param maxResults - Maximum number of results to return (default: 5)
   * @returns Promise resolving to a formatted markdown string with search results
   * 
   * @example
   * ```typescript
   * const results = await service.searchApiDocumentation('Sketch', 10);
   * console.log(results); // Shows up to 10 entries related to sketching
   * ```
   */
  async searchApiDocumentation(query: string, maxResults: number = 5): Promise<string> {
    const tocTree = await this.loadTocTree();
    if (!tocTree.books || tocTree.books.length === 0) {
      return "Failed to load documentation structure for search.";
    }

    // Extract all API entries
    const apiEntries: ApiEntry[] = [];
    for (const book of tocTree.books) {
      apiEntries.push(...extractApiEntries(book));
    }

    // Filter entries based on query (case-insensitive)
    const queryLower = query.toLowerCase();
    const matchingEntries = apiEntries.filter(entry => 
      entry.title.toLowerCase().includes(queryLower) ||
      entry.path.toLowerCase().includes(queryLower)
    );

    if (matchingEntries.length === 0) {
      return `No documentation found matching query: "${query}"`;
    }

    // Limit results
    const limitedEntries = matchingEntries.slice(0, maxResults);

    let result = `# Search Results for "${query}"\n\n`;
    result += `Found ${matchingEntries.length} matching entries (showing ${limitedEntries.length}):\n\n`;

    for (const entry of limitedEntries) {
      result += `## ${entry.title}\n`;
      result += `- **Path**: ${entry.path}\n`;
      result += `- **URL**: ${entry.url}\n`;
      result += `- **ID**: ${entry.id}\n\n`;
    }

    return result;
  }

  /**
   * Retrieves detailed information about a specific API class or object.
   * 
   * This method searches for documentation entries related to a specific class
   * name, fetches the actual documentation pages, and extracts detailed
   * information including methods, properties, and code examples.
   * 
   * The method implements intelligent caching to avoid re-parsing the same
   * documentation pages multiple times.
   * 
   * @param className - Name of the class to analyze (e.g., "Sketch", "ExtrudeFeature")
   * @returns Promise resolving to a formatted markdown string with detailed class information
   * 
   * @example
   * ```typescript
   * const classInfo = await service.getApiClassInfo('ExtrudeFeature');
   * console.log(classInfo); // Detailed information about ExtrudeFeature class
   * ```
   */
  async getApiClassInfo(className: string): Promise<string> {
    const tocTree = await this.loadTocTree();
    if (!tocTree.books || tocTree.books.length === 0) {
      return "Failed to load documentation structure.";
    }

    // Extract all API entries
    const apiEntries: ApiEntry[] = [];
    for (const book of tocTree.books) {
      apiEntries.push(...extractApiEntries(book));
    }

    // Find matching class entries (case-insensitive)
    const classNameLower = className.toLowerCase();
    const matchingEntries = apiEntries.filter(entry => 
      entry.title.toLowerCase().includes(classNameLower) ||
      entry.title.toLowerCase().includes("class") ||
      entry.title.toLowerCase().includes("object")
    );

    if (matchingEntries.length === 0) {
      return `No class documentation found for: "${className}"`;
    }

    let result = `# API Class Information for "${className}"\n\n`;

    // Process up to 3 matching entries to avoid overwhelming responses
    const entriesToProcess = matchingEntries.slice(0, 3);
    
    for (const entry of entriesToProcess) {
      // Check cache first to avoid re-parsing
      const cacheKey = `doc_${entry.url}`;
      let parsedDoc = this.cache.get<ParsedApiDoc>(cacheKey);

      if (!parsedDoc) {
        // Fetch and parse the documentation page
        const htmlContent = await fetchWithRetry(entry.url);
        if (htmlContent) {
          parsedDoc = parseApiDocumentation(htmlContent, entry.url);
          // Cache the parsed document for future use
          this.cache.set(cacheKey, parsedDoc);
        }
      }

      if (parsedDoc) {
        result += `## ${parsedDoc.title}\n`;
        result += `**URL**: ${parsedDoc.url}\n\n`;
        
        if (parsedDoc.classes.length > 0) {
          result += `**Classes**: ${parsedDoc.classes.join(", ")}\n\n`;
        }
        
        if (parsedDoc.methods.length > 0) {
          result += `**Methods**: ${parsedDoc.methods.slice(0, 10).join(", ")}\n\n`;
        }
        
        if (parsedDoc.properties.length > 0) {
          result += `**Properties**: ${parsedDoc.properties.slice(0, 10).join(", ")}\n\n`;
        }
        
        if (parsedDoc.code_examples.length > 0) {
          result += `**Code Examples**:\n`;
          for (const example of parsedDoc.code_examples.slice(0, 2)) {
            result += `\`\`\`\n${example}\n\`\`\`\n\n`;
          }
        }
        
        result += `**Content Preview**:\n${parsedDoc.content}\n\n`;
        result += `---\n\n`;
      }
    }

    return result;
  }

  /**
   * Performs specialized analysis of the Arrange3DDefinition object in the Fusion 360 API.
   * 
   * This method specifically searches for and analyzes documentation related to
   * the Arrange3DDefinition object, its API, and functional role. If no specific
   * Arrange3D documentation is found, it searches for related concepts like
   * definitions, layouts, and components.
   * 
   * @returns Promise resolving to a formatted markdown string with Arrange3DDefinition analysis
   * 
   * @example
   * ```typescript
   * const analysis = await service.analyzeArrange3dDefinition();
   * console.log(analysis); // Detailed analysis of Arrange3DDefinition
   * ```
   */
  async analyzeArrange3dDefinition(): Promise<string> {
    const tocTree = await this.loadTocTree();
    if (!tocTree.books || tocTree.books.length === 0) {
      return "Failed to load documentation structure.";
    }

    // Extract all API entries
    const apiEntries: ApiEntry[] = [];
    for (const book of tocTree.books) {
      apiEntries.push(...extractApiEntries(book));
    }

    // Search for Arrange3D related entries
    const arrange3dEntries = apiEntries.filter(entry => 
      entry.title.toLowerCase().includes("arrange3d") ||
      entry.title.toLowerCase().includes("arrange") ||
      entry.path.toLowerCase().includes("arrange3d")
    );

    let result = `# Arrange3DDefinition Analysis\n\n`;

    if (arrange3dEntries.length === 0) {
      result += "No specific Arrange3DDefinition documentation found in the API structure.\n";
      result += "This may indicate:\n";
      result += "- The object is part of a larger class or module\n";
      result += "- It's documented under a different name\n";
      result += "- It's a newer addition not yet fully documented\n\n";
      
      // Try broader search for related concepts
      const relatedEntries = apiEntries.filter(entry => 
        entry.title.toLowerCase().includes("definition") ||
        entry.title.toLowerCase().includes("layout") ||
        entry.title.toLowerCase().includes("component")
      );
      
      if (relatedEntries.length > 0) {
        result += `Found ${relatedEntries.length} potentially related entries:\n`;
        for (const entry of relatedEntries.slice(0, 5)) {
          result += `- ${entry.title} (${entry.path})\n`;
        }
      }
    } else {
      result += `Found ${arrange3dEntries.length} Arrange3D-related entries:\n\n`;

      // Process up to 3 entries for detailed analysis
      for (const entry of arrange3dEntries.slice(0, 3)) {
        // Check cache first
        const cacheKey = `doc_${entry.url}`;
        let parsedDoc = this.cache.get<ParsedApiDoc>(cacheKey);

        if (!parsedDoc) {
          // Fetch and parse the documentation
          const htmlContent = await fetchWithRetry(entry.url);
          if (htmlContent) {
            parsedDoc = parseApiDocumentation(htmlContent, entry.url);
            // Cache the parsed document
            this.cache.set(cacheKey, parsedDoc);
          }
        }

        if (parsedDoc) {
          result += `## ${parsedDoc.title}\n`;
          result += `**URL**: ${parsedDoc.url}\n`;
          result += `**Path**: ${entry.path}\n\n`;
          
          if (parsedDoc.classes.length > 0) {
            result += `**Related Classes**: ${parsedDoc.classes.join(", ")}\n\n`;
          }
          
          if (parsedDoc.methods.length > 0) {
            result += `**Available Methods**: ${parsedDoc.methods.slice(0, 8).join(", ")}\n\n`;
          }
          
          if (parsedDoc.properties.length > 0) {
            result += `**Properties**: ${parsedDoc.properties.slice(0, 8).join(", ")}\n\n`;
          }
          
          result += `**Documentation Content**:\n${parsedDoc.content}\n\n`;
          result += `---\n\n`;
        }
      }
    }

    return result;
  }

  /**
   * Performs a health check on the documentation service.
   * 
   * This method verifies that the service can successfully load the documentation
   * structure and extract API entries. It's useful for monitoring and debugging
   * the service's connectivity and functionality.
   * 
   * @returns Promise resolving to a status message indicating service health
   * 
   * @example
   * ```typescript
   * const status = await service.healthCheck();
   * console.log(status); // "Health check passed. Documentation structure loaded with X API entries available."
   * ```
   */
  async healthCheck(): Promise<string> {
    try {
      const tocTree = await this.loadTocTree();
      const apiEntries: ApiEntry[] = [];
      for (const book of tocTree.books) {
        apiEntries.push(...extractApiEntries(book));
      }
      
      return `Health check passed. Documentation structure loaded with ${apiEntries.length} API entries available.`;
    } catch (error) {
      return `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
} 