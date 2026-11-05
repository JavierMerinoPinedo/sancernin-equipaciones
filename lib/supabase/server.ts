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

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
