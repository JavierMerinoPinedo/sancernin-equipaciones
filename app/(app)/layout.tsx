import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server.ts';
import Nav from '@/components/Nav.tsx';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  if (!user) redirect('/login');
  return (
    <>
      <header className="hdr">
        <div className="hdr-top">
          <div>
            <h1>Equipaciones San Cernin</h1>
            <small>Calendario FNB · camiseta y pantalón por partido</small>
          </div>
          <form action="/auth/salir" method="post"><button className="pill">Salir</button></form>
        </div>
        <Nav />
      </header>
      {children}
    </>
  );
}
