import Nav from '@/components/Nav.tsx';

// Sin datos ni sesión a propósito: es lo que se ve al instante al navegar. Cada
// página valida al usuario con requirePageUser().
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
