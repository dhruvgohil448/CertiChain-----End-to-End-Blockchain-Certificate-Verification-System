import { Link } from "react-router-dom";
import { formatTimestamp, shortenHex } from "../lib/format";
import { btnDanger, btnSecondary } from "../lib/styles";
import CopyButton from "./CopyButton";
import StatusBadge from "./StatusBadge";

export default function CertificateCard({
  record,
  canRevoke,
  confirming,
  revoking,
  revokePhase = "idle",
  onAskRevoke,
  onConfirmRevoke,
  onCancelRevoke,
}) {
  return (
    <li className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-all font-mono text-sm text-navy-900" title={record.id}>
            {shortenHex(record.id, 8, 6)}
          </p>
          <StatusBadge status={record.revoked ? "revoked" : "active"} />
        </div>
        <p className="text-sm text-muted">Issued {formatTimestamp(record.issuedAt)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton value={record.id} label="Copy ID" />
        <Link to={`/certificate/${record.id}`} className={btnSecondary}>
          View
        </Link>
        {canRevoke && !record.revoked && !confirming && (
          <button type="button" className={btnDanger} onClick={() => onAskRevoke(record.id)}>
            Revoke
          </button>
        )}
        {canRevoke && confirming && (
          <>
            <button type="button" className={btnDanger} disabled={revoking} onClick={() => onConfirmRevoke(record.id)}>
              {revokePhase === "pending"
                ? "Waiting for confirmation…"
                : revokePhase === "confirming"
                  ? "Confirm in MetaMask"
                  : "Confirm revoke"}
            </button>
            <button type="button" className={btnSecondary} disabled={revoking} onClick={onCancelRevoke}>
              Cancel
            </button>
          </>
        )}
      </div>
    </li>
  );
}
