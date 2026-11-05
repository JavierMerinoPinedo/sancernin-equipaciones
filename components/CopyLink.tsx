'use client';
import { useState } from 'react';

export default function CopyLink({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  const webcal = url.replace(/^https?:/, 'webcal:');
  return (
    <div className="copyrow">
      <code>{url}</code>
      <button className="btn ghost small" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* copia manual */ }
      }}>{ok ? '✓' : 'Copiar'}</button>
      <a className="btn small" href={webcal}>Abrir</a>
    </div>
  );
}
