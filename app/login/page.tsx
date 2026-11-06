'use client';
import { useActionState } from 'react';
import { signIn } from './actions.ts';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <div className="login">
      <main id="main">
      <form className="panel" action={action}>
        <img src="/icon.svg" width={40} height={40} alt="" />
        <h1>Equipaciones San Cernin</h1>
        <p>Entra con el usuario que te ha dado el club.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" spellCheck={false} required />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error && <div className="err" role="alert">{state.error}</div>}
        <button className="btn wide" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
      </form>
      </main>
    </div>
  );
}
