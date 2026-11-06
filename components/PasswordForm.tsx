'use client';
import { useActionState } from 'react';
import { changePassword } from '@/app/actions.ts';

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action}>
      <div className="field"><label htmlFor="p1">Nueva contraseña</label><input id="p1" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
      <div className="field"><label htmlFor="p2">Repítela</label><input id="p2" name="password2" type="password" autoComplete="new-password" minLength={8} required /></div>
      {state && 'error' in state && state.error && <div className="err" role="alert">{state.error}</div>}
      {state && 'ok' in state && state.ok && <div className="ok" role="status">{state.ok}</div>}
      <button className="btn" disabled={pending}>{pending ? 'Guardando…' : 'Cambiar contraseña'}</button>
    </form>
  );
}
