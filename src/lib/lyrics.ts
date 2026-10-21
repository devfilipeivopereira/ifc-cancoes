import type { Song } from "./types";

export type LyricsAction =
  | { kind: "verified"; href: string }
  | { kind: "suggestion"; href: string; google?: string }
  | { kind: "google"; href: string }
  | { kind: "none" };

export function lyricsAction(song: Song): LyricsAction {
  const verified = song.link_letra_verificado === "sim" ? song.lyrics_url || song.link_letra : "";
  if (verified) return { kind: "verified", href: verified };
  const suggestion = song.letras_sugestao_nao_verificada.trim();
  const google = song.link_letra.trim();
  if (suggestion && google && suggestion !== google) return { kind: "suggestion", href: suggestion, google };
  if (suggestion) return { kind: "suggestion", href: suggestion };
  if (google) return { kind: "google", href: google };
  return { kind: "none" };
}
