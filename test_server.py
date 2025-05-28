#!/usr/bin/env python3
"""
Test script for the Fusion 360 API Documentation MCP Server
This script tests the individual functions without going through the MCP protocol.
"""

import asyncio
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from fusion360_docs_server import (
    get_toctree_info,
    search_api_documentation,
    get_api_class_info,
    analyze_arrange3d_definition
)

async def test_toctree_info():
    """Test the toctree info function."""
    print("🔍 Testing get_toctree_info()...")
    result = await get_toctree_info()
    print("✅ Success!")
    print(f"Result preview: {result[:200]}...")
    print()

async def test_search():
    """Test the search function."""
    print("🔍 Testing search_api_documentation()...")
    result = await search_api_documentation("API", max_results=3)
    print("✅ Success!")
    print(f"Result: {result}")
    print()

async def test_class_info():
    """Test the class info function."""
    print("🔍 Testing get_api_class_info()...")
    result = await get_api_class_info("Sketch")
    print("✅ Success!")
    print(f"Result preview: {result[:300]}...")
    print()

async def test_arrange3d():
    """Test the Arrange3D analysis function."""
    print("🔍 Testing analyze_arrange3d_definition()...")
    result = await analyze_arrange3d_definition()
    print("✅ Success!")
    print(f"Result preview: {result[:400]}...")
    print()

async def main():
    """Run all tests."""
    print("🚀 Starting Fusion 360 API Documentation MCP Server Tests\n")
    
    try:
        await test_toctree_info()
        await test_search()
        await test_class_info()
        await test_arrange3d()
        
        print("🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main()) 