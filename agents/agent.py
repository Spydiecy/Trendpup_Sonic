import os
import asyncio
import logging
import threading
import time
import json
import requests
from google.adk.agents import Agent
from dotenv import load_dotenv
from prompts import return_instructions_root
from google.adk.tools import (google_search, FunctionTool, AgentTool)
import requests
import json



load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



def sonic_mcp_call(method: str, params: dict = None) -> dict:
    try:
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": 1
        }
        response = requests.post(
            "http://localhost:3002/api",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            if "result" in result:
                return {"success": True, "data": result["result"]}
            elif "error" in result:
                return {"success": False, "error": result["error"]}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}



def get_sonic_balance(address: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_balance",
        "arguments": {"address": address}
    })



def get_sonic_token_info(token_address: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_token_info", 
        "arguments": {"tokenAddress": token_address}
    })



def get_sonic_chain_info() -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_chain_info",
        "arguments": {}
    })



def get_erc20_balance(address: str, token_address: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_erc20_balance",
        "arguments": {"address": address, "tokenAddress": token_address}
    })



def get_token_balance(address: str, token_address: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_token_balance",
        "arguments": {"address": address, "tokenAddress": token_address}
    })



def get_latest_block() -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_latest_block",
        "arguments": {}
    })



def get_block_by_number(block_number: int) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_block_by_number",
        "arguments": {"blockNumber": block_number}
    })



def get_transaction(tx_hash: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_transaction",
        "arguments": {"txHash": tx_hash}
    })



def get_transaction_receipt(tx_hash: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_transaction_receipt",
        "arguments": {"txHash": tx_hash}
    })



def estimate_gas(to_address: str, data: str = "", value: str = "0") -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "estimate_gas",
        "arguments": {"to": to_address, "data": data, "value": value}
    })



def read_contract(contract_address: str, function_name: str, args: list = []) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "read_contract",
        "arguments": {
            "contractAddress": contract_address,
            "functionName": function_name,
            "args": args
        }
    })



def is_contract(address: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "is_contract",
        "arguments": {"address": address}
    })



def get_supported_networks() -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_supported_networks",
        "arguments": {}
    })



def transfer_sonic_tokens(to_address: str, amount: str, private_key: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "transfer_native",
        "arguments": {
            "to": to_address, 
            "amount": amount, 
            "privateKey": private_key
        }
    })



def transfer_erc20_tokens(to_address: str, token_address: str, amount: str, private_key: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "transfer_erc20",
        "arguments": {
            "to": to_address,
            "tokenAddress": token_address,
            "amount": amount,
            "privateKey": private_key
        }
    })



def transfer_token(to_address: str, token_address: str, amount: str, private_key: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "transfer_token",
        "arguments": {
            "to": to_address,
            "tokenAddress": token_address,
            "amount": amount,
            "privateKey": private_key
        }
    })



def approve_token_spending(spender_address: str, token_address: str, amount: str, private_key: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "approve_token_spending",
        "arguments": {
            "spender": spender_address,
            "tokenAddress": token_address,
            "amount": amount,
            "privateKey": private_key
        }
    })



def write_contract(contract_address: str, function_name: str, args: list, private_key: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "write_contract",
        "arguments": {
            "contractAddress": contract_address,
            "functionName": function_name,
            "args": args,
            "privateKey": private_key
        }
    })



def get_address_from_private_key(private_key: str) -> dict:
    return sonic_mcp_call("tools/call", {
        "name": "get_address_from_private_key",
        "arguments": {"privateKey": private_key}
    })



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



def token_data() -> dict:
    try:
        data_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'ai_analyzer.json')
        with open(data_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {
            "content": content,
            "character_count": len(content),
            "last_updated": os.path.getmtime(data_path),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": f"Failed to load token data: {str(e)}",
            "content": "",
            "status": "error"
        }



rag_agent = Agent(
    model='gemini-2.5-flash',
    name='RAG_Context',
    instruction=return_instructions_root('rag'),
    tools=[
        FunctionTool(readme_data),
        FunctionTool(token_data),
    ],
)
search_agent = Agent(
    model='gemini-2.5-flash',
    name='Google_Search',
    instruction=return_instructions_root('search'),
    tools=[google_search],
)
mcp_agent = Agent(
    model='gemini-2.5-pro',
    name='Sonic_MCP',
    instruction=return_instructions_root('mcp'),
    tools=[
        FunctionTool(get_sonic_balance),
        FunctionTool(get_sonic_token_info),
        FunctionTool(get_sonic_chain_info),
        FunctionTool(get_erc20_balance),
        FunctionTool(get_token_balance),
        FunctionTool(get_latest_block),
        FunctionTool(get_block_by_number),
        FunctionTool(get_transaction),
        FunctionTool(get_transaction_receipt),
        FunctionTool(estimate_gas),
        FunctionTool(read_contract),
        FunctionTool(is_contract),
        FunctionTool(get_supported_networks),
        FunctionTool(transfer_sonic_tokens),
        FunctionTool(transfer_erc20_tokens),
        FunctionTool(transfer_token),
        FunctionTool(approve_token_spending),
        FunctionTool(write_contract),
        FunctionTool(get_address_from_private_key),
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



async def get_mcp_agent_async():
    return mcp_agent
async def get_app_async():
    return root_agent
