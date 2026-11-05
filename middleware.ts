import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieList = { name: string; value: string; options: CookieOptions }[];
import { NextResponse, type NextRequest } from 'next/server';

// Refresca la sesión de Supabase y obliga a iniciar sesión en toda la app.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: CookieList) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const path = request.nextUrl.pathname;
  // getSession no sale a la red salvo para renovar un token caducado, y este código
  // corre también en cada prefetch. La validación real la hace cada página
  // (requirePageUser). En /login sí se valida: con una sesión revocada, redirigir a
  // la portada devolvería aquí y se entraría en bucle.
  const signedIn = path === '/login'
    ? !!(await supabase.auth.getUser()).data.user
    : !!(await supabase.auth.getSession()).data.session;
  if (!signedIn && path !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (signedIn && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Ni la carga diaria ni el .ics pasan por el login (tienen su propia protección)
  matcher: ['/((?!_next/static|_next/image|favicon|icon|apple-icon|manifest|api/cron|api/ics).*)'],
};
