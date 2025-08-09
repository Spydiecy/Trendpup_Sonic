'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import { SolanaWalletProvider } from '../contexts/SolanaWalletContext';
import { ChainProvider } from './contexts/ChainContext';
import { useState } from 'react';

const inter = Inter({ subsets: ["latin"] });

// Moved metadata to a separate file since this is now a client component
// export const metadata: Metadata = {
//   title: "TrendPup - Advanced Memecoin Intelligence",
//   description: "Early access to emerging meme tokens on Solana and Ethereum networks with voice-enabled AI chat",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body className={inter.className}>
        <ChainProvider>
          <SolanaWalletProvider>
            <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                <RainbowKitProvider 
                  showRecentTransactions={false}
                  modalSize="compact"
                >
                  {children}
                </RainbowKitProvider>
              </QueryClientProvider>
            </WagmiProvider>
          </SolanaWalletProvider>
        </ChainProvider>
      </body>
    </html>
  );
}
