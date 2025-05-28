#!/usr/bin/env python3
"""
Test script for the web version of the Fusion 360 API Documentation MCP Server
"""

import asyncio
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from fusion360_docs_server_web import (
    health_check,
    get_toctree_info,
    search_api_documentation,
    analyze_arrange3d_definition
)

async def test_web_server():
    """Test the web server functions."""
    print("🚀 Testing Fusion 360 Docs MCP Web Server\n")
    
    try:
        # Test health check
        print("🔍 Testing health_check()...")
        health_result = await health_check()
        print(f"✅ Health Check: {health_result}\n")
        
        # Test a quick search
        print("🔍 Testing search functionality...")
        search_result = await search_api_documentation("API", max_results=2)
        print(f"✅ Search result preview: {search_result[:200]}...\n")
        
        print("🎉 Web server functions are working correctly!")
        print("📤 Ready for deployment!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_web_server()) 