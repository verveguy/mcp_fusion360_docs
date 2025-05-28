Plan of attack

That's an excellent idea—and quite feasible. Here's a concise architectural plan to build an MCP-style (Modular Capability Provider) server that exposes the Fusion 360 API documentation as an LLM-accessible tool.

🔧 Goal
Create a local or hosted service that:

Parses and indexes Autodesk Fusion 360 API docs (from toctree.json)

Exposes semantic and structural API information via an HTTP API

Is queryable by LLMs for function/class descriptions, usage, relationships, etc.

🧱 Architecture Overview
1. Documentation Ingestion
Input: https://help.autodesk.com/view/fusion360/ENU/data/toctree.json

Downloader script fetches each "ln" relative URL (HTML content).

HTML is parsed to extract:

Class names

Properties, methods

Inheritance structure

Descriptions and usage examples

Store structured output as JSON, SQLite, or in a vector DB if you want retrieval.

2. Indexer/Embedder (Optional for Semantic Search)
Embed documentation content using an embedding model (e.g. Ollama with nomic-embed-text).

Store in ChromaDB or other local vector database.

Associate metadata: class name, method name, URL, type.

3. MCP HTTP Server
Build with:

FastAPI (recommended for LLM tool wrapping and OpenAPI)

Endpoints:

GET /classes → list of class names

GET /class/{name} → full details (properties, methods, links)

GET /method/{name} → locate methods across classes

POST /search → keyword or vector similarity search

POST /query → natural language to structured doc result (optional LLM step)

Add OpenAPI schema for LLM tool support.

4. Tool Registration for LLM
Provide:

Tool name: fusion360_doc_server

Description: "Query Autodesk Fusion 360 API documentation"

API schema for functions LLMs can call, e.g. get_class_info(name: str), search_docs(query: str)