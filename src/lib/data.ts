import songsJson from "../../data/songs.json";
import eventsJson from "../../data/events.json";
import type { Culto, Performance, Song } from "./types";

export { stats } from "./stats";

export const songs = songsJson as unknown as Song[];
export const events = eventsJson as unknown as Culto[];

for (const event of events) {
  if (!event.data) event.data = "";
}

export const songById = new Map(songs.map((song) => [song.id, song]));
export const songByTitle = new Map(songs.map((song) => [song.musica, song]));
export const eventById = new Map(events.map((event) => [event.id, event]));

function partsOf(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, weekday };
}

export const performances: Performance[] = events.flatMap((event) => {
  const parts = event.data ? partsOf(event.data) : null;
  return event.musicas.flatMap((title) => {
    const song = songByTitle.get(title);
    if (!song) return [];
    return [
      {
        songId: song.id,
        title,
        date: event.data,
        year: parts?.year ?? null,
        month: parts?.month ?? null,
        weekday: parts?.weekday ?? null,
        tipo: event.tipo,
        eventId: event.id,
        eventName: event.evento,
      },
    ];
  });
});

export const performancesBySong = new Map<string, Performance[]>();
for (const performance of performances) {
  const list = performancesBySong.get(performance.songId);
  if (list) list.push(performance);
  else performancesBySong.set(performance.songId, [performance]);
}

function byCount(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([value]) => value);
}

export const TIPOS = byCount(events.map((event) => event.tipo));
export const ESTILOS = byCount(songs.map((song) => song.estilo));
export const ARTISTAS = [...new Set(songs.map((song) => song.artista_ministerio))].sort((a, b) =>
  a.localeCompare(b, "pt"),
);
export const CONFIANCAS = ["alta", "média", "baixa"];
export const VERSOES = ["não", "sim", "desconhecido"];

export function launchYear(song: Song) {
  return typeof song.ano_lancamento === "number" && song.ano_lancamento > 0 ? song.ano_lancamento : null;
}

export function datedUses(song: Song) {
  let total = 0;
  for (const value of Object.values(song.usos_por_ano)) total += value;
  return total;
}

export function undatedUses(song: Song) {
  return Math.max(0, song.total_usos - datedUses(song));
}

export function isApproximate(song: Song) {
  return song.confianca === "baixa" || song.artista_divergente === "sim";
}

export function approximateReason(song: Song) {
  const low = song.confianca === "baixa";
  const diverges = song.artista_divergente === "sim";
  if (low && diverges) return "A confiança do metadado é baixa e o artista do Presenter diverge de outras fontes.";
  if (low) return "A confiança deste metadado é baixa.";
  return "O artista informado no Presenter diverge de outras fontes.";
}
