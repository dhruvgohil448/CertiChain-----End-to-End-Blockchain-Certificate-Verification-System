import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { btnSecondary } from "../lib/styles";

export default function CopyButton({ value, label = "Copy" }) {
  const [state, setState] = useState("idle");

  async function onCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        copyWithSelection(value);
      }
      setState("copied");
    } catch {
      try {
        copyWithSelection(value);
        setState("copied");
      } catch {
        setState("failed");
      }
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  const text = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label;

  return (
    <button type="button" className={`${btnSecondary} px-2.5 py-1.5 text-xs`} onClick={onCopy}>
      {state === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-live="polite">{text}</span>
    </button>
  );
}

function copyWithSelection(value) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Copy failed");
}
