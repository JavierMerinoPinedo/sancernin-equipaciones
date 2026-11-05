'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { syncNow } from '@/app/actions.ts';

export default function SyncButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const router = useRouter();
  return (
    <>
      <button className="btn" disabled={pending} onClick={() => start(async () => {
        const r = await syncNow();
        setMsg('error' in r && r.error ? { error: r.error } : { ok: ('msg' in r && r.msg) || 'Hecho' });
        router.refresh();
      })}>{pending ? 'Actualizando desde la FNB…' : 'Actualizar ahora desde la FNB'}</button>
      {msg?.ok && <div className="ok">{msg.ok}</div>}
      {msg?.error && <div className="err">{msg.error}</div>}
    </>
  );
}
