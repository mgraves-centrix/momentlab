#!/usr/bin/env python3
import json
import os
import sys

def check_ai_compliance():
    print("Running AI Compliance Check...")
    
    # 1. Check Python dependencies in requirements.txt or backend/ (assuming backend is there)
    # We will just do a simple scan of python files for banned imports.
    banned_imports = ['openai', 'langchain', 'llama_index', 'autogen', 'crewai', 'haystack', 'semantic_kernel', 'anthropic', 'mistral', 'cohere']
    
    found_violations = []
    
    for root, dirs, files in os.walk('backend'):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                    for banned in banned_imports:
                        if f'import {banned}' in content or f'from {banned}' in content:
                            found_violations.append(f"Found prohibited AI SDK '{banned}' in {filepath}")
    
    # 2. Check for required SDKs
    adk_found = False
    mcp_found = False
    
    for root, dirs, files in os.walk('backend'):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                    if 'google.adk' in content or 'google-adk' in content or 'adk' in content.lower():
                        adk_found = True
                    if 'mcp-clickhouse' in content or 'mcp_clickhouse' in content or 'mcp' in content.lower():
                        mcp_found = True
    
    if not adk_found:
        found_violations.append("Required Google ADK framework (google.adk) not found in backend code.")
        
    if not mcp_found:
        found_violations.append("Required ClickHouse MCP integration not found in backend code.")
    
    if found_violations:
        print("\nCOMPLIANCE CHECK FAILED:")
        for violation in found_violations:
            print(f" - {violation}")
        sys.exit(1)
        
    print("AI Compliance Check PASSED. All conditions met.")
    sys.exit(0)

if __name__ == "__main__":
    check_ai_compliance()
