'use client';
import { useState } from 'react';
import Sheet from './Sheet.tsx';

export default function ShareBar({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button className="share" onClick={() => setOpen(true)}>Compartir</button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <h2>Resumen de la semana</h2>
        <p>Con los filtros actuales.</p>
        <textarea readOnly value={text} onFocus={(e) => e.currentTarget.select()} />
        <div className="row">
          <button className="btn ghost" onClick={async () => {
            try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* el usuario puede copiar a mano */ }
          }}>{copied ? 'Copiado ✓' : 'Copiar'}</button>
          <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      </Sheet>
    </>
  );
}
