import { computeKit, type MatchRow, type Override } from '@/lib/kit.ts';
import { parseColors } from '@/lib/colors.ts';
import { hhmm, parseLocal } from '@/lib/dates.ts';
import { CHANGE_LABEL } from '@/lib/diff.ts';
import type { ChangeRow } from '@/lib/data.ts';
import { Shirt, Shorts } from './Figures.tsx';
import RivalKit from './RivalKit.tsx';

export default function MatchCard({ m, override, changes }: { m: MatchRow; override?: Override | null; changes?: ChangeRow[] }) {
  const kit = computeKit(m, override);
  const dt = parseLocal(m.local_dt);
  const map = m.lat && m.lng
    ? `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.field_name ?? ''} ${m.field_town ?? ''}`)}`;
  const score = m.local_score != null && m.visitor_score != null ? `${m.local_score} - ${m.visitor_score}` : null;
  const changed = !!changes?.length;

  return (
    <article className={`card ${changed ? 'changed' : ''}`}>
      <div className="top">
        <div>
          <div className={`time ${m.time_tbd ? 'tbd' : ''}`}>
            {m.time_tbd ? 'Hora por confirmar' : hhmm(dt)}
            {score && <small style={{ fontSize: 13, color: '#6b7280' }}> ({score})</small>}
          </div>
          <div className="cat">{m.category.replace(/^JDN - /, '')}{m.competition ? ` · ${m.competition}` : ''}</div>
        </div>
        <span className={`badge ${m.is_home ? 'home' : 'away'}`}>{m.is_home ? 'Local' : 'Visitante'}</span>
      </div>
      <div className="teams">
        {m.is_home
          ? <><span className="us">{m.our_team_name}</span><span className="vs">vs</span>{m.rival_name}</>
          : <>{m.rival_name}<span className="vs">vs</span><span className="us">{m.our_team_name}</span></>}
      </div>
      {m.field_name && <div className="place">📍 <a href={map} target="_blank" rel="noopener noreferrer">{m.field_name}{m.field_town ? ` · ${m.field_town}` : ''}</a></div>}
      <div className="kits">
        <div className="kit ours">
          <div className="figs"><Shirt colors={[kit.shirt.hex]} size={34} /><Shorts color={kit.pants.hex} size={26} /></div>
          <div><div className="k-lbl">Nosotros</div><div className="k-val">{kit.shirt.name} / {kit.pants.name}</div><div className="k-sub">camiseta / pantalón</div></div>
        </div>
        <RivalKit rivalTeamId={m.rival_team_id} rivalName={m.rival_name} shirt={kit.rivalShirt} pants={kit.rivalPants}
          fnbShirt={parseColors(m.rival_shirt_raw)} fromOverride={kit.rivalFromOverride} />
      </div>
      {kit.note && <div className={`note ${kit.note.tone === 'info' ? 'info' : ''}`}>{kit.note.text}</div>}
      {changed && (
        <div className="changes">
          <b>Cambios recientes</b>
          {changes!.map((c) => (
            <div key={c.id}>{CHANGE_LABEL[c.field] ?? c.field}{c.old_value || c.new_value ? `: ${c.old_value ?? '—'} → ${c.new_value ?? '—'}` : ''}</div>
          ))}
        </div>
      )}
    </article>
  );
}
