import json
import logging
from typing import Dict, Any, Optional
from .mcp_client import mcp_client
from .wallet_manager import wallet_manager
logger = logging.getLogger(__name__)



def _format_mcp_response(response: Dict[str, Any]) -> str:
    if "error" in response:
        return f"Error: {response['error']}"
    if "result" in response and "content" in response["result"]:
        content = response["result"]["content"]
    elif "content" in response:
        content = response["content"]
    else:
        return json.dumps(response, indent=2)
    if isinstance(content, list):
        text_content = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_content.append(item.get("text", ""))
        if text_content:
            return "\n".join(text_content)
    return json.dumps(response, indent=2)



def _prompt_for_wallet_credentials(chain_id: str, user_id: str = "default") -> str:
    chain = wallet_manager.get_chain_from_chain_id(chain_id)
    if chain == "solana":
        return f"""**Wallet Credentials Required for Solana Trading**

To execute this trade on Solana (Chain ID: {chain_id}), I need your wallet private key.

**Please provide your Solana private key in one of these formats:**
1. **Base58 format**: `5Kb8kLf9zgWQnogidDA76MzPL6TsP4oMWXfHd6sPAKQzXkHdHX7FerGYGCewEkxQs83M`
2. **Array format**: `[123,45,67,89,...]` (64 numbers)

**Security Note**: Your private key is only stored temporarily in memory during this conversation and is never saved to disk or transmitted elsewhere. 🐕

Please paste your Solana private key:"""
    elif chain == "ethereum":
        return f"""**Wallet Credentials Required for Ethereum Trading**

To execute this trade on Ethereum (Chain ID: {chain_id}), I need your wallet private key.

**Please provide your Ethereum private key:**
- **Format**: 64 hexadecimal characters (with or without 0x prefix)
- **Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

**Security Note**: Your private key is only stored temporarily in memory during this conversation and is never saved to disk or transmitted elsewhere. 🐕

Please paste your Ethereum private key:"""
    else:
        return f"Unsupported chain ID: {chain_id}. Only Solana (501) and Ethereum (1) are supported."



def _get_or_prompt_wallet_credentials(chain_id: str, user_id: str = "default") -> Optional[Dict[str, str]]:
    chain = wallet_manager.get_chain_from_chain_id(chain_id)
    if wallet_manager.has_wallet_credentials(user_id, chain):
        return wallet_manager.get_user_wallet(user_id, chain)
    return None



def store_wallet_credentials(private_key: str, chain_id: str, user_id: str = "default") -> str:
    try:
        chain = wallet_manager.get_chain_from_chain_id(chain_id)
        is_valid, error_msg = wallet_manager.validate_private_key(private_key, chain)
        if not is_valid:
            return f"Invalid private key: {error_msg}"
        success = wallet_manager.set_user_wallet(user_id, chain, private_key)
        if success:
            return f"{chain.title()} wallet credentials stored successfully! You can now execute trades on {chain}."
        else:
            return "Failed to store wallet credentials. Please try again."
    except Exception as e:
        logger.error(f"Error storing wallet credentials: {str(e)}")
        return f"Error storing credentials: {str(e)}"



def get_tokens(chainId: str, searchTerm: Optional[str] = None) -> str:
    try:
        parameters = {"chainId": chainId}
        if searchTerm:
            parameters["searchTerm"] = searchTerm
        response = mcp_client.call_dex_tool("OKX_DEX_GET_TOKENS", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_tokens: {str(e)}")
        return f"Error getting tokens: {str(e)}"



def get_liquidity(chainId: str) -> str:
    try:
        parameters = {"chainId": chainId}
        response = mcp_client.call_dex_tool("OKX_DEX_GET_LIQUIDITY", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_liquidity: {str(e)}")
        return f"Error getting liquidity: {str(e)}"



def get_chain_data(chainId: str) -> str:
    try:
        parameters = {"chainId": chainId}
        response = mcp_client.call_dex_tool("OKX_DEX_GET_CHAIN_DATA", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_chain_data: {str(e)}")
        return f"Error getting chain data: {str(e)}"



def get_quote(chainId: str, fromTokenAddress: str, toTokenAddress: str, amount: str, slippage: str = "1") -> str:
    try:
        parameters = {
            "chainId": chainId,
            "fromTokenAddress": fromTokenAddress,
            "toTokenAddress": toTokenAddress,
            "amount": amount,
            "slippage": slippage
        }
        response = mcp_client.call_dex_tool("OKX_DEX_GET_QUOTE", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_quote: {str(e)}")
        return f"Error getting quote: {str(e)}"



def get_swap_data(chainId: str, fromTokenAddress: str, toTokenAddress: str, amount: str, 
                  userWalletAddress: str, slippage: str = "1") -> str:
    try:
        parameters = {
            "chainId": chainId,
            "fromTokenAddress": fromTokenAddress,
            "toTokenAddress": toTokenAddress,
            "amount": amount,
            "userWalletAddress": userWalletAddress,
            "slippage": slippage
        }
        response = mcp_client.call_dex_tool("OKX_DEX_GET_SWAP_DATA", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_swap_data: {str(e)}")
        return f"Error getting swap data: {str(e)}"



def execute_swap(chainId: str, fromTokenAddress: str, toTokenAddress: str, amount: str,
                userWalletAddress: str = "", privateKey: str = "", slippage: str = "1", 
                user_id: str = "default") -> str:
    try:
        wallet_creds = _get_or_prompt_wallet_credentials(chainId, user_id)
        if wallet_creds is None:
            return _prompt_for_wallet_credentials(chainId, user_id)
        if not privateKey:
            privateKey = wallet_creds.get("private_key", "")
        if not userWalletAddress:
            userWalletAddress = wallet_creds.get("address", "")
        if not privateKey:
            return "No private key available. Please provide your wallet credentials first."
        parameters = {
            "chainId": chainId,
            "fromTokenAddress": fromTokenAddress,
            "toTokenAddress": toTokenAddress,
            "amount": amount,
            "userWalletAddress": userWalletAddress,
            "privateKey": privateKey,
            "slippage": slippage
        }
        response = mcp_client.call_dex_tool("OKX_DEX_EXECUTE_SWAP", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in execute_swap: {str(e)}")
        return f"Error executing swap: {str(e)}"



def get_supported_tokens(chainId: str = "") -> str:
    try:
        parameters = {}
        if chainId:
            parameters["chainId"] = chainId
        response = mcp_client.call_bridge_tool("OKX_BRIDGE_GET_SUPPORTED_TOKENS", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_supported_tokens: {str(e)}")
        return f"Error getting supported tokens: {str(e)}"



def get_supported_bridges() -> str:
    try:
        parameters = {}
        response = mcp_client.call_bridge_tool("OKX_BRIDGE_GET_SUPPORTED_BRIDGES", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_supported_bridges: {str(e)}")
        return f"Error getting supported bridges: {str(e)}"



def get_bridge_token_pairs(fromChainId: str, toChainId: str) -> str:
    try:
        parameters = {
            "fromChainId": fromChainId,
            "toChainId": toChainId
        }
        response = mcp_client.call_bridge_tool("OKX_BRIDGE_GET_TOKEN_PAIRS", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_bridge_token_pairs: {str(e)}")
        return f"Error getting bridge token pairs: {str(e)}"



def get_cross_chain_quote(fromChainId: str, toChainId: str, fromTokenAddress: str, 
                         toTokenAddress: str, amount: str, userWalletAddress: str) -> str:
    try:
        parameters = {
            "fromChainId": fromChainId,
            "toChainId": toChainId,
            "fromTokenAddress": fromTokenAddress,
            "toTokenAddress": toTokenAddress,
            "amount": amount,
            "userWalletAddress": userWalletAddress
        }
        response = mcp_client.call_bridge_tool("OKX_BRIDGE_GET_CROSS_CHAIN_QUOTE", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in get_cross_chain_quote: {str(e)}")
        return f"Error getting cross-chain quote: {str(e)}"



def build_cross_chain_swap(fromChainId: str, toChainId: str, fromTokenAddress: str,
                          toTokenAddress: str, amount: str, userWalletAddress: str = "", 
                          privateKey: str = "", receiveAddress: str = "", user_id: str = "default") -> str:
    try:
        wallet_creds = _get_or_prompt_wallet_credentials(fromChainId, user_id)
        if wallet_creds is None:
            return _prompt_for_wallet_credentials(fromChainId, user_id)
        if not privateKey:
            privateKey = wallet_creds.get("private_key", "")
        if not userWalletAddress:
            userWalletAddress = wallet_creds.get("address", "")
        
        if not privateKey:
            return f"No private key available for source chain {fromChainId}. Please provide your wallet credentials first."
        parameters = {
            "fromChainId": fromChainId,
            "toChainId": toChainId,
            "fromTokenAddress": fromTokenAddress,
            "toTokenAddress": toTokenAddress,
            "amount": amount,
            "userWalletAddress": userWalletAddress,
            "privateKey": privateKey
        }
        if receiveAddress:
            parameters["receiveAddress"] = receiveAddress
        response = mcp_client.call_bridge_tool("OKX_BRIDGE_BUILD_CROSS_CHAIN_SWAP", parameters)
        return _format_mcp_response(response)
    except Exception as e:
        logger.error(f"Error in build_cross_chain_swap: {str(e)}")
        return f"Error building cross-chain swap: {str(e)}"



def search_trading_pairs(pair_query: str, chainId: str = "1") -> str:
    try:
        if "/" in pair_query:
            parts = pair_query.split("/")
            base_token = parts[0].strip().upper()
            quote_token = parts[1].strip().upper() if len(parts) > 1 and parts[1].strip() else None
        else:
            base_token = pair_query.strip().upper()
            quote_token = None
        all_tokens_response = mcp_client.call_dex_tool("OKX_DEX_GET_TOKENS", {"chainId": chainId})
        if "error" in all_tokens_response:
            return f"Error fetching tokens: {all_tokens_response['error']}"
        token_data = _format_mcp_response(all_tokens_response)
        try:
            tokens_json = json.loads(token_data)
            if "data" in tokens_json and isinstance(tokens_json["data"], list):
                all_tokens = tokens_json["data"]
            else:
                return "Invalid token data format"
        except json.JSONDecodeError:
            return "Failed to parse token data"
        base_token_info = None
        for token in all_tokens:
            if token.get("tokenSymbol", "").upper() == base_token:
                base_token_info = token
                break
        if not base_token_info:
            return f"Base token '{base_token}' not found on chain {chainId}"
        if quote_token is None:
            common_quotes = ["USDT", "USDC", "ETH", "WETH", "DAI", "WBTC", "BTC"]
        else:
            common_quotes = [quote_token]
        available_pairs = []
        for quote_symbol in common_quotes:
            for token in all_tokens:
                if token.get("tokenSymbol", "").upper() == quote_symbol:
                    pair_info = {
                        "pair": f"{base_token}/{quote_symbol}",
                        "base_token": {
                            "symbol": base_token_info.get("tokenSymbol"),
                            "name": base_token_info.get("tokenName"),
                            "address": base_token_info.get("tokenContractAddress"),
                            "decimals": base_token_info.get("decimals")
                        },
                        "quote_token": {
                            "symbol": token.get("tokenSymbol"),
                            "name": token.get("tokenName"),
                            "address": token.get("tokenContractAddress"),
                            "decimals": token.get("decimals")
                        }
                    }
                    available_pairs.append(pair_info)
                    break
        result = {
            "query": pair_query,
            "base_token": base_token,
            "quote_token": quote_token,
            "chain_id": chainId,
            "available_pairs": available_pairs,
            "total_pairs": len(available_pairs)
        }
        if available_pairs:
            return f"Found {len(available_pairs)} trading pair(s) for {base_token}:\n" + json.dumps(result, indent=2)
        else:
            return f"No trading pairs found for {base_token} on chain {chainId}"
    except Exception as e:
        logger.error(f"Error in search_trading_pairs: {str(e)}")
        return f"Error searching trading pairs: {str(e)}"



def find_token_by_name(token_query: str, chainId: str = "1", search_type: str = "contains") -> str:
    try:
        response = mcp_client.call_dex_tool("OKX_DEX_GET_TOKENS", {
            "chainId": chainId,
            "searchTerm": token_query
        })
        if "error" in response:
            return f"Error searching tokens: {response['error']}"
        token_data = _format_mcp_response(response)
        try:
            tokens_json = json.loads(token_data)
            if "data" in tokens_json and isinstance(tokens_json["data"], list):
                found_tokens = tokens_json["data"]
                query_lower = token_query.lower()
                filtered_tokens = []
                for token in found_tokens:
                    symbol = token.get("tokenSymbol", "").lower()
                    name = token.get("tokenName", "").lower()
                    match = False
                    if search_type == "exact":
                        match = symbol == query_lower or name == query_lower
                    elif search_type == "starts_with":
                        match = symbol.startswith(query_lower) or name.startswith(query_lower)
                        match = query_lower in symbol or query_lower in name
                    if match:
                        filtered_tokens.append(token)
                result = {
                    "query": token_query,
                    "search_type": search_type,
                    "chain_id": chainId,
                    "found_tokens": filtered_tokens,
                    "total_found": len(filtered_tokens)
                }
                if filtered_tokens:
                    return f"Found {len(filtered_tokens)} token(s) matching '{token_query}':\n" + json.dumps(result, indent=2)
                else:
                    return f"No tokens found matching '{token_query}' on chain {chainId}"
            else:
                return "Invalid token data format"
        except json.JSONDecodeError:
            return "Failed to parse token data"
    except Exception as e:
        logger.error(f"Error in find_token_by_name: {str(e)}")
        return f"Error finding token: {str(e)}"



def get_wallet_balance(walletAddress: str, chainId: str = "1", tokenAddress: Optional[str] = None) -> str:
    try:
        parameters = {
            "walletAddress": walletAddress,
            "chainId": chainId
        }
        if tokenAddress:
            parameters["tokenAddress"] = tokenAddress
        response = mcp_client.call_dex_tool("OKX_DEX_GET_WALLET_BALANCE", parameters)
        if "error" in response:
            return f"Error getting wallet balance: {response['error']}"
        balance_data = _format_mcp_response(response)
        try:
            balance_json = json.loads(balance_data)
            if balance_json.get("status") == "success":
                data = balance_json.get("data", {})
                chain_name = data.get("chain_name", "Unknown")
                wallet_addr = data.get("wallet_address", walletAddress)
                if "native_balance" in data:
                    native = data["native_balance"]
                    return f"Wallet Balance for {wallet_addr} on {chain_name}:\n" + \
                           f"{native['token_symbol']}: {native['balance']} ({native['balance_raw']} raw units)\n" + \
                           json.dumps(balance_json, indent=2)
                elif "token_balance" in data:
                    token = data["token_balance"]
                    return f"Token Balance for {wallet_addr} on {chain_name}:\n" + \
                           f"{token.get('token_symbol', 'UNKNOWN')}: {token['balance']} ({token['balance_raw']} raw units)\n" + \
                           f"Token Address: {token.get('token_address', 'N/A')}\n" + \
                           json.dumps(balance_json, indent=2)
                else:
                    return f"Balance data retrieved:\n{json.dumps(balance_json, indent=2)}"
            else:
                error_msg = balance_json.get("error", "Unknown error")
                return f"Balance check failed: {error_msg}"
        except json.JSONDecodeError:
            return f"Failed to parse balance data: {balance_data}"
    except Exception as e:
        logger.error(f"Error in get_wallet_balance: {str(e)}")
        return f"Error getting wallet balance: {str(e)}"