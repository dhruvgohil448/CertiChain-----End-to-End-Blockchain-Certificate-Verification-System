import { Outlet } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { EXPECTED_CHAIN_ID } from "../lib/blockchain";
import { btnSecondary } from "../lib/styles";
import Navbar from "./Navbar";

export default function Layout() {
  const wallet = useWallet();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {wallet.wrongNetwork && (
        <div className="border-b border-amber-200 bg-amber-50" role="alert">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <p>
              MetaMask is not on the local Hardhat network (chain ID {EXPECTED_CHAIN_ID}). Issuing and revoking stay
              blocked until you switch. Public lookup still uses the local node.
            </p>
            <button type="button" className={btnSecondary} onClick={wallet.switchNetwork}>
              Switch network
            </button>
          </div>
        </div>
      )}
      {wallet.error && (
        <div className="border-b border-rose-200 bg-rose-50" role="alert">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-3 text-sm text-rose-950">
            <p>{wallet.error}</p>
            <button type="button" className="font-semibold underline" onClick={wallet.clearError}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="no-print mt-auto border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>CertiChain · College prototype</p>
          <p>Demo network only. No student documents are stored on-chain.</p>
        </div>
      </footer>
    </div>
  );
}
