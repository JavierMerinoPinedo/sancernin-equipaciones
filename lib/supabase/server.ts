import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieList = { name: string; value: string; options: CookieOptions }[];
import { cookies } from 'next/headers';

/** Cliente con la sesión del usuario (respeta RLS). Para Server Components, Server Actions y Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: CookieList) => {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* llamado desde un Server Component: el middleware refresca la sesión */ }
      },
    },
  });
}

/** Valida la sesión contra Supabase Auth. `cache` evita repetir la llamada dentro de un mismo render. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
});

/**
 * Puerta de cada página. Los datos compartidos salen de la caché con la service
 * role (sin RLS), así que toda página debe pasar por aquí antes de leerlos.
 * Va en la página y no en el layout para no pagar esta llamada en cada prefetch.
 */
export async function requirePageUser() {
  const { supabase, user } = await requireUser();
  if (!user) redirect('/login');
  return { supabase, user };
}
