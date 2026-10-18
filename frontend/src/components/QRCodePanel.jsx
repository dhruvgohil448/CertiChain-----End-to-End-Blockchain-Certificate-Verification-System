import { useEffect, useState } from "react";
import QRCode from "qrcode";
import CopyButton from "./CopyButton";

export default function QRCodePanel({ certificateId }) {
  const [dataUrl, setDataUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const url = `${window.location.origin}/verify?id=${certificateId}`;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: "#10243e", light: "#ffffff" },
    })
      .then((nextUrl) => {
        if (!cancelled) setDataUrl(nextUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <section className="rounded-2xl border border-line bg-slate-50 p-4">
      <h2 className="text-sm font-semibold text-navy-900">Verification QR code</h2>
      <p className="mt-1 text-sm text-muted">The code opens the public check page with this certificate ID. It contains no student details.</p>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code linking to the verification page for this certificate" className="h-40 w-40 rounded-lg border border-line bg-white p-2" />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-line bg-white text-center text-xs text-muted">
            {failed ? "QR code unavailable" : "Preparing QR code…"}
          </div>
        )}
        <div className="min-w-0 space-y-3">
          <p className="break-all font-mono text-xs text-navy-900">{url}</p>
          <CopyButton value={url} label="Copy link" />
        </div>
      </div>
    </section>
  );
}
