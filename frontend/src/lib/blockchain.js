import { BrowserProvider, Contract, Interface, JsonRpcProvider } from "ethers";
import abi from "./abi.json";
import deployment from "./deployment.json";

export const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || deployment.chainId || 31337);
export const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
export const CONTRACT_ADDRESS = String(import.meta.env.VITE_CONTRACT_ADDRESS || deployment.address || "").trim();

const ERROR_MESSAGES = {
  NotIssuer: "This wallet is not the authorized issuer. Connect the wallet that deployed the contract.",
  ZeroCertificateId: "The certificate ID is empty.",
  ZeroHash: "The certificate fingerprint is empty.",
  CertificateAlreadyExists: "A certificate with this ID is already registered.",
  CertificateNotFound: "No certificate with that ID exists.",
  CertificateAlreadyRevoked: "This certificate is already revoked.",
  WRONG_NETWORK: "Switch MetaMask to the local Hardhat network before sending a transaction.",
};

let readProvider;
let discoveredProvider = null;
const providerListeners = new Set();

function selectProvider(candidate, info) {
  if (!candidate) return;
  const name = info?.name || "";
  const nextIsMetaMask = Boolean(candidate.isMetaMask) || /metamask/i.test(name);
  const currentIsMetaMask = Boolean(discoveredProvider?.isMetaMask);
  if (!discoveredProvider || (nextIsMetaMask && !currentIsMetaMask)) {
    discoveredProvider = candidate;
    providerListeners.forEach((listener) => listener(candidate));
  }
}

export function getEthereumProvider() {
  if (typeof window === "undefined") return null;
  return discoveredProvider || window.ethereum || null;
}

export function hasEthereum() {
  return Boolean(getEthereumProvider());
}

export function subscribeToEthereumProvider(listener) {
  if (typeof window === "undefined") return () => {};
  providerListeners.add(listener);

  const onAnnounce = (event) => {
    selectProvider(event.detail?.provider, event.detail?.info);
  };
  const onInitialized = () => {
    if (window.ethereum) selectProvider(window.ethereum);
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.addEventListener("ethereum#initialized", onInitialized);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  if (window.ethereum) selectProvider(window.ethereum);
  const current = getEthereumProvider();
  if (current) listener(current);

  return () => {
    providerListeners.delete(listener);
    window.removeEventListener("eip6963:announceProvider", onAnnounce);
    window.removeEventListener("ethereum#initialized", onInitialized);
  };
}

export function isContractConfigured() {
  return /^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS) && Array.isArray(abi) && abi.length > 0;
}

export function networkLabel(chainId) {
  const id = Number(chainId);
  if (!id) return "Network unknown";
  if (id === EXPECTED_CHAIN_ID) return "Local Hardhat Network";
  if (id === 1) return "Ethereum Mainnet";
  if (id === 11155111) return "Sepolia";
  return `Chain ${id}`;
}

export function getReadProvider() {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(RPC_URL, EXPECTED_CHAIN_ID);
  }
  return readProvider;
}

export function getBrowserProvider() {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error("MetaMask is not available to this page. Click the fox icon and allow access for this site.");
  }
  return new BrowserProvider(ethereum);
}

function getReadContract() {
  assertConfigured();
  return new Contract(CONTRACT_ADDRESS, abi, getReadProvider());
}

async function getSignerContract() {
  assertConfigured();
  const provider = getBrowserProvider();
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
    const error = new Error(ERROR_MESSAGES.WRONG_NETWORK);
    error.code = "WRONG_NETWORK";
    throw error;
  }
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, abi, signer);
}

function assertConfigured() {
  if (!isContractConfigured()) {
    throw new Error(
      "The contract is not configured. From the project root, start the Hardhat node and run npm run deploy.",
    );
  }
}

export async function getAuthorizedIssuer() {
  return getReadContract().issuer();
}

export async function issueCertificate(id, certificateHash, onSubmitted) {
  const contract = await getSignerContract();
  const tx = await contract.issueCertificate(id, certificateHash);
  onSubmitted?.(tx);
  const receipt = await tx.wait();
  assertReceipt(receipt);
  return receipt;
}

export async function revokeCertificate(id, onSubmitted) {
  const contract = await getSignerContract();
  const tx = await contract.revokeCertificate(id);
  onSubmitted?.(tx);
  const receipt = await tx.wait();
  assertReceipt(receipt);
  return receipt;
}

export async function fetchCertificate(id) {
  const result = await getReadContract().getCertificate(id);
  return normalizeCertificate(result);
}

export async function checkCertificate(id, submittedHash) {
  const result = await getReadContract().verifyCertificate(id, submittedHash);
  return {
    exists: Boolean(result.exists),
    hashMatch: Boolean(result.hashMatch),
    revoked: Boolean(result.revoked),
  };
}

export async function fetchRecentCertificates() {
  const contract = getReadContract();
  const issued = await contract.queryFilter(contract.filters.CertificateIssued(), 0, "latest");
  const revoked = await contract.queryFilter(contract.filters.CertificateRevoked(), 0, "latest");
  const recent = issued.slice(-20).reverse();
  const records = await Promise.all(
    recent.map(async (event) => {
      const stored = await contract.getCertificate(event.args.certificateId);
      return {
        ...normalizeCertificate(stored),
        id: event.args.certificateId,
        transactionHash: event.transactionHash,
      };
    }),
  );

  return {
    records,
    issuedCount: issued.length,
    revokedCount: revoked.length,
  };
}

export async function switchToExpectedNetwork() {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error("MetaMask is not available to this page. Click the fox icon and allow access for this site.");
  }
  const chainIdHex = `0x${EXPECTED_CHAIN_ID.toString(16)}`;
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: "Hardhat Local",
          rpcUrls: [RPC_URL],
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        },
      ],
    });
  }
}

export function parseContractError(error) {
  if (isUserRejection(error)) {
    return "You rejected the request in MetaMask. No transaction was sent.";
  }
  if (error?.code === "WRONG_NETWORK") return ERROR_MESSAGES.WRONG_NETWORK;
  if (error?.revert?.name && ERROR_MESSAGES[error.revert.name]) {
    return ERROR_MESSAGES[error.revert.name];
  }

  const data = extractErrorData(error);
  if (data && abi.length > 0) {
    try {
      const parsed = new Interface(abi).parseError(data);
      if (parsed?.name && ERROR_MESSAGES[parsed.name]) return ERROR_MESSAGES[parsed.name];
    } catch {
      // The payload is not one of this contract's custom errors.
    }
  }

  const blob = `${error?.shortMessage || ""} ${error?.message || ""} ${error?.reason || ""}`;
  for (const [name, message] of Object.entries(ERROR_MESSAGES)) {
    if (blob.includes(name)) return message;
  }
  if (/user rejected|user denied/i.test(blob)) {
    return "You rejected the request in MetaMask. No transaction was sent.";
  }
  if (/chain id|wrong network|unsupported chain/i.test(blob)) {
    return ERROR_MESSAGES.WRONG_NETWORK;
  }
  if (/failed to fetch|ECONNREFUSED|could not detect network|NETWORK_ERROR|missing revert data|timeout|Failed to fetch/i.test(blob)) {
    return "Unable to reach the local blockchain. Start the Hardhat node, deploy the contract, and refresh this page.";
  }
  if (error?.message && !/revert|CALL_EXCEPTION|unknown/i.test(error.message)) {
    return error.message;
  }
  return "The request could not be completed. Check the wallet, network, and contract address, then try again.";
}

function normalizeCertificate(result) {
  return {
    certificateHash: result.certificateHash,
    issuer: result.issuerAddress,
    issuedAt: Number(result.issuedAt),
    revoked: Boolean(result.revoked),
    exists: Boolean(result.exists),
  };
}

function assertReceipt(receipt) {
  if (!receipt || Number(receipt.status) !== 1) {
    throw new Error("The transaction was not confirmed.");
  }
}

function isUserRejection(error) {
  const code = error?.code ?? error?.info?.error?.code;
  return code === 4001 || code === "ACTION_REJECTED";
}

function extractErrorData(error) {
  const candidates = [error?.data, error?.error?.data, error?.info?.error?.data];
  return candidates.find((value) => typeof value === "string" && value.startsWith("0x"));
}
