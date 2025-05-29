#!/usr/bin/env python3
"""
Fusion 360 API Documentation MCP Server - Web Version

This server provides tools to query and search the Autodesk Fusion 360 API documentation.
Web-compatible version for hosting on platforms like Railway, Render, etc.
"""

import asyncio
import json
import re
import os
from typing import Any, Dict, List, Optional
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server for web hosting
mcp = FastMCP("fusion360-docs")

# Constants
BASE_URL = "https://help.autodesk.com"
TOCTREE_URL = "https://help.autodesk.com/view/fusion360/ENU/data/toctree.json"
USER_AGENT = "fusion360-docs-mcp/1.0"
CACHE_DIR = Path("cache")
TOCTREE_CACHE = CACHE_DIR / "toctree.json"
DOCS_CACHE = CACHE_DIR / "docs"

# Global cache for documentation
docs_cache: Dict[str, Any] = {}
toctree_data: Dict[str, Any] = {}

def ensure_cache_dir():
    """Ensure cache directories exist."""
    CACHE_DIR.mkdir(exist_ok=True)
    DOCS_CACHE.mkdir(exist_ok=True)

async def fetch_with_retry(client: httpx.AsyncClient, url: str, max_retries: int = 3) -> Optional[str]:
    """Fetch URL content with retry logic."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    for attempt in range(max_retries):
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.text
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Failed to fetch {url} after {max_retries} attempts: {e}")
                return None
            await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
    return None

async def load_toctree() -> Dict[str, Any]:
    """Load the table of contents tree from cache or fetch from web."""
    global toctree_data
    
    if toctree_data:
        return toctree_data
    
    ensure_cache_dir()
    
    # Try to load from cache first
    if TOCTREE_CACHE.exists():
        try:
            with open(TOCTREE_CACHE, 'r', encoding='utf-8') as f:
                toctree_data = json.load(f)
                return toctree_data
        except Exception:
            pass
    
    # Fetch from web
    async with httpx.AsyncClient() as client:
        content = await fetch_with_retry(client, TOCTREE_URL)
        if content:
            try:
                toctree_data = json.loads(content)
                # Cache the result
                with open(TOCTREE_CACHE, 'w', encoding='utf-8') as f:
                    json.dump(toctree_data, f, indent=2)
                return toctree_data
            except json.JSONDecodeError as e:
                print(f"Failed to parse toctree JSON: {e}")
    
    return {}

def extract_api_entries(node: Dict[str, Any], path: str = "") -> List[Dict[str, str]]:
    """Extract API-related entries from toctree."""
    entries = []
    
    if isinstance(node, dict):
        # Check if this is an API-related entry
        title = node.get("ttl", "")
        link = node.get("ln", "")
        node_id = node.get("id", "")
        
        # Look for API-related content (classes, methods, etc.)
        api_indicators = [
            "API", "Class", "Method", "Property", "Function", "Object", 
            "Definition", "Interface", "Reference", "Programming"
        ]
        
        is_api_related = any(indicator in title for indicator in api_indicators) or \
                        (link and "Fusion-360-API" in link) or \
                        any(indicator.lower() in title.lower() for indicator in ["class", "object", "method", "property"])
        
        if is_api_related and link:
            full_url = urljoin(BASE_URL, link)
            entries.append({
                "title": title,
                "url": full_url,
                "link": link,
                "id": node_id,
                "path": path
            })
        
        # Recursively process children
        children = node.get("children", [])
        if children:
            child_path = f"{path}/{title}" if path else title
            for child in children:
                entries.extend(extract_api_entries(child, child_path))
    
    elif isinstance(node, list):
        for item in node:
            entries.extend(extract_api_entries(item, path))
    
    return entries

def parse_api_documentation(html_content: str, url: str) -> Dict[str, Any]:
    """Parse HTML documentation to extract API information."""
    soup = BeautifulSoup(html_content, 'lxml')
    
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.decompose()
    
    # Extract title
    title_elem = soup.find('title') or soup.find('h1')
    title = title_elem.get_text().strip() if title_elem else "Unknown"
    
    # Extract main content
    content_selectors = [
        'main', '.content', '#content', '.main-content', 
        '.documentation', '.api-doc', 'article'
    ]
    
    main_content = None
    for selector in content_selectors:
        main_content = soup.select_one(selector)
        if main_content:
            break
    
    if not main_content:
        main_content = soup.find('body') or soup
    
    # Extract text content
    text_content = main_content.get_text(separator='\n', strip=True)
    
    # Extract code examples
    code_blocks = []
    for code in main_content.find_all(['code', 'pre']):
        code_text = code.get_text().strip()
        if len(code_text) > 10:  # Filter out small inline code
            code_blocks.append(code_text)
    
    # Look for class/object definitions
    class_patterns = [
        r'class\s+(\w+)',
        r'(\w+)\s+class',
        r'(\w+)\s+object',
        r'(\w+)\s+interface'
    ]
    
    classes = []
    for pattern in class_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        classes.extend(matches)
    
    # Look for method definitions
    method_patterns = [
        r'(\w+)\s*\([^)]*\)\s*[:-]',
        r'def\s+(\w+)',
        r'function\s+(\w+)',
        r'(\w+)\s+method'
    ]
    
    methods = []
    for pattern in method_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        methods.extend(matches)
    
    # Look for property definitions
    property_patterns = [
        r'(\w+)\s+property',
        r'property\s+(\w+)',
        r'(\w+)\s*:\s*\w+',  # Type annotations
    ]
    
    properties = []
    for pattern in property_patterns:
        matches = re.findall(pattern, text_content, re.IGNORECASE)
        properties.extend(matches)
    
    return {
        "title": title,
        "url": url,
        "content": text_content[:2000],  # Truncate for storage
        "full_content": text_content,
        "code_examples": code_blocks[:5],  # Limit code examples
        "classes": list(set(classes))[:10],  # Deduplicate and limit
        "methods": list(set(methods))[:20],
        "properties": list(set(properties))[:20],
        "content_length": len(text_content)
    }

@mcp.tool()
async def get_toctree_info() -> str:
    """Get information about the Fusion 360 API documentation structure.
    
    Returns overview of available documentation sections and API-related content.
    """
    toctree = await load_toctree()
    if not toctree:
        return "Failed to load documentation structure."
    
    # Extract API entries
    api_entries = []
    books = toctree.get("books", [])
    
    for book in books:
        api_entries.extend(extract_api_entries(book))
    
    # Categorize entries
    categories = {}
    for entry in api_entries:
        title = entry["title"]
        # Simple categorization based on title
        if any(word in title.lower() for word in ["class", "object"]):
            category = "Classes & Objects"
        elif any(word in title.lower() for word in ["method", "function"]):
            category = "Methods & Functions"
        elif any(word in title.lower() for word in ["property", "attribute"]):
            category = "Properties & Attributes"
        elif "reference" in title.lower():
            category = "Reference"
        elif "sample" in title.lower() or "example" in title.lower():
            category = "Examples & Samples"
        else:
            category = "General API"
        
        if category not in categories:
            categories[category] = []
        categories[category].append(entry["title"])
    
    result = f"Fusion 360 API Documentation Structure:\n\n"
    result += f"Total API-related entries found: {len(api_entries)}\n\n"
    
    for category, items in categories.items():
        result += f"{category} ({len(items)} items):\n"
        for item in items[:10]:  # Show first 10 items
            result += f"  - {item}\n"
        if len(items) > 10:
            result += f"  ... and {len(items) - 10} more\n"
        result += "\n"
    
    return result

@mcp.tool()
async def search_api_documentation(query: str, max_results: int = 5) -> str:
    """Search the Fusion 360 API documentation for specific topics.
    
    Args:
        query: Search query (class name, method name, or topic)
        max_results: Maximum number of results to return (default: 5)
    """
    toctree = await load_toctree()
    if not toctree:
        return "Failed to load documentation structure."
    
    # Extract all API entries
    api_entries = []
    books = toctree.get("books", [])
    
    for book in books:
        api_entries.extend(extract_api_entries(book))
    
    # Simple text search
    query_lower = query.lower()
    matches = []
    
    for entry in api_entries:
        title = entry["title"]
        if query_lower in title.lower():
            score = 10  # Exact match in title
            matches.append((score, entry))
        elif any(word in title.lower() for word in query_lower.split()):
            score = 5  # Word match in title
            matches.append((score, entry))
    
    # Sort by score and limit results
    matches.sort(key=lambda x: x[0], reverse=True)
    matches = matches[:max_results]
    
    if not matches:
        return f"No documentation found for query: '{query}'"
    
    result = f"Search results for '{query}':\n\n"
    for score, entry in matches:
        result += f"📚 {entry['title']}\n"
        result += f"   URL: {entry['url']}\n"
        result += f"   Path: {entry['path']}\n\n"
    
    return result

@mcp.tool()
async def get_api_class_info(class_name: str) -> str:
    """Get detailed information about a specific API class.
    
    Args:
        class_name: Name of the class to look up (e.g., "ExtrudeFeature", "Sketch")
    """
    toctree = await load_toctree()
    if not toctree:
        return "Failed to load documentation structure."
    
    # Find entries related to the class
    api_entries = []
    books = toctree.get("books", [])
    
    for book in books:
        api_entries.extend(extract_api_entries(book))
    
    # Look for exact or partial matches
    class_matches = []
    class_name_lower = class_name.lower()
    
    for entry in api_entries:
        title = entry["title"]
        if class_name_lower in title.lower():
            class_matches.append(entry)
    
    if not class_matches:
        return f"No documentation found for class: '{class_name}'"
    
    # If we have matches, try to fetch and parse the first one
    if class_matches:
        best_match = class_matches[0]
        
        # Try to fetch the actual documentation
        cache_file = DOCS_CACHE / f"{best_match['id']}.json"
        doc_info = None
        
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    doc_info = json.load(f)
            except Exception:
                pass
        
        if not doc_info:
            async with httpx.AsyncClient() as client:
                html_content = await fetch_with_retry(client, best_match['url'])
                if html_content:
                    doc_info = parse_api_documentation(html_content, best_match['url'])
                    # Cache the result
                    ensure_cache_dir()
                    try:
                        with open(cache_file, 'w', encoding='utf-8') as f:
                            json.dump(doc_info, f, indent=2)
                    except Exception:
                        pass
        
        if doc_info:
            result = f"API Class Information: {class_name}\n\n"
            result += f"📖 Title: {doc_info['title']}\n"
            result += f"🔗 URL: {doc_info['url']}\n\n"
            
            if doc_info.get('classes'):
                result += f"📋 Classes found: {', '.join(doc_info['classes'])}\n\n"
            
            if doc_info.get('methods'):
                result += f"🔧 Methods found: {', '.join(doc_info['methods'][:10])}\n"
                if len(doc_info['methods']) > 10:
                    result += f"   ... and {len(doc_info['methods']) - 10} more\n"
                result += "\n"
            
            if doc_info.get('properties'):
                result += f"📊 Properties found: {', '.join(doc_info['properties'][:10])}\n"
                if len(doc_info['properties']) > 10:
                    result += f"   ... and {len(doc_info['properties']) - 10} more\n"
                result += "\n"
            
            if doc_info.get('code_examples'):
                result += f"💻 Code Examples ({len(doc_info['code_examples'])}):\n"
                for i, example in enumerate(doc_info['code_examples'][:2], 1):
                    result += f"\nExample {i}:\n```\n{example[:300]}...\n```\n"
            
            result += f"\n📝 Content Preview:\n{doc_info['content'][:500]}...\n"
            
            return result
    
    # If we couldn't fetch detailed info, return basic match info
    result = f"Found matches for '{class_name}':\n\n"
    for entry in class_matches[:3]:
        result += f"📚 {entry['title']}\n"
        result += f"   URL: {entry['url']}\n\n"
    
    return result

@mcp.tool()
async def analyze_arrange3d_definition() -> str:
    """Specifically analyze the Arrange3DDefinition object in the Fusion 360 API.
    
    This tool searches for and analyzes documentation related to the Arrange3DDefinition
    object, its API, and functional role in the Fusion API.
    """
    # First search for Arrange3D related documentation
    arrange_info = await search_api_documentation("Arrange3D", max_results=10)
    
    # Also search for arrange-related functionality
    arrange_general = await search_api_documentation("arrange", max_results=10)
    
    result = "🔍 Analysis of Arrange3DDefinition Object\n\n"
    result += "=== Specific Arrange3D Searches ===\n"
    result += arrange_info + "\n\n"
    
    result += "=== General Arrange Functionality ===\n"
    result += arrange_general + "\n\n"
    
    # Try to get specific class info if we found matches
    class_info = await get_api_class_info("Arrange3DDefinition")
    result += "=== Detailed Class Information ===\n"
    result += class_info
    
    return result

# Add a health check endpoint
@mcp.tool()
async def health_check() -> str:
    """Health check endpoint for monitoring the service."""
    return "🟢 Fusion 360 API Documentation MCP Server is running!"

if __name__ == "__main__":
    # For web hosting platforms like Railway, we need to create an ASGI app
    # that listens on the PORT environment variable
    import uvicorn
    from starlette.responses import JSONResponse
    from starlette.routing import Route
    
    # Get port from environment variable for hosting platforms  
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Fusion 360 Docs MCP Server on {host}:{port}")
    
    # Create the streamable HTTP app for MCP - this will be mounted at root
    app = mcp.streamable_http_app()
    
    # Health check endpoint for Railway (at both / and /health)
    async def health_check_endpoint(request):
        return JSONResponse({
            "status": "healthy",
            "service": "Fusion 360 API Documentation MCP Server",
            "version": "1.0.1"
        })
    
    # Add health check routes at both root and /health for Railway compatibility
    app.routes.insert(0, Route("/", health_check_endpoint, methods=["GET"]))
    app.routes.append(Route("/health", health_check_endpoint, methods=["GET"]))
    
    # Debug: Print all routes
    print("📋 Available routes:")
    for route in app.routes:
        print(f"  - {route.path} ({getattr(route, 'methods', 'ALL')})")
    
    # Run with uvicorn
    uvicorn.run(app, host=host, port=port) 