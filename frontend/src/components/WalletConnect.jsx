import { Wallet } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { networkLabel } from "../lib/blockchain";
import { shortenHex } from "../lib/format";
import { btnPrimary, btnSecondary } from "../lib/styles";

export default function WalletConnect() {
  const wallet = useWallet();
  const network = networkLabel(wallet.chainId);

  if (!wallet.account) {
    return (
      <button type="button" className={btnPrimary} onClick={wallet.connect} disabled={wallet.connecting}>
        <Wallet size={16} aria-hidden="true" />
        {wallet.connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${
          wallet.wrongNetwork ? "bg-amber-100 text-amber-950" : "bg-teal-50 text-teal-800"
        }`}
      >
        {wallet.wrongNetwork ? "Wrong network" : network}
      </span>
      <span title={wallet.account} className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-navy-900">
        {shortenHex(wallet.account)}
      </span>
      <button type="button" className={`${btnSecondary} px-2.5 py-1.5 text-xs`} onClick={wallet.disconnect}>
        Disconnect
      </button>
    </div>
  );
}
