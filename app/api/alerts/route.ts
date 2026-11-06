import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server.ts';
import { loadAlerts } from '@/lib/data.ts';
import { todayMadrid } from '@/lib/dates.ts';

export const dynamic = 'force-dynamic';

// Contador de la pestaña Avisos. Se pide desde el navegador para que el layout
// siga sin datos y se pinte al instante.
export async function GET() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { count } = await loadAlerts(todayMadrid());
  return NextResponse.json({ count }, { headers: { 'cache-control': 'private, max-age=60' } });
}
