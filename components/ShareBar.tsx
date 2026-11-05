'use client';
import { useState } from 'react';

export default function ShareBar({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div className="fab">
        <button className="sec" onClick={() => setOpen(true)}>Texto</button>
        <a className="wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
      </div>
      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true">
            <h2>Resumen de la semana</h2>
            <p>Con los filtros actuales.</p>
            <textarea readOnly value={text} onFocus={(e) => e.currentTarget.select()} />
            <div className="row">
              <button className="btn ghost" onClick={() => setOpen(false)}>Cerrar</button>
              <button className="btn" onClick={async () => {
                try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* el usuario puede copiar a mano */ }
              }}>{copied ? 'Copiado ✓' : 'Copiar'}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
