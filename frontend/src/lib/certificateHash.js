export function canonicalizeCertificate({
  studentName,
  course,
  institution,
  graduationYear,
}) {
  return JSON.stringify({
    schemaVersion: 1,
    studentName: studentName.trim().normalize("NFC"),
    course: course.trim().normalize("NFC"),
    institution: institution.trim().normalize("NFC"),
    graduationYear: String(graduationYear).trim(),
  });
}

export async function hashCertificate(data) {
  const canonical = canonicalizeCertificate(data);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function generateCertificateId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Revocation wins over a hash match. A revoked record is never "verified".
 */
export function interpretVerification({ exists, hashMatch, revoked }) {
  if (!exists) return "not_found";
  if (revoked) return "revoked";
  if (!hashMatch) return "mismatch";
  return "verified";
}
