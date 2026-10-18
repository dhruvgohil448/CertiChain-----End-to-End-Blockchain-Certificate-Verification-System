const MIN_YEAR = 1950;

export function maximumGraduationYear(now = new Date()) {
  return now.getFullYear() + 6;
}

export function validateCertificateFields(data, now = new Date()) {
  const errors = {};
  const studentName = data.studentName?.trim() ?? "";
  const course = data.course?.trim() ?? "";
  const institution = data.institution?.trim() ?? "";
  const yearRaw = String(data.graduationYear ?? "").trim();
  const maxYear = maximumGraduationYear(now);

  if (!studentName) errors.studentName = "Student name is required.";
  else if (studentName.length > 120) errors.studentName = "Student name must be 120 characters or fewer.";

  if (!course) errors.course = "Course or program is required.";
  else if (course.length > 160) errors.course = "Course or program must be 160 characters or fewer.";

  if (!institution) errors.institution = "Institution name is required.";
  else if (institution.length > 160) errors.institution = "Institution name must be 160 characters or fewer.";

  const year = Number(yearRaw);
  if (!yearRaw) errors.graduationYear = "Graduation year is required.";
  else if (!/^\d{4}$/.test(yearRaw) || year < MIN_YEAR || year > maxYear) {
    errors.graduationYear = `Enter a year between ${MIN_YEAR} and ${maxYear}.`;
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function isBytes32(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(String(value ?? "").trim());
}
