export function shortenHex(value, lead = 6, tail = 4) {
  if (!value) return "";
  const text = String(value);
  if (text.length <= lead + tail + 3) return text;
  return `${text.slice(0, lead + 2)}…${text.slice(-tail)}`;
}

export function formatTimestamp(seconds) {
  const value = Number(seconds);
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export function sameAddress(left, right) {
  if (!left || !right) return false;
  return String(left).toLowerCase() === String(right).toLowerCase();
}
