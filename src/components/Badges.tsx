import { approximateReason, isApproximate } from "../lib/data";
import { labelEstilo, labelVersao } from "../lib/format";
import type { Song } from "../lib/types";

export function ConfidenceBadge({ value }: { value: string }) {
  const tone = value === "alta" ? "badge-ok" : value === "baixa" ? "badge-low" : "badge-warn";
  return <span className={`badge ${tone}`}>confiança {value}</span>;
}

export function ApproxBadge({ song }: { song: Song }) {
  if (!isApproximate(song)) return null;
  return (
    <span className="badge badge-warn" title={approximateReason(song)}>
      dados aproximados
    </span>
  );
}

export function SongBadges({ song }: { song: Song }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="badge badge-neutral">{labelEstilo(song.estilo)}</span>
      <span className="badge badge-neutral">{labelVersao(song.versao_estrangeira)}</span>
      <ConfidenceBadge value={song.confianca} />
      <ApproxBadge song={song} />
    </div>
  );
}
