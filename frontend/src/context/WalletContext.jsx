import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  EXPECTED_CHAIN_ID,
  getBrowserProvider,
  hasEthereum,
  parseContractError,
  switchToExpectedNetwork,
} from "../lib/blockchain";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [installed, setInstalled] = useState(() => hasEthereum());

  useEffect(() => {
    if (hasEthereum()) {
      setInstalled(true);
      return undefined;
    }

    const markInstalled = () => {
      if (hasEthereum()) setInstalled(true);
    };

    window.addEventListener("ethereum#initialized", markInstalled, { once: true });
    const timer = window.setTimeout(markInstalled, 1000);
    return () => {
      window.removeEventListener("ethereum#initialized", markInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!installed) return undefined;
    const ethereum = window.ethereum;

    getBrowserProvider()
      .send("eth_chainId", [])
      .then((hexId) => setChainId(Number(hexId)))
      .catch(() => {});

    const onAccounts = (accounts) => setAccount(accounts?.[0] || "");
    const onChain = (hexId) => setChainId(Number(hexId));
    ethereum.on?.("accountsChanged", onAccounts);
    ethereum.on?.("chainChanged", onChain);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccounts);
      ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [installed]);

  const connect = useCallback(async () => {
    setError("");
    if (!hasEthereum()) {
      setError("MetaMask is not available in this browser. Open the site in Chrome, Brave, or Edge with the MetaMask extension installed.");
      return;
    }
    setConnecting(true);
    try {
      const provider = getBrowserProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setAccount(accounts[0] || "");
      setChainId(Number(network.chainId));
    } catch (connectError) {
      setError(parseContractError(connectError));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount("");
    setError("");
  }, []);

  const switchNetwork = useCallback(async () => {
    setError("");
    try {
      await switchToExpectedNetwork();
      const network = await getBrowserProvider().getNetwork();
      setChainId(Number(network.chainId));
    } catch (switchError) {
      setError(parseContractError(switchError));
    }
  }, []);

  const wrongNetwork = Boolean(account) && chainId !== null && Number(chainId) !== EXPECTED_CHAIN_ID;

  const value = useMemo(
    () => ({
      account,
      chainId,
      connecting,
      error,
      installed,
      wrongNetwork,
      connect,
      disconnect,
      switchNetwork,
      clearError: () => setError(""),
    }),
    [account, chainId, connecting, error, installed, wrongNetwork, connect, disconnect, switchNetwork],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return value;
}
