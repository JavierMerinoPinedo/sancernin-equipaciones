'use client';
import { useState, useTransition } from 'react';
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
  const [pick, setPick] = useState<{ shirt: string | null; pants: string | null }>({ shirt: fromOverride ? shirt[0] ?? null : null, pants: fromOverride ? pants[0] ?? null : null });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>) => start(async () => {
    const r = await fn();
    if (r.error) { setErr(r.error); return; }
    setOpen(false); setErr(null); router.refresh();
  });

  const swatches = (field: 'shirt' | 'pants') => (
    <div className="swatches">
      {PALETTE.map(([n, h]) => (
        <button type="button" key={h} className={`sw ${pick[field]?.toUpperCase() === h ? 'on' : ''}`} onClick={() => setPick((p) => ({ ...p, [field]: h }))}>
          <span className="dot" style={{ background: h }} />{n}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <button type="button" className="kit theirs" onClick={() => rivalTeamId && setOpen(true)} disabled={!rivalTeamId}>
        <div className="figs"><Shirt colors={shirt} size={30} /><Shorts color={pants[0]} size={22} /></div>
        <div>
          <div className="k-lbl">Rival · {fromOverride ? 'corregido' : 'FNB'}</div>
          <div className="k-val">{describeColors(shirt)}</div>
          <div className="k-sub">tocar para cambiar</div>
        </div>
      </button>
      {rivalTeamId && (
        <Sheet open={open} onClose={() => setOpen(false)}>
            <h2>{rivalName}</h2>
            <p>Según la FNB: <b>{describeColors(fnbShirt)}</b>. Si no es correcto, elige su camiseta. Se guarda para todo el club y para los próximos partidos contra este equipo.</p>
            <h3>Camiseta</h3>{swatches('shirt')}
            <h3>Pantalón (opcional)</h3>{swatches('pants')}
            {err && <div className="err">{err}</div>}
            <div className="row">
              <button className="btn ghost" disabled={pending || !fromOverride} onClick={() => run(() => resetOverride(rivalTeamId))}>Usar dato FNB</button>
              <button className="btn" disabled={pending || !pick.shirt} onClick={() => run(() => saveOverride(rivalTeamId, rivalName, pick.shirt!, pick.pants))}>
                {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
        </Sheet>
      )}
    </>
  );
}
