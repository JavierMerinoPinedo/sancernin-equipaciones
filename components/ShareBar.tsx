'use client';
import { useState } from 'react';
import Sheet from './Sheet.tsx';

export default function ShareBar({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button className="share" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" /></svg>
        Compartir
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="Resumen de la semana">
        <h2>Resumen de la semana</h2>
        <p>Con los filtros actuales.</p>
        <textarea readOnly value={text} aria-label="Texto del resumen" onFocus={(e) => e.currentTarget.select()} />
        <div className="row">
          <button className="btn ghost" aria-live="polite" onClick={async () => {
            try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* el usuario puede copiar a mano */ }
          }}>{copied ? 'Copiado ✓' : 'Copiar texto'}</button>
          <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
        </div>
      </Sheet>
    </>
  );
}
