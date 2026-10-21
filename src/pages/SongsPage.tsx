import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApproxBadge, ConfidenceBadge } from "../components/Badges";
import { ChartCard, ChartScroller, ComboChart, Donut, RankBars, useSeriesColors } from "../components/Charts";
import { FilterSheet } from "../components/FilterSheet";
import { LyricsLink } from "../components/LyricsLink";
import { originSplit, rankArtists, rankStyles, rankTypes, yearPoints } from "../lib/aggregate";
import { ARTISTAS, CONFIANCAS, ESTILOS, songs, TIPOS, VERSOES } from "../lib/data";
import { ANOS, formatDateShort, formatNumber, formatPercent, labelEstilo, labelVersao } from "../lib/format";
import {
  activeFilterCount,
  applyFilters,
  compareSongs,
  DEFAULT_FILTERS,
  filtersFromParams,
  hasActiveFilters,
  paramsFromFilters,
  songUses,
  type Filters,
  type SortKey,
} from "../lib/filters";
const SORTS: { sort: SortKey; dir: "asc" | "desc"; label: string }[] = [
  { sort: "usos", dir: "desc", label: "Mais cantadas" },
  { sort: "usos", dir: "asc", label: "Menos cantadas" },
  { sort: "nome", dir: "asc", label: "Nome (A–Z)" },
  { sort: "nome", dir: "desc", label: "Nome (Z–A)" },
  { sort: "ultimo", dir: "desc", label: "Último uso recente" },
  { sort: "estreia", dir: "desc", label: "Estreia recente" },
  { sort: "lancamento", dir: "desc", label: "Lançamento mais novo" },
  { sort: "artista", dir: "asc", label: "Artista (A–Z)" },
];

export function SongsPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const [draft, setDraft] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(false);
  const colors = useSeriesColors();

  useEffect(() => {
    document.title = "Músicas · Repertório IFC";
  }, []);

  useEffect(() => {
    setDraft(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = filtersRef.current;
      if (draft !== current.q) setParams(paramsFromFilters({ ...current, q: draft }), { replace: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [draft, setParams]);

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setParams(paramsFromFilters(next), { replace: true });
  }

  const result = useMemo(() => applyFilters(filters, songs), [filters]);
  const ordered = useMemo(
    () => [...result.songs].sort((a, b) => compareSongs(a, b, filters, result)),
    [filters, result],
  );
  const years = useMemo(() => yearPoints(result.perfs), [result.perfs]);
  const artists = useMemo(() => rankArtists(result.perfs, 8), [result.perfs]);
  const styles = useMemo(() => rankStyles(result.perfs, result.songs), [result]);
  const origin = useMemo(() => originSplit(result.perfs, result.songs), [result]);
  const types = useMemo(() => rankTypes(result.perfs), [result.perfs]);
  const cultos = new Set(result.perfs.map((item) => item.eventId)).size;
  const foreignExec = origin.find((item) => item.key === "sim")?.execucoes ?? 0;
  const active = hasActiveFilters(filters);

  function toggleSort(sort: SortKey) {
    if (filters.sort === sort) update({ dir: filters.dir === "asc" ? "desc" : "asc" });
    else update({ sort, dir: sort === "nome" || sort === "artista" ? "asc" : "desc" });
  }

  const fieldProps = { filters, draft, setDraft, update, active };

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-8">
      <header className="mb-4">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Repertório</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Músicas</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Busque, filtre e ordene as {formatNumber(songs.length)} músicas. Os gráficos desta página seguem o recorte.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
        <label className="field">
          Busca
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Título, artista, compositor" enterKeyHint="search" />
        </label>
        <button type="button" className="btn btn-primary mt-2 w-full" onClick={() => setShowFilters(true)}>
          Filtros{active ? ` (${activeFilterCount(filters)})` : ""}
        </button>
      </div>
      <FilterSheet open={showFilters} title="Filtros" onClose={() => setShowFilters(false)}>
        <div className="space-y-3">
          <FilterFields idPrefix="sheet" {...fieldProps} />
          <button type="button" className="btn btn-primary w-full" onClick={() => setShowFilters(false)}>
            Ver {formatNumber(ordered.length)} músicas
          </button>
        </div>
      </FilterSheet>

      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card sticky top-20 hidden space-y-3 p-4 lg:block">
          <FilterFields idPrefix="desk" includeSearch {...fieldProps} />
        </aside>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Músicas</p>
              <p className="mt-1 text-3xl font-extrabold text-primary">{formatNumber(ordered.length)}</p>
            </article>
            <article className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Execuções no recorte</p>
              <p className="mt-1 text-3xl font-extrabold text-primary">{formatNumber(result.perfs.length)}</p>
            </article>
            <article className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Cultos no recorte</p>
              <p className="mt-1 text-3xl font-extrabold text-primary">{formatNumber(cultos)}</p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <ChartCard title="Execuções por ano" subtitle="Estes gráficos acompanham os filtros." note="Um período ou tipo de culto deixa de fora execuções sem data.">
              <ChartScroller>
                <ComboChart data={years} labelKey="ano" bar={{ key: "execucoes", name: "Execuções" }} line={{ key: "eventos", name: "Cultos" }} caption="Execuções filtradas por ano" />
              </ChartScroller>
            </ChartCard>
            <ChartCard title="Nacional e versão estrangeira" subtitle="Fatia pelas execuções do recorte.">
              <Donut
                caption="Origem das execuções no recorte"
                center={
                  <div>
                    <p className="text-xl font-extrabold text-primary">
                      {formatPercent(result.perfs.length ? foreignExec / result.perfs.length : 0)}
                    </p>
                    <p className="text-[11px] font-semibold text-muted">estrangeiras</p>
                  </div>
                }
                slices={origin.map((item) => ({
                  key: item.key,
                  label: item.nome,
                  value: item.execucoes,
                  color: item.key === "sim" ? colors.estrangeira : item.key === "não" ? colors.nacional : colors.outro,
                  detail: `${formatNumber(item.execucoes)} · ${formatNumber(item.musicas)} músicas`,
                }))}
              />
            </ChartCard>
            <ChartCard title="Artistas no recorte">
              <RankBars
                rows={artists.map((artist) => ({
                  key: artist.artista,
                  label: artist.artista,
                  value: artist.execucoes,
                  hint: `${formatNumber(artist.musicas)} músicas`,
                }))}
              />
            </ChartCard>
            <ChartCard title="Estilo e tipo de culto">
              <RankBars
                rows={styles.map((item) => ({
                  key: item.estilo,
                  label: labelEstilo(item.estilo),
                  value: item.execucoes,
                  hint: `${formatNumber(item.musicas)} músicas`,
                }))}
              />
              <div className="mt-4 border-t border-line pt-3">
                <RankBars
                  valueLabel="cultos"
                  rows={types.map((type) => ({
                    key: type.tipo,
                    label: type.tipo,
                    value: type.eventos,
                    hint: `${formatNumber(type.execucoes)} exec.`,
                  }))}
                />
              </div>
            </ChartCard>
          </div>

          <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {formatNumber(ordered.length)} {ordered.length === 1 ? "música" : "músicas"}
              {result.narrow ? " · usos contados dentro do período ou tipo" : ""}
            </p>
            <label className="field min-w-52">
              Ordenar
              <select
                value={`${filters.sort}:${filters.dir}`}
                onChange={(event) => {
                  const [sort, dir] = event.target.value.split(":") as [SortKey, "asc" | "desc"];
                  update({ sort, dir });
                }}
              >
                {SORTS.map((option) => (
                  <option key={`${option.sort}:${option.dir}`} value={`${option.sort}:${option.dir}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {ordered.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-lg font-extrabold">Nenhuma música neste recorte</p>
              <p className="mt-1 text-sm text-muted">Afrouxe um filtro ou limpe a busca.</p>
            </div>
          ) : (
            <>
              <div className="card hidden overflow-hidden lg:block">
                <table className="table">
                  <thead>
                    <tr>
                      <SortHeader label="Música" sort="nome" filters={filters} onSort={toggleSort} />
                      <SortHeader label="Artista" sort="artista" filters={filters} onSort={toggleSort} />
                      <th>Estilo</th>
                      <SortHeader label={result.narrow ? "Usos no recorte" : "Usos"} sort="usos" filters={filters} onSort={toggleSort} />
                      <SortHeader label="Último uso" sort="ultimo" filters={filters} onSort={toggleSort} />
                      <th>Confiança</th>
                      <th>Letra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map((song) => (
                      <tr key={song.id} className="cv-item">
                        <td>
                          <Link to={`/musicas/${song.id}`} className="font-bold hover:underline">
                            {song.musica}
                          </Link>
                          {song.versao_estrangeira === "sim" && song.titulo_original ? (
                            <span className="mt-0.5 block text-xs text-muted">versão de {song.titulo_original}</span>
                          ) : null}
                        </td>
                        <td>{song.artista_ministerio}</td>
                        <td>{labelEstilo(song.estilo)}</td>
                        <td className="tabular-nums font-bold">{formatNumber(songUses(song, result))}</td>
                        <td>{formatDateShort(song.ultimo_uso)}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <ConfidenceBadge value={song.confianca} />
                            <ApproxBadge song={song} />
                          </div>
                        </td>
                        <td>
                          <LyricsLink song={song} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 lg:hidden">
                {ordered.map((song) => (
                  <article key={song.id} className="card cv-item p-4">
                    <Link to={`/musicas/${song.id}`} className="break-words text-lg font-extrabold hover:underline">
                      {song.musica}
                    </Link>
                    <p className="text-sm text-muted">{song.artista_ministerio}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="badge badge-neutral">{labelEstilo(song.estilo)}</span>
                      <span className="badge badge-neutral">{labelVersao(song.versao_estrangeira)}</span>
                      <ConfidenceBadge value={song.confianca} />
                      <ApproxBadge song={song} />
                    </div>
                    <p className="mt-3 text-sm">
                      <strong>{formatNumber(songUses(song, result))}</strong> usos
                      {song.ultimo_uso ? ` · último em ${formatDateShort(song.ultimo_uso)}` : ""}
                    </p>
                    <div className="mt-3">
                      <LyricsLink song={song} size="sm" />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterFields({
  idPrefix,
  includeSearch = false,
  filters,
  draft,
  setDraft,
  update,
  active,
}: {
  idPrefix: string;
  includeSearch?: boolean;
  filters: Filters;
  draft: string;
  setDraft: (value: string) => void;
  update: (patch: Partial<Filters>) => void;
  active: boolean;
}) {
  return (
    <>
      {includeSearch ? (
        <label className="field">
          Busca
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Título, artista, compositor" />
        </label>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <label className="field">
          De
          <select value={filters.from ?? ""} onChange={(event) => update({ from: event.target.value ? Number(event.target.value) : null })}>
            <option value="">Todos</option>
            {ANOS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Até
          <select value={filters.to ?? ""} onChange={(event) => update({ to: event.target.value ? Number(event.target.value) : null })}>
            <option value="">Todos</option>
            {ANOS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="-mt-1 text-xs text-muted">Período em que a música foi cantada.</p>
      <label className="field">
        Artista ou ministério
        <input list={`${idPrefix}-artistas`} value={filters.artista} onChange={(event) => update({ artista: event.target.value })} placeholder="Digite para filtrar" />
        <datalist id={`${idPrefix}-artistas`}>
          {ARTISTAS.map((artist) => (
            <option key={artist} value={artist} />
          ))}
        </datalist>
      </label>
      <label className="field">
        Tipo de culto
        <select value={filters.tipo} onChange={(event) => update({ tipo: event.target.value })}>
          <option value="">Todos</option>
          {TIPOS.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Estilo
        <select value={filters.estilo} onChange={(event) => update({ estilo: event.target.value })}>
          <option value="">Todos</option>
          {ESTILOS.map((estilo) => (
            <option key={estilo} value={estilo}>
              {labelEstilo(estilo)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Versão estrangeira
        <select value={filters.versao} onChange={(event) => update({ versao: event.target.value })}>
          <option value="">Todas</option>
          {VERSOES.map((versao) => (
            <option key={versao} value={versao}>
              {labelVersao(versao)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Confiança do metadado
        <select value={filters.confianca} onChange={(event) => update({ confianca: event.target.value })}>
          <option value="">Todas</option>
          {CONFIANCAS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input className="check" type="checkbox" checked={filters.esquecidas} onChange={(event) => update({ esquecidas: event.target.checked })} />
        Esquecidas (sem uso em 12 meses ou mais)
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input className="check" type="checkbox" checked={filters.umaVez} onChange={(event) => update({ umaVez: event.target.checked })} />
        Usadas uma vez
      </label>
      {active ? (
        <button type="button" className="btn btn-ghost w-full" onClick={() => update({ ...DEFAULT_FILTERS, sort: filters.sort, dir: filters.dir })}>
          Limpar filtros
        </button>
      ) : null}
    </>
  );
}

function SortHeader({
  label,
  sort,
  filters,
  onSort,
}: {
  label: string;
  sort: SortKey;
  filters: Filters;
  onSort: (sort: SortKey) => void;
}) {
  const active = filters.sort === sort;
  return (
    <th aria-sort={active ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className="font-bold uppercase tracking-wide" onClick={() => onSort(sort)}>
        {label}
        {active ? (filters.dir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}
