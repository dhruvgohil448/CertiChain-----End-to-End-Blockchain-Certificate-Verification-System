import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../components/Alert";
import PageTitle from "../components/PageTitle";
import StatusBadge from "../components/StatusBadge";
import { checkCertificate, fetchCertificate, parseContractError } from "../lib/blockchain";
import { hashCertificate, interpretVerification } from "../lib/certificateHash";
import { formatTimestamp, shortenHex } from "../lib/format";
import { emptyCertificate, sampleCertificate } from "../lib/sampleData";
import { btnPrimary, btnSecondary, cardClass, fieldClass, labelClass } from "../lib/styles";
import { isBytes32, validateCertificateFields } from "../lib/validation";

export default function VerifyCertificate() {
  const [params] = useSearchParams();
  const [certificateId, setCertificateId] = useState(params.get("id")?.trim() || "");
  const [fields, setFields] = useState(emptyCertificate);
  const [fieldErrors, setFieldErrors] = useState({});
  const [lookup, setLookup] = useState(null);
  const [verification, setVerification] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const queryId = params.get("id")?.trim() || "";
    if (!queryId) return;
    setCertificateId(queryId);
    if (!isBytes32(queryId)) {
      setLookup(null);
      setLookupError("The certificate ID in this link is not a 32-byte hex value.");
      return;
    }
    void runLookup(queryId);
    // The lookup function is stable for a given ID and does not close over changing form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function runLookup(id = certificateId) {
    const trimmed = id.trim();
    setLookupError("");
    setVerification(null);
    setVerifyError("");
    if (!trimmed) {
      setLookup(null);
      setLookupError("Enter a certificate ID.");
      return;
    }
    if (!isBytes32(trimmed)) {
      setLookup(null);
      setLookupError("Certificate IDs are 32-byte hex values starting with 0x.");
      return;
    }
    setLookingUp(true);
    try {
      const record = await fetchCertificate(trimmed);
      setLookup({ id: trimmed, ...record });
    } catch (error) {
      setLookup(null);
      setLookupError(parseContractError(error));
    } finally {
      setLookingUp(false);
    }
  }

  async function onVerify(event) {
    event.preventDefault();
    const trimmed = certificateId.trim();
    setVerifyError("");
    if (!isBytes32(trimmed)) {
      setVerifyError("Enter a valid certificate ID before checking the details.");
      return;
    }
    const validation = validateCertificateFields(fields);
    setFieldErrors(validation.errors);
    if (!validation.valid) return;

    setVerifying(true);
    try {
      const submittedHash = await hashCertificate(fields);
      const result = await checkCertificate(trimmed, submittedHash);
      const record = await fetchCertificate(trimmed);
      setLookup({ id: trimmed, ...record });
      setVerification({
        status: interpretVerification(result),
        submittedHash,
        hashMatch: result.hashMatch,
        revoked: result.revoked,
      });
    } catch (error) {
      setVerification(null);
      setVerifyError(parseContractError(error));
    } finally {
      setVerifying(false);
    }
  }

  const lookupStatus = lookupError
    ? "unable"
    : !lookup
      ? null
      : !lookup.exists
        ? "not_found"
        : lookup.revoked
          ? "revoked"
          : "active";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <PageTitle title="Verify a Certificate" />
      <div>
        <h1 className="text-3xl font-semibold text-navy-900">Verify a Certificate</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Look up the public registry record, then enter the certificate details. A match means those details equal the fingerprint an authorized issuer stored, and the record is not revoked.
        </p>
        <p className="mt-2 text-sm text-muted">You do not need a wallet to check a certificate.</p>

        <form
          className={`${cardClass} mt-6 space-y-4 p-5 sm:p-6`}
          onSubmit={(event) => {
            event.preventDefault();
            void runLookup();
          }}
        >
          <div>
            <label htmlFor="certificateId" className={labelClass}>
              Certificate ID
            </label>
            <input
              id="certificateId"
              className={fieldClass}
              value={certificateId}
              spellCheck="false"
              autoComplete="off"
              onChange={(event) => setCertificateId(event.target.value)}
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={lookingUp}>
            {lookingUp && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
            Look Up Record
          </button>
        </form>

        <form className={`${cardClass} mt-4 space-y-4 p-5 sm:p-6`} onSubmit={onVerify} autoComplete="off" noValidate>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">Certificate details</h2>
              <p className="mt-1 text-sm text-muted">
                Use the same fields that were issued. Sample data verifies only if the issuer registered these exact values.
              </p>
            </div>
            <button
              type="button"
              className={`${btnSecondary} px-3 py-2 text-xs`}
              onClick={() => {
                setFields(sampleCertificate);
                setFieldErrors({});
              }}
            >
              Fill sample record
            </button>
          </div>
          <DetailField id="verify-name" label="Student name" value={fields.studentName} error={fieldErrors.studentName} onChange={(value) => setFields((current) => ({ ...current, studentName: value }))} />
          <DetailField id="verify-course" label="Course / program" value={fields.course} error={fieldErrors.course} onChange={(value) => setFields((current) => ({ ...current, course: value }))} />
          <DetailField id="verify-institution" label="Institution name" value={fields.institution} error={fieldErrors.institution} onChange={(value) => setFields((current) => ({ ...current, institution: value }))} />
          <DetailField id="verify-year" label="Graduation year" value={fields.graduationYear} error={fieldErrors.graduationYear} onChange={(value) => setFields((current) => ({ ...current, graduationYear: value }))} inputMode="numeric" maxLength={4} />
          <button type="submit" className={btnSecondary} disabled={verifying}>
            {verifying && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
            Verify Details
          </button>
        </form>
      </div>

      <aside className={`${cardClass} h-fit p-5 sm:p-6 lg:sticky lg:top-24`}>
        <h2 className="text-lg font-semibold text-navy-900">Result</h2>
        <div className="mt-4 space-y-4" aria-live="polite">
          {!lookup && !lookupError && !verification && !verifyError && (
            <p className="text-sm leading-6 text-muted">Look up a certificate ID to see the public record. Verification compares the details you enter with the stored fingerprint.</p>
          )}
          {lookupError && <Alert tone="error">{lookupError}</Alert>}
          {verifyError && <Alert tone="error">{verifyError}</Alert>}
          {(lookupStatus || verification) && (
            <StatusBadge status={verification?.status || lookupStatus} />
          )}
          {verification && <ResultCopy verification={verification} />}
          {lookup?.exists && (
            <dl className="space-y-3 text-sm">
              <Meta label="Issuer" value={lookup.issuer} mono />
              <Meta label="Issued" value={formatTimestamp(lookup.issuedAt)} />
              <Meta label="Stored fingerprint" value={shortenHex(lookup.certificateHash, 10, 8)} title={lookup.certificateHash} mono />
            </dl>
          )}
          {lookup && !lookup.exists && !lookupError && (
            <p className="text-sm text-muted">No registry record exists for this certificate ID.</p>
          )}
          {lookup?.exists && !verification && !lookup.revoked && (
            <p className="text-sm text-muted">The record is active. Enter the certificate details to check the fingerprint. This is not a full verification yet.</p>
          )}
          {lookup?.revoked && (
            <p className="text-sm text-rose-800">This record is revoked and cannot be treated as valid.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function ResultCopy({ verification }) {
  if (verification.status === "verified") {
    return <p className="text-sm leading-6 text-navy-900">The submitted details match the registered fingerprint, and the certificate is not revoked.</p>;
  }
  if (verification.status === "mismatch") {
    return <p className="text-sm leading-6 text-navy-900">A record exists, but the submitted details do not match the registered fingerprint.</p>;
  }
  if (verification.status === "revoked") {
    return (
      <p className="text-sm leading-6 text-navy-900">
        This certificate was revoked and is not valid.
        {!verification.hashMatch && " The submitted details also do not match the registered fingerprint."}
      </p>
    );
  }
  return <p className="text-sm leading-6 text-navy-900">No registry record exists for this certificate ID.</p>;
}

function Meta({ label, value, title, mono }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd title={title} className={`mt-1 break-all text-navy-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function DetailField({ id, label, value, error, onChange, inputMode, maxLength }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={fieldClass}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
