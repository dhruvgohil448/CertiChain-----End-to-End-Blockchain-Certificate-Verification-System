import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Alert from "../components/Alert";
import CopyButton from "../components/CopyButton";
import PageTitle from "../components/PageTitle";
import QRCodePanel from "../components/QRCodePanel";
import StatusBadge from "../components/StatusBadge";
import { useWallet } from "../context/WalletContext";
import {
  fetchCertificate,
  getAuthorizedIssuer,
  parseContractError,
  revokeCertificate,
} from "../lib/blockchain";
import { formatTimestamp, sameAddress, shortenHex } from "../lib/format";
import { btnDanger, btnSecondary, cardClass } from "../lib/styles";
import { isBytes32 } from "../lib/validation";

export default function CertificateDetails() {
  const { id = "" } = useParams();
  const location = useLocation();
  const wallet = useWallet();
  const preview = location.state?.fields || null;
  const transactionHash = location.state?.transactionHash || "";
  const [record, setRecord] = useState(null);
  const [issuer, setIssuer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [revokePhase, setRevokePhase] = useState("idle");
  const [confirming, setConfirming] = useState(false);
  const validId = isBytes32(id);

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [stored, authorized] = await Promise.all([fetchCertificate(id), getAuthorizedIssuer()]);
        if (!cancelled) {
          setRecord(stored);
          setIssuer(authorized);
        }
      } catch (loadError) {
        if (!cancelled) setError(parseContractError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  async function onRevoke() {
    setError("");
    setRevoking(true);
    setRevokePhase("confirming");
    try {
      await revokeCertificate(id, () => setRevokePhase("pending"));
      const stored = await fetchCertificate(id);
      setRecord(stored);
      setConfirming(false);
    } catch (revokeError) {
      setError(parseContractError(revokeError));
    } finally {
      setRevoking(false);
      setRevokePhase("idle");
    }
  }

  const canRevoke = Boolean(record?.exists && !record.revoked && sameAddress(wallet.account, issuer) && !wallet.wrongNetwork);
  const explorerBase = import.meta.env.VITE_EXPLORER_URL;
  const explorerUrl = explorerBase && transactionHash ? `${String(explorerBase).replace(/\/$/, "")}/tx/${transactionHash}` : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle title="Certificate" />
      <div className="no-print mb-4">
        <Link to="/issuer" className="text-sm font-medium text-teal-brand">
          Back to issuer portal
        </Link>
      </div>
      <h1 className="text-3xl font-semibold text-navy-900">Certificate record</h1>

      {!validId && (
        <div className="mt-6">
          <Alert tone="error">This certificate link is not a valid 32-byte ID.</Alert>
        </div>
      )}
      {loading && validId && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Loading record…
        </p>
      )}
      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {record && !record.exists && !loading && (
        <div className="mt-6">
          <StatusBadge status="not_found" />
          <p className="mt-3 text-sm text-muted">No certificate with this ID is stored in the registry.</p>
        </div>
      )}

      {record?.exists && (
        <div className="mt-6 space-y-4">
          <section className={`${cardClass} print-sheet p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={record.revoked ? "revoked" : "active"} />
              <p className="text-xs font-semibold tracking-wide text-danger">DEMO / NOT AN OFFICIAL ACADEMIC DOCUMENT</p>
            </div>
            {preview ? (
              <dl className="mt-5 space-y-2 text-sm">
                <Preview label="Student" value={preview.studentName} />
                <Preview label="Course" value={preview.course} />
                <Preview label="Institution" value={preview.institution} />
                <Preview label="Graduation year" value={preview.graduationYear} />
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">
                Student details are not stored on the blockchain. This page shows the public registry record only.
              </p>
            )}
            <dl className="mt-5 space-y-4 border-t border-line pt-4 text-sm">
              <PublicRow label="Certificate ID" value={id} copy />
              <PublicRow label="Fingerprint" value={record.certificateHash} copy shortened />
              <PublicRow label="Issuer" value={record.issuer} copy />
              <div>
                <dt className="text-muted">Issued</dt>
                <dd className="mt-1 text-navy-900">{formatTimestamp(record.issuedAt)}</dd>
              </div>
              {transactionHash && (
                <div>
                  <dt className="text-muted">Transaction</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="break-all font-mono text-xs text-navy-900">{shortenHex(transactionHash, 10, 8)}</span>
                    <CopyButton value={transactionHash} label="Copy hash" />
                    {explorerUrl && (
                      <a className="text-sm font-medium text-teal-brand" href={explorerUrl} target="_blank" rel="noreferrer">
                        View transaction
                      </a>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <div className="no-print space-y-4">
            <QRCodePanel certificateId={id} />
            <div className="flex flex-wrap gap-2">
              <Link to={`/verify?id=${id}`} className={btnSecondary}>
                Open verification page
              </Link>
              <button type="button" className={btnSecondary} onClick={() => window.print()}>
                Print preview
              </button>
              {canRevoke && !confirming && (
                <button type="button" className={btnDanger} onClick={() => setConfirming(true)}>
                  Revoke
                </button>
              )}
              {canRevoke && confirming && (
                <>
                  <button type="button" className={btnDanger} disabled={revoking} onClick={onRevoke}>
                    {revokePhase === "pending" ? "Waiting for confirmation…" : revokePhase === "confirming" ? "Confirm in MetaMask" : "Confirm revoke"}
                  </button>
                  <button type="button" className={btnSecondary} disabled={revoking} onClick={() => setConfirming(false)}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-navy-900">{value}</dd>
    </div>
  );
}

function PublicRow({ label, value, copy, shortened }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2">
        <span className="break-all font-mono text-xs text-navy-900">{shortened ? shortenHex(value, 10, 8) : value}</span>
        {copy && <CopyButton value={value} label="Copy" />}
      </dd>
    </div>
  );
}
