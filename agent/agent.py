import os
import asyncio
import logging
import threading
import time
import json
from google.adk.agents import Agent
from dotenv import load_dotenv
from .prompts import return_instructions_root
from google.adk.tools import (google_search, FunctionTool, AgentTool)
from .mcp.mcp_client import mcp_client
from .mcp import mcp_tools



load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



def test_mcp_connection():
    try:
        connection_status = mcp_client.test_connection()
        if connection_status.get("status") == "connected":
            logger.info("OKX MCP server connection successful")
        else:
            logger.warning(f"OKX MCP server connection issue: {connection_status.get('message')}")
    except Exception as e:
        logger.error(f"Failed to test MCP server connection: {str(e)}")
test_mcp_connection()



def readme_data() -> dict:
    try:
        readme_path = os.path.join(os.path.dirname(__file__), '..', 'README.md')
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {
            "content": content,
            "character_count": len(content),
            "last_updated": os.path.getmtime(readme_path),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": f"Failed to load README data: {str(e)}",
            "content": "",
            "status": "error"
        }



rag_agent = Agent(
    model='gemini-2.5-flash',
    name='README_Context',
    instruction=return_instructions_root('rag'),
    tools=[
        FunctionTool(readme_data),
    ],
)
search_agent = Agent(
    model='gemini-2.5-flash',
    name='Google_Search',
    instruction=return_instructions_root('search'),
    tools=[google_search],
)
mcp_agent = Agent(
    model='gemini-2.5-flash',
    name='OKX_MCP',
    instruction=return_instructions_root('mcp'),
    tools=[
        FunctionTool(mcp_tools.get_tokens),
        FunctionTool(mcp_tools.get_liquidity),
        FunctionTool(mcp_tools.get_chain_data),
        FunctionTool(mcp_tools.get_quote),
        FunctionTool(mcp_tools.get_swap_data),
        FunctionTool(mcp_tools.execute_swap),
        FunctionTool(mcp_tools.get_supported_tokens),
        FunctionTool(mcp_tools.get_supported_bridges),
        FunctionTool(mcp_tools.get_bridge_token_pairs),
        FunctionTool(mcp_tools.get_cross_chain_quote),
        FunctionTool(mcp_tools.build_cross_chain_swap),
        FunctionTool(mcp_tools.store_wallet_credentials),
        FunctionTool(mcp_tools.search_trading_pairs),
        FunctionTool(mcp_tools.find_token_by_name),
        FunctionTool(mcp_tools.get_wallet_balance),
    ],
)
root_agent = Agent(
    model='gemini-2.5-pro',
    name='TrendPup',
    instruction=return_instructions_root('root'),
    tools=[
    AgentTool(agent=rag_agent), 
    AgentTool(agent=search_agent), 
    AgentTool(agent=mcp_agent),
    ]
)