const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-brand focus-visible:ring-offset-2";

export const btnBase = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${focus}`;

export const btnPrimary = `${btnBase} bg-navy-900 text-white hover:bg-navy-800`;
export const btnSecondary = `${btnBase} border border-line bg-white text-navy-900 hover:bg-slate-50`;
export const btnHeroPrimary = `${btnBase} bg-white text-navy-900 hover:bg-slate-100`;
export const btnHeroSecondary = `${btnBase} border border-white/30 bg-transparent text-white hover:bg-white/10`;
export const btnDanger = `${btnBase} border border-rose-200 bg-white text-danger hover:bg-rose-50`;
export const fieldClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-brand focus:ring-2 focus:ring-teal-brand/30";
export const cardClass = "rounded-2xl border border-line bg-white shadow-sm";
export const labelClass = "mb-1.5 block text-sm font-medium text-navy-900";
