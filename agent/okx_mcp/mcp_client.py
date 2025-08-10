import requests
import json
import threading
import time
import logging
from typing import Dict, Any, Optional, Callable
from queue import Queue, Empty
logger = logging.getLogger(__name__)



class MCPClient:
    def __init__(self, base_url: str = "http://localhost:3002"):
        self.base_url = base_url
        self.dex_endpoint = f"{base_url}/sse/dex"
        self.bridge_endpoint = f"{base_url}/sse/bridge"
        self.messages_endpoint = f"{base_url}/messages"
        self._sse_threads = {}
        self._response_queues = {}
        self._session_ids = {}
        self._running = True
        logger.info(f"Initialized MCP Client")
        logger.info(f"Base URL: {base_url}")
    


    def _sse_listener(self, endpoint_type: str, endpoint_url: str):
        try:
            session = requests.Session()
            session.headers.update({
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            })
            logger.info(f"Starting SSE listener for {endpoint_type}")
            with session.get(endpoint_url, stream=True, timeout=None) as response:
                response.raise_for_status()
                logger.info(f"SSE connection established for {endpoint_type}")
                
                for line in response.iter_lines(decode_unicode=True):
                    if not self._running:
                        break
                    if line:
                        logger.debug(f"SSE [{endpoint_type}]: {line}")
                        if line.startswith('data: '):
                            data = line[6:]
                            if data.startswith('/messages?sessionId='):
                                session_id = data.split('sessionId=')[1]
                                self._session_ids[endpoint_type] = session_id
                                logger.info(f"Got session ID for {endpoint_type}: {session_id}")
                                continue
                            try:
                                json_data = json.loads(data)
                                if 'id' in json_data:
                                    request_id = json_data['id']
                                    if endpoint_type in self._response_queues:
                                        self._response_queues[endpoint_type].put((request_id, json_data))
                                        logger.debug(f"Queued response for {request_id}")
                            except json.JSONDecodeError:
                                if data.strip():
                                    logger.debug(f"Data: {data}")
        except Exception as e:
            logger.error(f"SSE listener error for {endpoint_type}: {str(e)}")
            if endpoint_type in self._sse_threads:
                del self._sse_threads[endpoint_type]
    


    def _ensure_sse_connection(self, endpoint_type: str) -> bool:
        if endpoint_type in self._sse_threads and self._sse_threads[endpoint_type].is_alive():
            return True
        endpoint_url = self.dex_endpoint if endpoint_type == "dex" else self.bridge_endpoint
        self._response_queues[endpoint_type] = Queue()
        thread = threading.Thread(
            target=self._sse_listener,
            args=(endpoint_type, endpoint_url),
            daemon=True
        )
        thread.start()
        self._sse_threads[endpoint_type] = thread
        for _ in range(50):
            if endpoint_type in self._session_ids:
                logger.info(f"SSE connection ready for {endpoint_type}")
                return True
            time.sleep(0.2)
        logger.error(f"Timeout waiting for session ID for {endpoint_type}")
        return False
    


    def call_tool(self, endpoint_type: str, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not self._ensure_sse_connection(endpoint_type):
                return {
                    "error": "Failed to establish SSE connection",
                    "status": "connection_error",
                    "content": [{"type": "text", "text": "Failed to establish SSE connection"}]
                }
            session_id = self._session_ids.get(endpoint_type)
            if not session_id:
                return {
                    "error": "No session ID available",
                    "status": "session_error",
                    "content": [{"type": "text", "text": "No session ID available"}]
                }
            request_id = f"{tool_name}_{hash(str(parameters))}"
            message = {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": parameters
                }
            }
            session_url = f"{self.messages_endpoint}?sessionId={session_id}"
            response = requests.post(session_url, json=message, timeout=30)
            response.raise_for_status()
            try:
                for _ in range(150):
                    try:
                        response_id, response_data = self._response_queues[endpoint_type].get(timeout=0.2)
                        if response_id == request_id:
                            logger.info(f"Got response for {tool_name}")
                            return response_data
                        else:
                            self._response_queues[endpoint_type].put((response_id, response_data))
                    except Empty:
                        continue
                return {
                    "error": "Timeout waiting for response",
                    "status": "timeout_error",
                    "content": [{"type": "text", "text": "Timeout waiting for response"}]
                }
            except Exception as e:
                logger.error(f"Error waiting for response: {str(e)}")
                return {
                    "error": f"Error waiting for response: {str(e)}",
                    "status": "response_error",
                    "content": [{"type": "text", "text": f"Error waiting for response: {str(e)}"}]
                }
        except Exception as e:
            logger.error(f"Error calling tool {tool_name}: {str(e)}")
            return {
                "error": f"Error calling tool: {str(e)}",
                "status": "tool_error",
                "content": [{"type": "text", "text": f"Error calling tool: {str(e)}"}]
            }
    


    def call_dex_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        return self.call_tool("dex", tool_name, parameters)



    def call_bridge_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        return self.call_tool("bridge", tool_name, parameters)
    


    def test_connection(self) -> Dict[str, Any]:
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                return {
                    "status": "connected",
                    "message": "MCP server is available"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Server returned status {response.status_code}"
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}"
            }
    


    def shutdown(self):
        self._running = False
        for thread in self._sse_threads.values():
            if thread.is_alive():
                thread.join(timeout=1)



mcp_client = MCPClient()