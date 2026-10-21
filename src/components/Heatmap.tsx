import { useMemo } from "react";
import { Link } from "react-router-dom";
import { undatedUses } from "../lib/data";
import { ANOS } from "../lib/format";
import { useTheme } from "../lib/theme";
import type { Song } from "../lib/types";

export function Heatmap({ songs }: { songs: Song[] }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const top = useMemo(
    () => [...songs].sort((a, b) => b.total_usos - a.total_usos || a.musica.localeCompare(b.musica, "pt")).slice(0, 30),
    [songs],
  );
  const showUndated = top.some((song) => undatedUses(song) > 0);
  let max = 1;
  for (const song of top) {
    for (const year of ANOS) max = Math.max(max, song.usos_por_ano[String(year)] ?? 0);
    max = Math.max(max, undatedUses(song));
  }

  const color = (value: number) => {
    if (!value) return dark ? "rgba(255,255,255,0.05)" : "rgba(109,47,203,0.06)";
    const amount = value / max;
    return `hsla(262, 64%, ${dark ? 68 : 46}%, ${0.2 + amount * 0.8})`;
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted md:hidden">Deslize para o lado para ver os anos.</p>
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
      <table className="heat min-w-[760px]">
        <thead>
          <tr>
            <th className="min-w-40 px-2 py-1 text-left">Música</th>
            {ANOS.map((year) => (
              <th key={year} className="px-1 text-center font-semibold text-muted">
                {String(year).slice(2)}
              </th>
            ))}
            {showUndated ? <th className="px-1 text-center font-semibold text-muted">s/ data</th> : null}
          </tr>
        </thead>
        <tbody>
          {top.map((song) => (
            <tr key={song.id}>
              <td className="max-w-36 px-2 py-0.5 sm:max-w-48">
                <Link to={`/musicas/${song.id}`} className="block truncate font-semibold hover:underline" title={song.musica}>
                  {song.musica}
                </Link>
              </td>
              {ANOS.map((year) => {
                const value = song.usos_por_ano[String(year)] ?? 0;
                const strong = value / max > 0.55;
                return (
                  <td key={year}>
                    <div
                      className="grid h-7 min-w-8 place-items-center rounded-md text-[11px] font-bold"
                      style={{ background: color(value), color: strong ? "white" : "var(--ink)" }}
                      title={`${song.musica} em ${year}: ${value}`}
                    >
                      {value || ""}
                    </div>
                  </td>
                );
              })}
              {showUndated ? (
                <td>
                  <div
                    className="grid h-7 min-w-8 place-items-center rounded-md text-[11px] font-bold"
                    style={{
                      background: color(undatedUses(song)),
                      color: undatedUses(song) / max > 0.55 ? "white" : "var(--ink)",
                    }}
                  >
                    {undatedUses(song) || ""}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
