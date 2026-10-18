import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { isContractConfigured, issueCertificate, parseContractError } from "../lib/blockchain";
import { generateCertificateId, hashCertificate } from "../lib/certificateHash";
import { sameAddress } from "../lib/format";
import { emptyCertificate, sampleCertificate } from "../lib/sampleData";
import { btnPrimary, btnSecondary, cardClass, fieldClass, labelClass } from "../lib/styles";
import { validateCertificateFields } from "../lib/validation";
import Alert from "./Alert";

const phases = {
  idle: "Issue Certificate",
  confirming: "Confirm in MetaMask",
  pending: "Waiting for transaction confirmation…",
};

export default function CertificateForm({ issuerAddress }) {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [fields, setFields] = useState(emptyCertificate);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [phase, setPhase] = useState("idle");
  const [fingerprint, setFingerprint] = useState("");
  const isIssuer = sameAddress(wallet.account, issuerAddress);
  const busy = phase !== "idle";

  useEffect(() => {
    const validation = validateCertificateFields(fields);
    if (!validation.valid) {
      setFingerprint("");
      return undefined;
    }
    let cancelled = false;
    hashCertificate(fields).then((hash) => {
      if (!cancelled) setFingerprint(hash);
    });
    return () => {
      cancelled = true;
    };
  }, [fields]);

  function update(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFormError("");
    const validation = validateCertificateFields(fields);
    setErrors(validation.errors);
    if (!validation.valid) return;
    if (!isContractConfigured()) {
      setFormError("Deploy the contract before issuing. Run npm run deploy while the Hardhat node is running.");
      return;
    }
    if (!wallet.installed) {
      setFormError("Install MetaMask, then connect the issuer wallet.");
      return;
    }
    if (!wallet.account) {
      setFormError("Connect the authorized issuer wallet before issuing.");
      return;
    }
    if (wallet.wrongNetwork) {
      setFormError("Switch MetaMask to the local Hardhat network before issuing.");
      return;
    }
    if (issuerAddress && !isIssuer) {
      setFormError("This wallet is not the authorized issuer, so the contract will reject the transaction.");
      return;
    }

    const normalized = {
      studentName: fields.studentName.trim().normalize("NFC"),
      course: fields.course.trim().normalize("NFC"),
      institution: fields.institution.trim().normalize("NFC"),
      graduationYear: String(fields.graduationYear).trim(),
    };

    setPhase("confirming");
    try {
      const id = generateCertificateId();
      const hash = await hashCertificate(normalized);
      const receipt = await issueCertificate(id, hash, () => setPhase("pending"));
      setFields(emptyCertificate);
      setPhase("idle");
      navigate(`/certificate/${id}`, {
        state: {
          fields: normalized,
          transactionHash: receipt.hash,
        },
      });
    } catch (error) {
      setPhase("idle");
      setFormError(parseContractError(error));
    }
  }

  return (
    <form className={`${cardClass} p-5 sm:p-6`} onSubmit={onSubmit} autoComplete="off" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">Issue new certificate</h2>
          <p className="mt-1 text-sm text-muted">
            These fields are hashed in the browser. Only the fingerprint, issuer, time, and revocation flag are written on-chain.
          </p>
        </div>
        <button
          type="button"
          className={`${btnSecondary} px-3 py-2 text-xs`}
          onClick={() => {
            setFields(sampleCertificate);
            setErrors({});
          }}
        >
          Fill sample record
        </button>
      </div>

      {wallet.account && issuerAddress && !isIssuer && (
        <div className="mt-4">
          <Alert tone="warning">
            Connected wallet is not the authorized issuer. Issuing and revoking are limited to the contract deployer.
          </Alert>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          id="studentName"
          label="Student name"
          value={fields.studentName}
          error={errors.studentName}
          onChange={(value) => update("studentName", value)}
        />
        <Field
          id="course"
          label="Course / program"
          value={fields.course}
          error={errors.course}
          onChange={(value) => update("course", value)}
        />
        <Field
          id="institution"
          label="Institution name"
          value={fields.institution}
          error={errors.institution}
          onChange={(value) => update("institution", value)}
        />
        <Field
          id="graduationYear"
          label="Graduation year"
          value={fields.graduationYear}
          error={errors.graduationYear}
          onChange={(value) => update("graduationYear", value)}
          inputMode="numeric"
          maxLength={4}
        />
      </div>

      {fingerprint && (
        <p className="mt-4 break-all font-mono text-xs text-muted">
          Fingerprint preview: {fingerprint}
        </p>
      )}

      {formError && (
        <div className="mt-4">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
          {phases[phase]}
        </button>
        <p className="text-xs text-muted">Success is shown only after the transaction receipt confirms.</p>
      </div>
    </form>
  );
}

function Field({ id, label, value, error, onChange, inputMode, maxLength }) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        className={fieldClass}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
