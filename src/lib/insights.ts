import { events, songByTitle, songs, stats } from "./data";
import { ANOS, decadeIndex, norm } from "./format";
import type { Song } from "./types";

export type SongHit = {
  id: string;
  title: string;
  uses: number;
  last: string;
  recent: number;
  previous: number;
  confidence: string;
  firm: boolean;
  gapDays: number | null;
};

export type YearHealth = {
  year: number;
  partial: boolean;
  events: number;
  executions: number;
  distinct: number;
  top10: number;
  top20: number;
  introduced: number;
  returned: number;
};

export type PairHit = {
  a: SongHit;
  b: SongHit;
  count: number;
  lift: number;
};

export type SeasonalHit = {
  song: SongHit;
  month: number;
  count: number;
  total: number;
};

export type TypeProfile = {
  tipo: string;
  events: number;
  withSongs: number;
  mean: number;
  median: number;
  top: SongHit[];
};

export type SectionFlow = {
  steps: string[];
  count: number;
};

export type InsightReport = {
  generated: string;
  start12: string;
  start6: string;
  previousStart: string;
  firstDate: string;
  lastDate: string;
  catalog: number;
  executions: number;
  services: number;
  datedServices: number;
  undatedServices: number;
  undatedExecutions: number;
  active12: number;
  active6: number;
  years: YearHealth[];
  peakYear: YearHealth;
  latestFullYear: YearHealth;
  meanSongs: number;
  medianSongs: number;
  debutShare: number;
  servicesWithDebut: number;
  datedServicesWithSongs: number;
  worn: SongHit[];
  rising: SongHit[];
  falling: SongHit[];
  fastest: SongHit[];
  medianGap: number | null;
  forgotten: SongHit[];
  introduced: number;
  returned: number;
  caughtOn: number;
  abandoned: number;
  repeatWithin56: number;
  medianRepeat56: number;
  meanRepeat56: number;
  types: TypeProfile[];
  withSections: number;
  sectionShare: { name: string; count: number }[];
  sundayFlow: SectionFlow | null;
  sundayWithSections: number;
  pairs: PairHit[];
  frequentPair: PairHit | null;
  seasonal: SeasonalHit[];
  seasonalTitles: { natal: number; pascoa: number };
  firmSongs: number;
  lowConfidence: number;
  divergentArtists: number;
  artists: { name: string; executions: number; songs: number; firm: boolean }[];
  firmArtists: { name: string; executions: number; songs: number }[];
  foreignSongs: number;
  foreignExecutions: number;
  styles: { name: string; songs: number; executions: number; low: number }[];
  decades: { name: string; songs: number; executions: number; low: number }[];
  forNextService: SongHit[];
  reintroduce: SongHit[];
};

const SECTION_ORDER = ["abertura", "louvor", "avisos", "oração", "dízimos e ofertas", "palavra", "ceia", "final"];

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addMonths(iso: string, delta: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1 + delta, 1));
  const nextYear = cursor.getUTCFullYear();
  const nextMonth = cursor.getUTCMonth();
  const last = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  const nextDay = Math.min(day, last);
  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

function daysBetween(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const span = Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay);
  return Math.round(span / 86_400_000);
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day + days));
  return cursor.toISOString().slice(0, 10);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function firmSong(song: Song) {
  return song.confianca === "alta" && song.artista_divergente === "não";
}

function sectionBucket(name: string) {
  const value = norm(name).replace(/\s+/g, " ").trim();
  if (!value || value.includes("branco")) return null;
  if (value.includes("dizi") || value.includes("ofert")) return "dízimos e ofertas";
  if (value.startsWith("ora") || value.includes("orac")) return "oração";
  if (value.includes("avis")) return "avisos";
  if (value.includes("ceia")) return "ceia";
  if (value.includes("palavra") || value.includes("preg") || value.includes("mensagem")) return "palavra";
  if (value.includes("abert")) return "abertura";
  if (value.includes("final") || value.includes("encerr") || value === "fim") return "final";
  if (value.includes("louv") || value.includes("music") || value.includes("canco")) return "louvor";
  return null;
}

function hitFrom(song: Song, extra: Partial<SongHit> = {}): SongHit {
  return {
    id: song.id,
    title: song.musica,
    uses: song.total_usos,
    last: song.ultimo_uso,
    recent: extra.recent ?? song.usos_ultimos_12m,
    previous: extra.previous ?? 0,
    confidence: song.confianca,
    firm: firmSong(song),
    gapDays: extra.gapDays ?? null,
  };
}

export function buildInsights(): InsightReport {
  const generated = stats.gerado_em;
  const start12 = addMonths(generated, -12);
  const start6 = addMonths(generated, -6);
  const previousStart = addMonths(start12, -12);
  const refYear = Number(generated.slice(0, 4));

  const datedDates = events.map((event) => event.data).filter(isDate).sort();
  const byTitle = songByTitle;
  const datedUses = new Map<string, string[]>();
  const recent = new Map<string, number>();
  const previous = new Map<string, number>();
  const monthCounts = new Map<string, number[]>();
  const typeCounts = new Map<string, Map<string, number>>();
  let undatedExecutions = 0;

  for (const event of events) {
    const dated = isDate(event.data);
    for (const title of event.musicas) {
      const song = byTitle.get(title);
      if (!song) continue;
      const typeBucket = typeCounts.get(event.tipo) ?? new Map<string, number>();
      typeBucket.set(song.id, (typeBucket.get(song.id) ?? 0) + 1);
      typeCounts.set(event.tipo, typeBucket);
      if (!dated) {
        undatedExecutions += 1;
        continue;
      }
      const list = datedUses.get(song.id) ?? [];
      list.push(event.data);
      datedUses.set(song.id, list);
      if (event.data >= start12 && event.data <= generated) recent.set(song.id, (recent.get(song.id) ?? 0) + 1);
      else if (event.data >= previousStart && event.data < start12) previous.set(song.id, (previous.get(song.id) ?? 0) + 1);
      const months = monthCounts.get(song.id) ?? Array.from({ length: 12 }, () => 0);
      months[Number(event.data.slice(5, 7)) - 1] += 1;
      monthCounts.set(song.id, months);
    }
  }

  const gapOf = new Map<string, number>();
  const uniqueCount = new Map<string, number>();
  const gapSamples: number[] = [];
  for (const [id, dates] of datedUses) {
    const unique = [...new Set(dates)].sort();
    uniqueCount.set(id, unique.length);
    if (unique.length < 3) continue;
    let total = 0;
    for (let index = 1; index < unique.length; index += 1) total += daysBetween(unique[index - 1], unique[index]);
    const mean = total / (unique.length - 1);
    gapOf.set(id, mean);
    if (unique.length >= 8) gapSamples.push(mean);
  }

  const years: YearHealth[] = ANOS.map((year) => {
    const prefix = String(year);
    const yearEvents = events.filter((event) => event.data.startsWith(prefix));
    const counts = new Map<string, number>();
    let executions = 0;
    for (const event of yearEvents) {
      for (const title of event.musicas) {
        const song = byTitle.get(title);
        if (!song) continue;
        executions += 1;
        counts.set(song.id, (counts.get(song.id) ?? 0) + 1);
      }
    }
    const ranked = [...counts.values()].sort((a, b) => b - a);
    const top = (limit: number) => ranked.slice(0, limit).reduce((sum, value) => sum + value, 0) / (executions || 1);
    const introducedSongs = songs.filter((song) => song.primeiro_uso.startsWith(prefix));
    const returned = introducedSongs.filter((song) => (datedUses.get(song.id) ?? []).some((date) => date > song.primeiro_uso)).length;
    return {
      year,
      partial: year >= refYear,
      events: yearEvents.length,
      executions,
      distinct: counts.size,
      top10: top(10),
      top20: top(20),
      introduced: introducedSongs.length,
      returned,
    };
  });
  const fullYears = years.filter((year) => !year.partial && year.executions > 0);
  const peakYear = fullYears.reduce((best, year) => (year.top20 > best.top20 ? year : best));
  const latestFullYear = fullYears[fullYears.length - 1];

  const withSongs = events.filter((event) => event.musicas.length > 0);
  const lengths = withSongs.map((event) => event.musicas.length);
  const types: TypeProfile[] = [...new Set(events.map((event) => event.tipo))]
    .map((tipo) => {
      const group = events.filter((event) => event.tipo === tipo);
      const filled = group.filter((event) => event.musicas.length > 0);
      const filledLengths = filled.map((event) => event.musicas.length);
      const ranking = [...(typeCounts.get(tipo)?.entries() ?? [])].sort((a, b) => b[1] - a[1]).slice(0, 3);
      return {
        tipo,
        events: group.length,
        withSongs: filled.length,
        mean: filledLengths.reduce((sum, value) => sum + value, 0) / (filledLengths.length || 1),
        median: median(filledLengths),
        top: ranking.flatMap(([id, uses]) => {
          const song = songs.find((item) => item.id === id);
          return song ? [{ ...hitFrom(song), uses }] : [];
        }),
      };
    })
    .filter((type) => type.withSongs > 0)
    .sort((a, b) => b.events - a.events);

  let debutSlots = 0;
  let datedSlots = 0;
  let servicesWithDebut = 0;
  let datedServicesWithSongs = 0;
  for (const event of events) {
    if (!isDate(event.data) || !event.musicas.length) continue;
    datedServicesWithSongs += 1;
    let debutsHere = 0;
    for (const title of event.musicas) {
      const song = byTitle.get(title);
      if (!song) continue;
      datedSlots += 1;
      if (song.primeiro_uso === event.data) {
        debutSlots += 1;
        debutsHere += 1;
      }
    }
    if (debutsHere) servicesWithDebut += 1;
  }

  const sectionEvents = events.filter((event) => event.secoes.length > 0);
  const sectionCounts = new Map<string, number>();
  for (const event of sectionEvents) {
    const seen = new Set<string>();
    for (const name of event.secoes) {
      const bucket = sectionBucket(name);
      if (bucket) seen.add(bucket);
    }
    for (const bucket of seen) sectionCounts.set(bucket, (sectionCounts.get(bucket) ?? 0) + 1);
  }
  const sectionShare = [...sectionCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => SECTION_ORDER.indexOf(a.name) - SECTION_ORDER.indexOf(b.name));

  const flows = new Map<string, { steps: string[]; count: number }>();
  let sundayWithSections = 0;
  for (const event of events) {
    if (event.tipo !== "Culto de Domingo" || !event.secoes.length) continue;
    const steps: string[] = [];
    for (const name of event.secoes) {
      const bucket = sectionBucket(name);
      if (bucket && steps[steps.length - 1] !== bucket) steps.push(bucket);
    }
    if (!steps.length) continue;
    sundayWithSections += 1;
    const key = steps.join(">");
    const current = flows.get(key);
    if (current) current.count += 1;
    else flows.set(key, { steps, count: 1 });
  }
  const sundayFlow = [...flows.values()].sort((a, b) => b.count - a.count)[0] ?? null;

  const usable = events.filter((event) => new Set(event.musicas.filter((title) => byTitle.has(title))).size >= 2);
  const contain = new Map<string, number>();
  const pairs = new Map<string, { a: string; b: string; count: number }>();
  for (const event of usable) {
    const titles = [...new Set(event.musicas.filter((title) => byTitle.has(title)))].sort((a, b) => a.localeCompare(b, "pt"));
    for (const title of titles) contain.set(title, (contain.get(title) ?? 0) + 1);
    for (let i = 0; i < titles.length; i += 1) {
      for (let j = i + 1; j < titles.length; j += 1) {
        const key = `${titles[i]}||${titles[j]}`;
        const current = pairs.get(key);
        if (current) current.count += 1;
        else pairs.set(key, { a: titles[i], b: titles[j], count: 1 });
      }
    }
  }
  const pairTotal = usable.length || 1;
  const pairHits = [...pairs.values()]
    .filter((pair) => pair.count >= 8)
    .map((pair) => {
      const songA = byTitle.get(pair.a)!;
      const songB = byTitle.get(pair.b)!;
      const lift = pair.count / pairTotal / ((contain.get(pair.a)! / pairTotal) * (contain.get(pair.b)! / pairTotal));
      return { a: hitFrom(songA), b: hitFrom(songB), count: pair.count, lift };
    })
    .sort((a, b) => b.lift - a.lift || b.count - a.count);
  const frequentPair = [...pairs.values()].sort((a, b) => b.count - a.count)[0];
  const frequent = frequentPair
    ? pairHits.find((pair) => pair.a.title === frequentPair.a && pair.b.title === frequentPair.b) ?? {
        a: hitFrom(byTitle.get(frequentPair.a)!),
        b: hitFrom(byTitle.get(frequentPair.b)!),
        count: frequentPair.count,
        lift:
          frequentPair.count /
          pairTotal /
          ((contain.get(frequentPair.a)! / pairTotal) * (contain.get(frequentPair.b)! / pairTotal)),
      }
    : null;

  const seasonal: SeasonalHit[] = [];
  for (const song of songs) {
    const months = monthCounts.get(song.id);
    if (!months) continue;
    const total = months.reduce((sum, value) => sum + value, 0);
    if (total < 8) continue;
    let month = 0;
    let count = 0;
    months.forEach((value, index) => {
      if (value > count) {
        count = value;
        month = index + 1;
      }
    });
    if (count / total >= 0.35 && count >= 4) seasonal.push({ song: hitFrom(song), month, count, total });
  }
  seasonal.sort((a, b) => b.count / b.total - a.count / a.total);

  let introduced = 0;
  let returned = 0;
  let caughtOn = 0;
  let abandoned = 0;
  let repeatHits = 0;
  const repeats: number[] = [];
  for (const song of songs) {
    if (!song.primeiro_uso) continue;
    introduced += 1;
    const dates = datedUses.get(song.id) ?? [];
    const later = dates.some((date) => date > song.primeiro_uso);
    if (later) returned += 1;
    const datedCount = dates.length;
    if (datedCount <= 2) abandoned += 1;
    const laterYear = dates.some((date) => date.slice(0, 4) > song.primeiro_uso.slice(0, 4));
    if (datedCount >= 4 || laterYear) caughtOn += 1;
    const limit = addDays(song.primeiro_uso, 56);
    const extra = dates.filter((date) => date > song.primeiro_uso && date <= limit).length;
    repeats.push(extra);
    if (extra >= 1) repeatHits += 1;
  }

  const songHit = (song: Song): SongHit =>
    hitFrom(song, { recent: recent.get(song.id) ?? 0, previous: previous.get(song.id) ?? 0, gapDays: gapOf.get(song.id) ?? null });

  const rising = songs
    .map(songHit)
    .filter((song) => song.recent >= 4 && song.recent >= song.previous + 3)
    .sort((a, b) => b.recent - b.previous - (a.recent - a.previous));
  const falling = songs
    .map(songHit)
    .filter((song) => song.previous >= 4 && song.recent <= song.previous - 3)
    .sort((a, b) => a.recent - a.previous - (b.recent - b.previous));
  const worn = songs
    .map(songHit)
    .filter((song) => song.recent >= 6)
    .sort((a, b) => b.recent - a.recent || b.uses - a.uses);
  const fastest = songs
    .map(songHit)
    .filter((song) => song.gapDays != null && (uniqueCount.get(song.id) ?? 0) >= 8)
    .sort((a, b) => (a.gapDays ?? 0) - (b.gapDays ?? 0))
    .slice(0, 5);
  const forgotten = songs
    .filter((song) => song.ultimo_uso && song.usos_ultimos_12m === 0 && song.total_usos >= 12)
    .sort((a, b) => b.total_usos - a.total_usos)
    .map(songHit);
  const forNextService = songs
    .filter((song) => {
      if (!firmSong(song) || !song.ultimo_uso || song.total_usos < 8) return false;
      const days = daysBetween(song.ultimo_uso, generated);
      return days >= 120 && days <= 320;
    })
    .sort((a, b) => b.total_usos - a.total_usos || a.musica.localeCompare(b.musica, "pt"))
    .slice(0, 8)
    .map(songHit);
  const reintroduce = songs
    .filter((song) => song.confianca !== "baixa" && song.ultimo_uso && song.total_usos >= 12 && song.usos_ultimos_12m === 0)
    .sort((a, b) => Number(firmSong(b)) - Number(firmSong(a)) || b.total_usos - a.total_usos)
    .slice(0, 8)
    .map(songHit);

  const artistAll = new Map<string, { executions: number; songs: number }>();
  const artistFirm = new Map<string, { executions: number; songs: number }>();
  const styleMap = new Map<string, { songs: number; executions: number; low: number }>();
  const decadeMap = new Map<string, { songs: number; executions: number; low: number }>();
  let foreignSongs = 0;
  let foreignExecutions = 0;
  for (const song of songs) {
    const name = song.artista_ministerio || "desconhecido";
    const all = artistAll.get(name) ?? { executions: 0, songs: 0 };
    all.executions += song.total_usos;
    all.songs += 1;
    artistAll.set(name, all);
    if (firmSong(song)) {
      const firm = artistFirm.get(name) ?? { executions: 0, songs: 0 };
      firm.executions += song.total_usos;
      firm.songs += 1;
      artistFirm.set(name, firm);
    }
    if (song.versao_estrangeira === "sim") {
      foreignSongs += 1;
      foreignExecutions += song.total_usos;
    }
    const style = styleMap.get(song.estilo) ?? { songs: 0, executions: 0, low: 0 };
    style.songs += 1;
    style.executions += song.total_usos;
    if (song.confianca === "baixa") style.low += 1;
    styleMap.set(song.estilo, style);
    const decade = song.decada || "desconhecida";
    const decadeRow = decadeMap.get(decade) ?? { songs: 0, executions: 0, low: 0 };
    decadeRow.songs += 1;
    decadeRow.executions += song.total_usos;
    if (song.confianca === "baixa") decadeRow.low += 1;
    decadeMap.set(decade, decadeRow);
  }

  const executions = songs.reduce((sum, song) => sum + song.total_usos, 0);
  return {
    generated,
    start12,
    start6,
    previousStart,
    firstDate: datedDates[0] ?? "",
    lastDate: datedDates[datedDates.length - 1] ?? "",
    catalog: songs.length,
    executions,
    services: events.length,
    datedServices: events.filter((event) => isDate(event.data)).length,
    undatedServices: events.filter((event) => !isDate(event.data)).length,
    undatedExecutions,
    active12: recent.size,
    active6: [...datedUses.entries()].filter(([, dates]) => dates.some((date) => date >= start6 && date <= generated)).length,
    years,
    peakYear,
    latestFullYear,
    meanSongs: lengths.reduce((sum, value) => sum + value, 0) / (lengths.length || 1),
    medianSongs: median(lengths),
    debutShare: debutSlots / (datedSlots || 1),
    servicesWithDebut,
    datedServicesWithSongs,
    worn,
    rising,
    falling,
    fastest,
    medianGap: gapSamples.length ? median(gapSamples) : null,
    forgotten,
    introduced,
    returned,
    caughtOn,
    abandoned,
    repeatWithin56: repeatHits / (introduced || 1),
    medianRepeat56: median(repeats),
    meanRepeat56: repeats.reduce((sum, value) => sum + value, 0) / (repeats.length || 1),
    types,
    withSections: sectionEvents.length,
    sectionShare,
    sundayFlow,
    sundayWithSections,
    pairs: pairHits.slice(0, 8),
    frequentPair: frequent,
    seasonal: seasonal.slice(0, 8),
    seasonalTitles: {
      natal: songs.filter((song) => norm(song.musica).includes("natal")).length,
      pascoa: songs.filter((song) => /pascoa|ressurre/.test(norm(song.musica))).length,
    },
    firmSongs: songs.filter(firmSong).length,
    lowConfidence: songs.filter((song) => song.confianca === "baixa").length,
    divergentArtists: songs.filter((song) => song.artista_divergente === "sim").length,
    artists: [...artistAll.entries()]
      .map(([name, value]) => ({ name, ...value, firm: false }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5),
    firmArtists: [...artistFirm.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5),
    foreignSongs,
    foreignExecutions,
    styles: [...styleMap.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.executions - a.executions),
    decades: [...decadeMap.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => decadeIndex(a.name) - decadeIndex(b.name)),
    forNextService,
    reintroduce,
  };
}

export const insights = buildInsights();

export function flowLabel(steps: string[]) {
  return steps.join(" → ");
}

export function typeByName(report: InsightReport, tipo: string) {
  return report.types.find((type) => type.tipo === tipo);
}
