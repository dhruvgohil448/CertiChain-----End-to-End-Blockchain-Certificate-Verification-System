import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeCertificate,
  generateCertificateId,
  hashCertificate,
  interpretVerification,
} from "./certificateHash.js";

const sample = {
  studentName: "Asha Mehta",
  course: "B.Sc. Computer Science",
  institution: "Demo University",
  graduationYear: "2026",
};

test("canonical form trims fields and keeps a fixed order", () => {
  const canonical = canonicalizeCertificate({
    graduationYear: 2026,
    institution: " Demo University ",
    course: "B.Sc. Computer Science",
    studentName: " Asha Mehta ",
  });

  assert.equal(
    canonical,
    JSON.stringify({
      schemaVersion: 1,
      studentName: "Asha Mehta",
      course: "B.Sc. Computer Science",
      institution: "Demo University",
      graduationYear: "2026",
    }),
  );
});

test("the same certificate fields always produce the same hash", async () => {
  const first = await hashCertificate(sample);
  const second = await hashCertificate({ ...sample });
  assert.equal(first, second);
  assert.match(first, /^0x[0-9a-f]{64}$/);
});

test("changing one field changes the hash", async () => {
  const original = await hashCertificate(sample);
  const changed = await hashCertificate({ ...sample, course: "B.A. History" });
  assert.notEqual(original, changed);
});

test("certificate IDs are 32-byte hex values", () => {
  const first = generateCertificateId();
  const second = generateCertificateId();
  assert.match(first, /^0x[0-9a-f]{64}$/);
  assert.notEqual(first, second);
});

test("a revoked record is never treated as verified", () => {
  assert.equal(
    interpretVerification({ exists: true, hashMatch: true, revoked: true }),
    "revoked",
  );
  assert.equal(
    interpretVerification({ exists: true, hashMatch: false, revoked: true }),
    "revoked",
  );
  assert.equal(
    interpretVerification({ exists: true, hashMatch: true, revoked: false }),
    "verified",
  );
  assert.equal(
    interpretVerification({ exists: true, hashMatch: false, revoked: false }),
    "mismatch",
  );
  assert.equal(
    interpretVerification({ exists: false, hashMatch: false, revoked: false }),
    "not_found",
  );
});
