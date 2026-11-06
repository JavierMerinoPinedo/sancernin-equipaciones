'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server.ts';

export async function signIn(_prev: { error?: string } | undefined, form: FormData) {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Escribe tu email y contraseña.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Email o contraseña incorrectos. Revísalos o pide acceso al club.' };
  redirect('/');
}
