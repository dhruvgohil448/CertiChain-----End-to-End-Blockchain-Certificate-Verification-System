import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  EXPECTED_CHAIN_ID,
  getBrowserProvider,
  getEthereumProvider,
  parseContractError,
  subscribeToEthereumProvider,
  switchToExpectedNetwork,
} from "../lib/blockchain";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    return subscribeToEthereumProvider(() => setInstalled(true));
  }, []);

  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum) return undefined;

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
    if (!getEthereumProvider()) {
      setError("This page cannot see MetaMask yet. Click the fox icon in the toolbar and allow access for 127.0.0.1, then click Connect Wallet again.");
      return null;
    }
    setInstalled(true);
    setConnecting(true);
    try {
      const provider = getBrowserProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const nextAccount = accounts[0] || "";
      const nextChainId = Number(network.chainId);
      setAccount(nextAccount);
      setChainId(nextChainId);
      return { account: nextAccount, chainId: nextChainId };
    } catch (connectError) {
      setError(parseContractError(connectError));
      return null;
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
