'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import Image from 'next/image';

export default function DualWalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="flex flex-col gap-2">

      {/* Wallet Button */}
      <div className="flex justify-center">
        <ConnectButton chainStatus="none" />
      </div>

    </div>
  );
}
