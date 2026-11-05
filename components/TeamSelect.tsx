'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Team } from '@/lib/data.ts';

export default function TeamSelect({ teams, value }: { teams: Team[]; value: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <select aria-label="Equipo" value={value} onChange={(e) => {
      const p = new URLSearchParams(params.toString());
      if (e.target.value) p.set('team', e.target.value); else p.delete('team');
      router.push(`${path}?${p.toString()}`);
    }}>
      <option value="">Todos los equipos</option>
      {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  );
}
