import { BadgeCheck, Ban, CircleAlert, CircleCheck, CircleX, FileQuestion, LoaderCircle } from "lucide-react";

const styles = {
  verified: "bg-teal-50 text-teal-800 ring-teal-200",
  active: "bg-sky-50 text-sky-800 ring-sky-200",
  mismatch: "bg-amber-50 text-amber-900 ring-amber-200",
  revoked: "bg-rose-50 text-rose-800 ring-rose-200",
  not_found: "bg-slate-100 text-slate-700 ring-slate-200",
  unable: "bg-amber-50 text-amber-900 ring-amber-200",
  pending: "bg-sky-50 text-sky-800 ring-sky-200",
};

const labels = {
  verified: "Verified",
  active: "Active",
  mismatch: "Invalid",
  revoked: "Revoked",
  not_found: "Not Found",
  unable: "Unable to Check",
  pending: "Pending",
};

const icons = {
  verified: CircleCheck,
  active: BadgeCheck,
  mismatch: CircleX,
  revoked: Ban,
  not_found: FileQuestion,
  unable: CircleAlert,
  pending: LoaderCircle,
};

export default function StatusBadge({ status }) {
  const Icon = icons[status] || CircleAlert;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.unable}`}>
      <Icon size={14} aria-hidden="true" className={status === "pending" ? "animate-spin" : undefined} />
      {labels[status] || "Unknown"}
    </span>
  );
}
