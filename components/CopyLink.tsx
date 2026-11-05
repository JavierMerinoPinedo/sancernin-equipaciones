'use client';
import { useState } from 'react';

export default function CopyLink({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  const webcal = url.replace(/^https?:/, 'webcal:');
  return (
    <div className="copyrow">
      <code>{url}</code>
      <button className="btn ghost" style={{ padding: '10px 12px', fontSize: 13 }} onClick={async () => {
        try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* copia manual */ }
      }}>{ok ? '✓' : 'Copiar'}</button>
      <a className="btn" style={{ padding: '10px 12px', fontSize: 13 }} href={webcal}>Abrir</a>
    </div>
  );
}
