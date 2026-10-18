import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Alert from "../components/Alert";
import CertificateCard from "../components/CertificateCard";
import CertificateForm from "../components/CertificateForm";
import PageTitle from "../components/PageTitle";
import { useWallet } from "../context/WalletContext";
import {
  fetchRecentCertificates,
  getAuthorizedIssuer,
  isContractConfigured,
  parseContractError,
  revokeCertificate,
} from "../lib/blockchain";
import { sameAddress, shortenHex } from "../lib/format";
import { cardClass } from "../lib/styles";

export default function IssuerDashboard() {
  const wallet = useWallet();
  const [issuer, setIssuer] = useState("");
  const [summary, setSummary] = useState({ records: [], issuedCount: 0, revokedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokePhase, setRevokePhase] = useState("idle");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      if (!isContractConfigured()) {
        setLoading(false);
        setLoadError("The frontend does not have a deployed contract address yet. Start the Hardhat node and run npm run deploy.");
        return;
      }
      try {
        const [issuerAddress, recent] = await Promise.all([getAuthorizedIssuer(), fetchRecentCertificates()]);
        if (!cancelled) {
          setIssuer(issuerAddress);
          setSummary(recent);
        }
      } catch (error) {
        if (!cancelled) setLoadError(parseContractError(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function onConfirmRevoke(id) {
    setActionError("");
    setRevoking(true);
    setRevokePhase("confirming");
    try {
      await revokeCertificate(id, () => setRevokePhase("pending"));
      setConfirmId("");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setActionError(parseContractError(error));
    } finally {
      setRevoking(false);
      setRevokePhase("idle");
    }
  }

  const isIssuer = sameAddress(wallet.account, issuer);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title="Issuer Portal" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-navy-900">Issuer portal</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Register a certificate fingerprint or revoke a record. Permissions are enforced by the smart contract.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Summary label="Certificates issued" value={loading ? "…" : summary.issuedCount} />
        <Summary label="Certificates revoked" value={loading ? "…" : summary.revokedCount} />
        <Summary label="Authorized issuer" value={issuer ? shortenHex(issuer) : "—"} title={issuer} />
      </div>

      {!wallet.installed && (
        <div className="mt-4">
          <Alert tone="warning">
            This browser cannot use MetaMask, so issuing and revoking are unavailable here. Open {window.location.origin} in Chrome, Brave, or Edge and install the MetaMask extension if it is missing. Checking a certificate does not need a wallet.
          </Alert>
        </div>
      )}
      {loadError && (
        <div className="mt-4">
          <Alert tone="error">{loadError}</Alert>
        </div>
      )}

      <div className="mt-6">
        <CertificateForm issuerAddress={issuer} />
      </div>

      <section className={`${cardClass} mt-6`}>
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-navy-900">Recent certificates</h2>
          <p className="mt-1 text-sm text-muted">Read from contract events on the local chain. Restarting the node clears this list until you deploy again.</p>
        </div>
        {actionError && (
          <div className="px-4 pt-4 sm:px-5">
            <Alert tone="error">{actionError}</Alert>
          </div>
        )}
        {loading ? (
          <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Loading registry…
          </p>
        ) : summary.records.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">No certificates have been issued on this deployment yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {summary.records.map((record) => (
              <CertificateCard
                key={record.id}
                record={record}
                canRevoke={isIssuer && !wallet.wrongNetwork}
                confirming={confirmId === record.id}
                revoking={revoking && confirmId === record.id}
                revokePhase={confirmId === record.id ? revokePhase : "idle"}
                onAskRevoke={setConfirmId}
                onConfirmRevoke={onConfirmRevoke}
                onCancelRevoke={() => setConfirmId("")}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value, title }) {
  return (
    <article className={`${cardClass} p-5`}>
      <p className="text-sm text-muted">{label}</p>
      <p title={title} className="mt-2 truncate text-2xl font-semibold text-navy-900">
        {value}
      </p>
    </article>
  );
}
