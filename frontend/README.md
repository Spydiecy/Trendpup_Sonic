# TrendPup Frontend

Advanced Memecoin Intelligence System for Flow and Near Protocols with multi-chain wallet support.

## Features

- Real-time chat with AI assistant
- Multi-chain memecoin tracking (Flow & Near)
- Wallet connectivity for Flow and Near testnets
- Chain switching functionality with automatic wallet network switching
- Memecoin explorer and analytics
- Responsive UI using Tailwind CSS
- Dashboard with multiple windows interface

## Supported Networks

TrendPup supports multiple blockchain networks with wallet connectivity:

**Flow Protocol:**
- Flow EVM Testnet (Chain ID: 545)
- RPC: https://testnet.evm.nodes.onflow.org
- Block Explorer: https://testnet.flowdiver.io/
- Currency: FLOW

**Near Protocol:**
- Near Aurora Testnet (Chain ID: 1313161555)
- RPC: https://testnet.aurora.dev
- Block Explorer: https://explorer.testnet.aurora.dev/
- Currency: ETH

## Wallet Integration

### Supported Wallets
- MetaMask
- WalletConnect compatible wallets
- Any EVM-compatible wallet

### Chain Switching
Users can easily switch between supported chains using:
1. **Main Chain Selector**: On the landing page for initial chain selection
2. **Top Navigation Toggle**: Quick chain switching in the main interface  
3. **Wallet Window**: Chain switching buttons within the wallet interface

The application automatically prompts users to switch their wallet to the corresponding network when a different chain is selected.

## Chain Selection

The memecoin data automatically updates based on the selected chain. Each chain fetches data from its respective API endpoint:
- Flow: `/api/token-data?chain=flow`
- Near: `/api/token-data?chain=near`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Build the application:

```bash
npm run build
```

3. Start the production server:

```bash
npm start
```

Or run in development mode:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Wallet Integration

The frontend uses RainbowKit for wallet connectivity, supporting:
- MetaMask
- WalletConnect
- And other popular Ethereum wallets

Make sure your wallet is configured for the Avalanche Fuji testnet.

## Configuration

- `next.config.cjs`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `src/wagmi.ts`: Wagmi and RainbowKit configuration for Avalanche Fuji

## Running the Server

TrendPup uses Next.js with nginx for HTTPS and WebSocket proxying:

1. **Start the Next.js server:**
   ```bash
   # Build and start the server
   pnpm run build
   pnpm start
   ```
   This will start Next.js on port 3000.

2. **Access the app:**
   The application is available at https://trendpup.duckdns.org

## Nginx Configuration

The application runs behind nginx which:
- Handles HTTPS/SSL encryption
- Proxies HTTP requests to the Next.js server on port 3000
- Proxies WebSocket connections at `/ws` to the backend WebSocket server on port 8080

```nginx
# Main configuration at /etc/nginx/sites-enabled/trendpup.conf
server {
    listen 443 ssl;
    server_name trendpup.duckdns.org;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
