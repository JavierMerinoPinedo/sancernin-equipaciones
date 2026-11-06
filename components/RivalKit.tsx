'use client';
import { useState, useTransition, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { PALETTE, describeColors } from '@/lib/colors.ts';
import { saveOverride, resetOverride } from '@/app/actions.ts';
import { Shirt, Shorts } from './Figures.tsx';
import Sheet from './Sheet.tsx';

interface Props {
  rivalTeamId: string | null;
  rivalName: string;
  shirt: string[];
  pants: string[];
  fnbShirt: string[];
  fromOverride: boolean;
}

export default function RivalKit({ rivalTeamId, rivalName, shirt, pants, fnbShirt, fromOverride }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pick, setPick] = useState<{ shirt: string | null; pants: string | null }>({ shirt: fromOverride ? shirt[0] ?? null : null, pants: fromOverride ? pants[0] ?? null : null });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const close = () => { setOpen(false); setConfirming(false); };
  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => start(async () => {
    const r = await fn();
    if (r.error) { setErr(r.error); return; }
    close(); setErr(null); router.refresh();
  });

  const swatches = (field: 'shirt' | 'pants', label: string) => (
    <div className="swatches" role="group" aria-label={label}>
      {PALETTE.map(([n, h]) => {
        const on = pick[field]?.toUpperCase() === h;
        return (
          <button type="button" key={h} aria-pressed={on} className={`sw ${on ? 'on' : ''}`} onClick={() => setPick((p) => ({ ...p, [field]: h }))}>
            <span className="dot" style={{ background: h }} />{n}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button type="button" className="kit theirs" style={shirt[0] ? { '--c': shirt[0] } as CSSProperties : undefined} onClick={() => rivalTeamId && setOpen(true)} disabled={!rivalTeamId}
        aria-label={`Rival: ${describeColors(shirt)}. Cambiar el color de ${rivalName}`}>
        <div className="figs"><Shirt colors={shirt} size={30} /><Shorts color={pants[0]} size={22} /></div>
        <div>
          <div className="k-lbl">Rival · {fromOverride ? 'corregido' : 'FNB'}</div>
          <div className="k-val">{describeColors(shirt)}</div>
        </div>
        {rivalTeamId && <svg className="pencil" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" /></svg>}
      </button>
      {rivalTeamId && (
        <Sheet open={open} onClose={close} label={`Color de ${rivalName}`}>
          <h2 translate="no">{rivalName}</h2>
          <p>Según la FNB: <b>{describeColors(fnbShirt)}</b>. Si no es correcto, elige su camiseta. Se guarda para todo el club y para los próximos partidos contra este equipo.</p>
          <h3>Camiseta</h3>{swatches('shirt', 'Camiseta')}
          <h3>Pantalón (opcional)</h3>{swatches('pants', 'Pantalón')}
          {err && <div className="err" role="alert">{err}</div>}
          <div className="row">
            <button className="btn ghost" disabled={pending || !fromOverride} onClick={() => {
              if (confirming) run(() => resetOverride(rivalTeamId)); else setConfirming(true);
            }}>{confirming ? '¿Quitar corrección?' : 'Usar dato FNB'}</button>
            <button className="btn" disabled={pending || !pick.shirt} onClick={() => run(() => saveOverride(rivalTeamId, rivalName, pick.shirt!, pick.pants))}>
              {pending ? 'Guardando…' : 'Guardar color'}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
