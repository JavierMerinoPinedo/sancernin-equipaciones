'use client';
import { useActionState } from 'react';
import { signIn } from './actions.ts';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <div className="login">
      <form className="panel" action={action}>
        <h2>Equipaciones San Cernin</h2>
        <p>Entra con el usuario que te ha dado el club.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error && <div className="err">{state.error}</div>}
        <button className="btn" style={{ width: '100%' }} disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}
