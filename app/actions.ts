'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { DATA_TAG } from '@/lib/data.ts';
import { requireUser } from '@/lib/supabase/server.ts';
import { runSync } from '@/lib/sync.ts';

const HEX = /^#[0-9A-F]{6}$/i;

export async function saveOverride(rivalTeamId: string, rivalName: string, shirt: string, pants: string | null) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: 'Tu sesión ha caducado. Vuelve a entrar.' };
  if (!rivalTeamId || !HEX.test(shirt) || (pants && !HEX.test(pants))) return { error: 'Color no válido' };
  const { error } = await supabase.from('rival_overrides').upsert({
    rival_team_id: rivalTeamId, rival_name: rivalName, shirt: shirt.toUpperCase(), pants: pants?.toUpperCase() ?? null,
    updated_by: user.id, updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidateTag(DATA_TAG);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetOverride(rivalTeamId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: 'Tu sesión ha caducado. Vuelve a entrar.' };
  const { error } = await supabase.from('rival_overrides').delete().eq('rival_team_id', rivalTeamId);
  if (error) return { error: error.message };
  revalidateTag(DATA_TAG);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function syncNow() {
  const { user } = await requireUser();
  if (!user) return { error: 'Tu sesión ha caducado. Vuelve a entrar.' };
  const r = await runSync('manual');
  revalidatePath('/', 'layout');
  return r.ok ? { ok: true, msg: `${r.matches} partidos leídos, ${r.changes} cambios.` } : { error: r.errors.join(' · ') };
}

export async function changePassword(_prev: unknown, form: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: 'Tu sesión ha caducado. Vuelve a entrar.' };
  const p1 = String(form.get('password') ?? '');
  const p2 = String(form.get('password2') ?? '');
  if (p1.length < 8) return { error: 'Mínimo 8 caracteres.' };
  if (p1 !== p2) return { error: 'Las contraseñas no coinciden.' };
  const { error } = await supabase.auth.updateUser({ password: p1 });
  return error ? { error: error.message } : { ok: 'Contraseña cambiada.' };
}
