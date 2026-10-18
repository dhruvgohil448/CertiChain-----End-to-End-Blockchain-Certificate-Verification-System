import assert from "node:assert/strict";
import test from "node:test";
import { isBytes32, validateCertificateFields } from "./validation.js";

const now = new Date("2026-10-18T00:00:00Z");

test("accepts a complete certificate", () => {
  const result = validateCertificateFields(
    {
      studentName: "Asha Mehta",
      course: "B.Sc. Computer Science",
      institution: "Demo University",
      graduationYear: "2026",
    },
    now,
  );
  assert.equal(result.valid, true);
});

test("rejects empty fields and an implausible year", () => {
  const result = validateCertificateFields(
    { studentName: " ", course: "", institution: "", graduationYear: "1800" },
    now,
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.studentName);
  assert.ok(result.errors.course);
  assert.ok(result.errors.institution);
  assert.ok(result.errors.graduationYear);
});

test("checks certificate ID format", () => {
  assert.equal(isBytes32(`0x${"ab".repeat(32)}`), true);
  assert.equal(isBytes32("0x1234"), false);
  assert.equal(isBytes32(""), false);
});
