import { headers } from 'next/headers';
import { requirePageUser } from '@/lib/supabase/server.ts';
import { lastSync, loadTeams } from '@/lib/data.ts';
import CopyLink from '@/components/CopyLink.tsx';
import PasswordForm from '@/components/PasswordForm.tsx';
import SyncButton from '@/components/SyncButton.tsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function SettingsPage() {
  const { supabase, user } = await requirePageUser();
  const [{ data: profile }, teams, sync] = await Promise.all([
    supabase.from('profiles').select('calendar_token').eq('user_id', user.id).maybeSingle(),
    loadTeams(),
    lastSync(),
  ]);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const base = profile?.calendar_token ? `${origin}/api/ics/${profile.calendar_token}.ics` : null;
  const when = (s: string) => new Date(s).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' });

  return (
    <main className="wrap">
      <section className="panel">
        <h2>Suscribirse al calendario</h2>
        <p>Añade los partidos a Google Calendar o al calendario del iPhone. Se actualizan solos, con la equipación en el título (🔵 azul, ⚪ blanco). En el iPhone pulsa «Abrir». En Google Calendar ve a Otros calendarios → Desde URL y pega el enlace. Los enlaces son personales: no los compartas.</p>
        {base ? (
          <>
            <h3>Todo el club</h3>
            <CopyLink url={base} />
            <details>
              <summary>Un equipo concreto</summary>
              {teams.map((t) => (
                <div key={t.id} className="team-link">
                  <h3>{t.label}</h3>
                  <CopyLink url={`${base}?team=${t.id}`} />
                </div>
              ))}
            </details>
          </>
        ) : <p className="err">No se encontró tu perfil. Revisa que el archivo schema.sql se ejecutó completo.</p>}
      </section>

      <section className="panel">
        <h2>Datos de la FNB</h2>
        <p>
          La carga automática se hace cada día de madrugada.{' '}
          {sync ? <>Última: <b>{when(sync.finished_at)}</b> ({sync.trigger === 'cron' ? 'automática' : 'manual'}) · {sync.ok ? `${sync.matches_seen ?? 0} partidos, ${sync.changes ?? 0} cambios` : `error: ${sync.error}`}</> : 'Aún no se ha hecho ninguna carga.'}
        </p>
        <SyncButton />
      </section>

      <section className="panel">
        <h2>Tu cuenta</h2>
        <p>Has entrado como <b>{user.email}</b>.</p>
        <PasswordForm />
        <form action="/auth/salir" method="post"><button className="btn ghost danger wide">Cerrar sesión</button></form>
      </section>
    </main>
  );
}
