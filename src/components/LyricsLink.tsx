import { lyricsAction } from "../lib/lyrics";
import type { Song } from "../lib/types";
import { IconExternal } from "./Icons";

export function LyricsLink({ song, size = "md" }: { song: Song; size?: "sm" | "md" }) {
  const action = lyricsAction(song);
  if (action.kind === "none") return <span className="text-sm text-muted">Sem link de letra</span>;
  const button = size === "sm" ? "btn btn-sm" : "btn";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {action.kind === "verified" ? (
        <a className={`${button} btn-primary`} href={action.href} target="_blank" rel="noopener noreferrer">
          Ver letra
          <IconExternal className="h-4 w-4" />
        </a>
      ) : null}
      {action.kind === "suggestion" ? (
        <a className={`${button} btn-primary`} href={action.href} target="_blank" rel="noopener noreferrer">
          Ver letra
          <span className="badge badge-warn">sugestão</span>
          <IconExternal className="h-4 w-4" />
        </a>
      ) : null}
      {action.kind === "google" ? (
        <a className={`${button} btn-ghost`} href={action.href} target="_blank" rel="noopener noreferrer">
          Buscar letra
          <IconExternal className="h-4 w-4" />
        </a>
      ) : null}
      {action.kind === "suggestion" && action.google ? (
        <a className={`${button} btn-ghost`} href={action.google} target="_blank" rel="noopener noreferrer">
          Buscar no Google
          <IconExternal className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
