#!/usr/bin/env python3
import asyncio
from fusion360_docs_server import analyze_arrange3d_definition

async def main():
    result = await analyze_arrange3d_definition()
    print(result)

if __name__ == "__main__":
    asyncio.run(main()) 