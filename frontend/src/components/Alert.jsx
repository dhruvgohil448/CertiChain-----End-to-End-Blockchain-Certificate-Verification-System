const tones = {
  error: "border-rose-200 bg-rose-50 text-rose-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  success: "border-teal-200 bg-teal-50 text-teal-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
};

export default function Alert({ tone = "info", children }) {
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
