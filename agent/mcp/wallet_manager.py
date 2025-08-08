import re
import logging
from typing import Dict, Optional, Tuple
from base58 import b58decode
from eth_utils import is_hex_address
logger = logging.getLogger(__name__)



class WalletManager:
    def __init__(self):
        self.user_wallets: Dict[str, Dict[str, Dict[str, str]]] = {}


    
    def set_user_wallet(self, user_id: str, chain: str, private_key: str, address: str = "") -> bool:
        try:
            if user_id not in self.user_wallets:
                self.user_wallets[user_id] = {}
            self.user_wallets[user_id][chain] = {
                "private_key": private_key,
                "address": address
            }
            logger.info(f"Stored {chain} wallet credentials for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error storing wallet credentials: {str(e)}")
            return False


    
    def get_user_wallet(self, user_id: str, chain: str) -> Optional[Dict[str, str]]:
        return self.user_wallets.get(user_id, {}).get(chain)


    
    def has_wallet_credentials(self, user_id: str, chain: str) -> bool:
        wallet = self.get_user_wallet(user_id, chain)
        return wallet is not None and wallet.get("private_key") is not None


    
    def clear_user_session(self, user_id: str) -> None:
        if user_id in self.user_wallets:
            del self.user_wallets[user_id]
            logger.info(f"Cleared wallet credentials for user {user_id}")


    
    def validate_private_key(self, private_key: str, chain: str) -> Tuple[bool, str]:
        try:
            if not private_key or not isinstance(private_key, str):
                return False, "Private key must be a non-empty string"
            private_key = private_key.strip()
            if chain == "solana":
                if private_key.startswith('[') and private_key.endswith(']'):
                    try:
                        key_array = eval(private_key)
                        if not isinstance(key_array, list) or len(key_array) != 64:
                            return False, "Solana private key array must contain exactly 64 numbers"
                        return True, ""
                    except:
                        return False, "Invalid Solana private key array format"
                else:
                    try:
                        decoded = b58decode(private_key)
                        if len(decoded) != 64:
                            return False, "Solana private key must be 64 bytes when decoded"
                        return True, ""
                    except:
                        return False, "Invalid Solana private key base58 format"
            elif chain == "ethereum":
                if private_key.startswith('0x'):
                    private_key = private_key[2:]
                if not re.match(r'^[0-9a-fA-F]{64}$', private_key):
                    return False, "Ethereum private key must be 64 hexadecimal characters"
                return True, ""
            else:
                return False, f"Unsupported chain: {chain}"
        except Exception as e:
            return False, f"Validation error: {str(e)}"


    
    def get_chain_from_chain_id(self, chain_id: str) -> str:
        chain_mapping = {
            "501": "solana",
            "1": "ethereum"
        }
        return chain_mapping.get(chain_id, "unknown")


    
    def needs_wallet_credentials(self, tool_name: str) -> bool:
        trading_tools = {
            "execute_swap",
            "build_cross_chain_swap"
        }
        return tool_name in trading_tools


wallet_manager = WalletManager()