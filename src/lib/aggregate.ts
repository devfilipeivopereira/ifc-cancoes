import { songById } from "./data";
import { ANOS, decadeIndex, DIAS_CURTOS, labelDecada, MESES_CURTOS } from "./format";
import type { Performance, Song } from "./types";

export type YearPoint = { ano: string; execucoes: number; eventos: number };

export function yearPoints(perfs: Performance[]): YearPoint[] {
  return ANOS.map((ano) => {
    let execucoes = 0;
    const events = new Set<string>();
    for (const perf of perfs) {
      if (perf.year !== ano) continue;
      execucoes += 1;
      events.add(perf.eventId);
    }
    return { ano: String(ano), execucoes, eventos: events.size };
  });
}

export function newSongsByYear(songList: Song[]) {
  const map = new Map<number, number>();
  for (const song of songList) {
    if (!song.primeiro_uso) continue;
    const year = Number(song.primeiro_uso.slice(0, 4));
    if (!year) continue;
    map.set(year, (map.get(year) ?? 0) + 1);
  }
  return ANOS.map((ano) => ({ ano: String(ano), novas: map.get(ano) ?? 0 }));
}

export function rankArtists(perfs: Performance[], limit = 12) {
  const exec = new Map<string, number>();
  const songs = new Map<string, Set<string>>();
  for (const perf of perfs) {
    const song = songById.get(perf.songId);
    if (!song) continue;
    const name = song.artista_ministerio || "desconhecido";
    exec.set(name, (exec.get(name) ?? 0) + 1);
    const set = songs.get(name) ?? new Set<string>();
    set.add(song.id);
    songs.set(name, set);
  }
  return [...exec.entries()]
    .map(([artista, execucoes]) => ({
      artista,
      execucoes,
      musicas: songs.get(artista)?.size ?? 0,
    }))
    .sort((a, b) => b.execucoes - a.execucoes || a.artista.localeCompare(b.artista, "pt"))
    .slice(0, limit);
}

export function originSplit(perfs: Performance[], songList: Song[]) {
  const buckets = {
    não: { key: "não", nome: "Nacional", execucoes: 0, musicas: 0 },
    sim: { key: "sim", nome: "Versão estrangeira", execucoes: 0, musicas: 0 },
    desconhecido: { key: "desconhecido", nome: "Não identificado", execucoes: 0, musicas: 0 },
  };
  const keyOf = (value: string) => (value === "sim" || value === "não" ? value : "desconhecido");
  for (const song of songList) buckets[keyOf(song.versao_estrangeira)].musicas += 1;
  for (const perf of perfs) {
    const song = songById.get(perf.songId);
    if (!song) continue;
    buckets[keyOf(song.versao_estrangeira)].execucoes += 1;
  }
  return [buckets.não, buckets.sim, buckets.desconhecido].filter((bucket) => bucket.musicas > 0 || bucket.execucoes > 0);
}

export function rankDecades(songList: Song[], perfs: Performance[]) {
  const musicas = new Map<string, number>();
  const exec = new Map<string, number>();
  for (const song of songList) {
    const key = song.decada || "desconhecida";
    musicas.set(key, (musicas.get(key) ?? 0) + 1);
  }
  for (const perf of perfs) {
    const song = songById.get(perf.songId);
    if (!song) continue;
    const key = song.decada || "desconhecida";
    exec.set(key, (exec.get(key) ?? 0) + 1);
  }
  return [...new Set([...musicas.keys(), ...exec.keys()])]
    .map((key) => ({
      key,
      label: labelDecada(key),
      musicas: musicas.get(key) ?? 0,
      execucoes: exec.get(key) ?? 0,
    }))
    .sort((a, b) => decadeIndex(a.key) - decadeIndex(b.key));
}

export function rankTypes(perfs: Performance[]) {
  const exec = new Map<string, number>();
  const events = new Map<string, Set<string>>();
  for (const perf of perfs) {
    exec.set(perf.tipo, (exec.get(perf.tipo) ?? 0) + 1);
    const set = events.get(perf.tipo) ?? new Set<string>();
    set.add(perf.eventId);
    events.set(perf.tipo, set);
  }
  return [...exec.entries()]
    .map(([tipo, execucoes]) => ({ tipo, execucoes, eventos: events.get(tipo)?.size ?? 0 }))
    .sort((a, b) => b.eventos - a.eventos || a.tipo.localeCompare(b.tipo, "pt"));
}

export function rankStyles(perfs: Performance[], songList: Song[]) {
  const musicas = new Map<string, number>();
  const exec = new Map<string, number>();
  for (const song of songList) musicas.set(song.estilo, (musicas.get(song.estilo) ?? 0) + 1);
  for (const perf of perfs) {
    const song = songById.get(perf.songId);
    if (!song) continue;
    exec.set(song.estilo, (exec.get(song.estilo) ?? 0) + 1);
  }
  return [...musicas.entries()]
    .map(([estilo, count]) => ({ estilo, musicas: count, execucoes: exec.get(estilo) ?? 0 }))
    .sort((a, b) => b.execucoes - a.execucoes || a.estilo.localeCompare(b.estilo, "pt"));
}

export function monthPoints(perfs: Performance[]) {
  const exec = Array.from({ length: 12 }, () => 0);
  const events = Array.from({ length: 12 }, () => new Set<string>());
  for (const perf of perfs) {
    if (perf.month == null) continue;
    exec[perf.month - 1] += 1;
    events[perf.month - 1].add(perf.eventId);
  }
  return MESES_CURTOS.map((mes, index) => ({
    mes,
    execucoes: exec[index],
    eventos: events[index].size,
  }));
}

export function weekdayPoints(perfs: Performance[]) {
  const events = Array.from({ length: 7 }, () => new Set<string>());
  for (const perf of perfs) {
    if (perf.weekday == null) continue;
    events[perf.weekday].add(perf.eventId);
  }
  return DIAS_CURTOS.map((dia, index) => ({ dia, eventos: events[index].size }));
}

export function topSongs(songList: Song[], limit = 20) {
  return [...songList].sort((a, b) => b.total_usos - a.total_usos || a.musica.localeCompare(b.musica, "pt")).slice(0, limit);
}
