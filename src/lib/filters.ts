import { performances, performancesBySong, songById } from "./data";
import { norm } from "./format";
import type { Performance, Song } from "./types";

export type SortKey = "usos" | "nome" | "ultimo" | "estreia" | "lancamento" | "artista";

export type Filters = {
  q: string;
  from: number | null;
  to: number | null;
  artista: string;
  tipo: string;
  estilo: string;
  versao: string;
  confianca: string;
  esquecidas: boolean;
  umaVez: boolean;
  sort: SortKey;
  dir: "asc" | "desc";
};

export const DEFAULT_FILTERS: Filters = {
  q: "",
  from: null,
  to: null,
  artista: "",
  tipo: "",
  estilo: "",
  versao: "",
  confianca: "",
  esquecidas: false,
  umaVez: false,
  sort: "usos",
  dir: "desc",
};

const SORT_KEYS = new Set<SortKey>(["usos", "nome", "ultimo", "estreia", "lancamento", "artista"]);

function numberOrNull(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function filtersFromParams(params: URLSearchParams): Filters {
  const sort = params.get("ordem");
  return {
    q: params.get("q") ?? "",
    from: numberOrNull(params.get("de")),
    to: numberOrNull(params.get("ate")),
    artista: params.get("artista") ?? "",
    tipo: params.get("tipo") ?? "",
    estilo: params.get("estilo") ?? "",
    versao: params.get("versao") ?? "",
    confianca: params.get("confianca") ?? "",
    esquecidas: params.get("esquecidas") === "1",
    umaVez: params.get("uma") === "1",
    sort: sort && SORT_KEYS.has(sort as SortKey) ? (sort as SortKey) : "usos",
    dir: params.get("dir") === "asc" ? "asc" : "desc",
  };
}

export function paramsFromFilters(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("de", String(filters.from));
  if (filters.to) params.set("ate", String(filters.to));
  if (filters.artista) params.set("artista", filters.artista);
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.estilo) params.set("estilo", filters.estilo);
  if (filters.versao) params.set("versao", filters.versao);
  if (filters.confianca) params.set("confianca", filters.confianca);
  if (filters.esquecidas) params.set("esquecidas", "1");
  if (filters.umaVez) params.set("uma", "1");
  if (filters.sort !== "usos") params.set("ordem", filters.sort);
  if (filters.dir !== "desc") params.set("dir", filters.dir);
  return params;
}

export function hasActiveFilters(filters: Filters) {
  return Boolean(
    filters.q ||
      filters.from ||
      filters.to ||
      filters.artista ||
      filters.tipo ||
      filters.estilo ||
      filters.versao ||
      filters.confianca ||
      filters.esquecidas ||
      filters.umaVez,
  );
}

export function activeFilterCount(filters: Filters) {
  return [
    filters.q,
    filters.from,
    filters.to,
    filters.artista,
    filters.tipo,
    filters.estilo,
    filters.versao,
    filters.confianca,
    filters.esquecidas,
    filters.umaVez,
  ].filter(Boolean).length;
}

export type FilterResult = {
  songs: Song[];
  perfs: Performance[];
  narrow: boolean;
  counts: Map<string, number>;
};

export function applyFilters(filters: Filters, source: Song[] = songList()): FilterResult {
  const query = norm(filters.q.trim());
  const artist = norm(filters.artista.trim());
  let from = filters.from;
  let to = filters.to;
  if (from && to && from > to) [from, to] = [to, from];
  const narrow = Boolean(from || to || filters.tipo);

  const matched = source.filter((song) => {
    if (artist && !norm(song.artista_ministerio).includes(artist)) return false;
    if (filters.estilo && song.estilo !== filters.estilo) return false;
    if (filters.versao && song.versao_estrangeira !== filters.versao) return false;
    if (filters.confianca && song.confianca !== filters.confianca) return false;
    if (filters.esquecidas && song.usos_ultimos_12m !== 0) return false;
    if (filters.umaVez && song.total_usos !== 1) return false;
    if (query) {
      const haystack = norm(
        [
          song.musica,
          song.titulo_canonico,
          song.artista_ministerio,
          song.titulo_original,
          song.artista_original,
          song.compositores,
          song.estilo,
        ].join(" "),
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const ids = new Set(matched.map((song) => song.id));
  let perfs = performances.filter((perf) => ids.has(perf.songId));
  if (filters.tipo) perfs = perfs.filter((perf) => perf.tipo === filters.tipo);
  if (from) perfs = perfs.filter((perf) => perf.year != null && perf.year >= from);
  if (to) perfs = perfs.filter((perf) => perf.year != null && perf.year <= to);

  const counts = new Map<string, number>();
  for (const perf of perfs) counts.set(perf.songId, (counts.get(perf.songId) ?? 0) + 1);

  const songs = narrow ? matched.filter((song) => (counts.get(song.id) ?? 0) > 0) : matched;
  return { songs, perfs, narrow, counts };
}

function songList() {
  return [...songById.values()];
}

export function songUses(song: Song, result: FilterResult) {
  return result.narrow ? (result.counts.get(song.id) ?? 0) : song.total_usos;
}

export function compareSongs(a: Song, b: Song, filters: Filters, result: FilterResult) {
  const sign = filters.dir === "asc" ? 1 : -1;
  if (filters.sort === "usos") {
    const delta = songUses(a, result) - songUses(b, result);
    if (delta) return delta * sign;
  } else if (filters.sort === "nome") {
    const delta = a.musica.localeCompare(b.musica, "pt");
    if (delta) return delta * sign;
  } else if (filters.sort === "artista") {
    const delta = a.artista_ministerio.localeCompare(b.artista_ministerio, "pt");
    if (delta) return delta * sign;
  } else if (filters.sort === "ultimo") {
    const delta = compareText(a.ultimo_uso, b.ultimo_uso, sign);
    if (delta) return delta;
  } else if (filters.sort === "estreia") {
    const delta = compareText(a.primeiro_uso, b.primeiro_uso, sign);
    if (delta) return delta;
  } else if (filters.sort === "lancamento") {
    const delta = compareNumber(launch(a), launch(b), sign);
    if (delta) return delta;
  }
  return a.musica.localeCompare(b.musica, "pt");
}

function launch(song: Song) {
  return typeof song.ano_lancamento === "number" && song.ano_lancamento > 0 ? song.ano_lancamento : null;
}

function compareText(a: string, b: string, sign: number) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b) * sign;
}

function compareNumber(a: number | null, b: number | null, sign: number) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * sign;
}

export function performancesOf(songId: string) {
  return performancesBySong.get(songId) ?? [];
}
