import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { newSongsByYear, rankArtists, topSongs, weekdayPoints } from "../lib/aggregate";
import { events, performances, songs, stats } from "../lib/data";
import { DIAS, formatDate, formatNumber, formatPercent, MESES, norm } from "../lib/format";

export function InsightsPage() {
  useEffect(() => {
    document.title = "Insights · Repertório IFC";
  }, []);

  const top = useMemo(() => topSongs(songs, 5), []);
  const artists = useMemo(() => rankArtists(performances, 3), []);
  const novas = useMemo(() => newSongsByYear(songs), []);
  const weekdays = useMemo(() => weekdayPoints(performances), []);
  const sunday = weekdays[0]?.eventos ?? 0;
  const datedEvents = events.filter((event) => event.data).length;
  const peakNew = [...novas].sort((a, b) => b.novas - a.novas)[0];
  const latestNew = novas[novas.length - 1];
  const forgotten = useMemo(
    () => songs.filter((song) => song.usos_ultimos_12m === 0).sort((a, b) => b.total_usos - a.total_usos),
    [],
  );
  const once = songs.filter((song) => song.total_usos === 1).length;
  const top20Uses = topSongs(songs, 20).reduce((sum, song) => sum + song.total_usos, 0);
  const topNames = new Set(topSongs(songs, 20).map((song) => song.musica));
  const cultosComTop = events.filter((event) => event.musicas.some((title) => topNames.has(title))).length;
  const withSongs = events.filter((event) => event.musicas.length > 0);
  const media = withSongs.reduce((sum, event) => sum + event.musicas.length, 0) / (withSongs.length || 1);
  const foreignSongs = songs.filter((song) => song.versao_estrangeira === "sim").length;
  const foreignExec = songs.filter((song) => song.versao_estrangeira === "sim").reduce((sum, song) => sum + song.total_usos, 0);
  const undatedEvents = events.length - datedEvents;
  const undatedExec = performances.filter((item) => item.year == null).length;
  const monthEvents = Array.from({ length: 12 }, () => 0);
  for (const event of events) {
    if (!event.data) continue;
    monthEvents[Number(event.data.slice(5, 7)) - 1] += 1;
  }
  let busiest = 0;
  let quietest = 0;
  monthEvents.forEach((count, index) => {
    if (count > monthEvents[busiest]) busiest = index;
    if (count < monthEvents[quietest]) quietest = index;
  });
  const lowYears = [2020, 2021]
    .map((year) => {
      const exec = performances.filter((item) => item.year === year).length;
      const cultos = new Set(performances.filter((item) => item.year === year).map((item) => item.eventId)).size;
      return { year, exec, cultos };
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Leitura do repertório</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">O que os cultos contam</h1>
        <p className="mt-2 text-muted">
          Um resumo em linguagem simples do histórico de {formatDate("2017-12-31")} a {formatDate("2026-10-18")}. Os metadados de
          artista, ano e compositor foram gerados por IA e podem errar.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="card p-5 md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">As mais cantadas</p>
          <h2 className="mt-2 break-words text-3xl font-extrabold">{top[0]?.musica}</h2>
          <p className="mt-3 text-muted">
            É a música mais repetida do histórico, com {formatNumber(top[0]?.total_usos ?? 0)} execuções
            {top[0]?.primeiro_uso ? `, de ${formatDate(top[0].primeiro_uso)}` : ""}
            {top[0]?.ultimo_uso ? ` até ${formatDate(top[0].ultimo_uso)}` : ""}. O pódio segue com{" "}
            <SongLink song={top[1]} /> ({formatNumber(top[1]?.total_usos ?? 0)}) e <SongLink song={top[2]} /> (
            {formatNumber(top[2]?.total_usos ?? 0)}). As 20 primeiras concentram {formatPercent(top20Uses / stats.execucoes)} de
            todas as execuções e aparecem em {formatPercent(cultosComTop / events.length)} dos cultos.
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {top.map((song, index) => (
              <li key={song.id}>
                <Link to={`/musicas/${song.id}`} className="flex items-center justify-between rounded-2xl bg-primary/10 px-3 py-2 font-semibold">
                  <span>
                    {index + 1}. {song.musica}
                  </span>
                  <span className="text-muted">{formatNumber(song.total_usos)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Rotação</p>
          <h2 className="mt-2 text-4xl font-extrabold text-primary">{formatNumber(media, 1)}</h2>
          <p className="text-sm font-semibold text-muted">músicas por culto, em média, quando há repertório</p>
          <p className="mt-3 text-muted">
            A mediana é {formatNumber(stats.musicas_por_evento.mediana)}. O repertório é largo: {formatNumber(once)} músicas foram
            cantadas uma única vez. Há um núcleo que volta sempre e uma cauda longa de canções ocasionais.
          </p>
          <Link className="mt-4 inline-block font-bold text-primary hover:underline" to="/musicas?uma=1">
            Ver as usadas uma vez
          </Link>
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Esquecidas</p>
          <h2 className="mt-2 text-4xl font-extrabold text-primary">{formatNumber(forgotten.length)}</h2>
          <p className="text-sm font-semibold text-muted">sem uso nos 12 meses anteriores a {formatDate(stats.gerado_em)}</p>
          <p className="mt-3 text-muted">
            Entre as que já foram frequentes, <SongLink song={forgotten[0]} /> teve {formatNumber(forgotten[0]?.total_usos ?? 0)}{" "}
            execuções
            {forgotten[0]?.ultimo_uso ? ` e a última foi em ${formatDate(forgotten[0].ultimo_uso)}` : ""}.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {forgotten.slice(0, 6).map((song) => (
              <li key={song.id} className="flex justify-between gap-3">
                <SongLink song={song} />
                <span className="shrink-0 text-muted">{formatDate(song.ultimo_uso)}</span>
              </li>
            ))}
          </ul>
          <Link className="mt-4 inline-block font-bold text-primary hover:underline" to="/musicas?esquecidas=1">
            Ver todas as esquecidas
          </Link>
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Músicas novas</p>
          <h2 className="mt-2 text-4xl font-extrabold text-primary">{formatNumber(peakNew?.novas ?? 0)}</h2>
          <p className="text-sm font-semibold text-muted">estreias em {peakNew?.ano}</p>
          <p className="mt-3 text-muted">
            Foi o ano em que mais canções entraram pela primeira vez. Depois disso o culto passa a revisitar o que já é conhecido.
            Em {latestNew?.ano}, até outubro, são {formatNumber(latestNew?.novas ?? 0)} músicas novas.
          </p>
          <div className="mt-4 flex h-24 items-end gap-1">
            {novas.map((item) => (
              <div key={item.ano} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-primary"
                  style={{ height: `${((item.novas || 0) / (peakNew?.novas || 1)) * 100}%` }}
                  title={`${item.ano}: ${item.novas}`}
                />
                <span className="text-[10px] text-muted">{item.ano.slice(2)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Versões estrangeiras</p>
          <h2 className="mt-2 text-4xl font-extrabold text-primary">{formatPercent(foreignExec / stats.execucoes)}</h2>
          <p className="text-sm font-semibold text-muted">das execuções</p>
          <p className="mt-3 text-muted">
            São {formatNumber(foreignSongs)} músicas, {formatPercent(foreignSongs / songs.length)} do repertório, mas quase metade
            do que se canta. A versão em português pesa mais na prática do que a contagem de títulos sugere.
          </p>
          <Link className="mt-4 inline-block font-bold text-primary hover:underline" to="/musicas?versao=sim">
            Ver as versões estrangeiras
          </Link>
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Quem assina</p>
          <h2 className="mt-2 break-words text-3xl font-extrabold">{artists[0]?.artista}</h2>
          <p className="mt-3 text-muted">
            {formatNumber(artists[0]?.execucoes ?? 0)} execuções em {formatNumber(artists[0]?.musicas ?? 0)} músicas. Em seguida vêm{" "}
            {artists[1]?.artista} ({formatNumber(artists[1]?.execucoes ?? 0)}) e {artists[2]?.artista} (
            {formatNumber(artists[2]?.execucoes ?? 0)}). Quando o selo diz “dados aproximados”, o artista pode estar dividido ou
            incerto.
          </p>
          {artists[0] ? (
            <Link className="mt-4 inline-block font-bold text-primary hover:underline" to={`/musicas?artista=${encodeURIComponent(artists[0].artista)}`}>
              Ver músicas de {artists[0].artista}
            </Link>
          ) : null}
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">O calendário</p>
          <h2 className="mt-2 text-3xl font-extrabold capitalize">{DIAS[0]}</h2>
          <p className="mt-3 text-muted">
            {formatNumber(sunday)} dos {formatNumber(datedEvents)} cultos com data caem no domingo. {capitalize(MESES[busiest])}{" "}
            concentra mais encontros ({formatNumber(monthEvents[busiest])}); {MESES[quietest]}, menos ({formatNumber(monthEvents[quietest])}).
            Em {lowYears[0].year} e {lowYears[1].year} o registro tem menos cultos ({formatNumber(lowYears[0].cultos)} e{" "}
            {formatNumber(lowYears[1].cultos)}) e menos execuções ({formatNumber(lowYears[0].exec)} e {formatNumber(lowYears[1].exec)})
            do que os anos ao redor.
          </p>
        </article>

        <article className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Sem data</p>
          <h2 className="mt-2 text-4xl font-extrabold text-primary">{formatNumber(undatedEvents)}</h2>
          <p className="text-sm font-semibold text-muted">cultos sem data no arquivo</p>
          <p className="mt-3 text-muted">
            Eles somam {formatNumber(undatedExec)} execuções. Entram nos totais, mas ficam de fora dos gráficos por ano, mês e dia.
          </p>
          <Link className="mt-4 inline-block font-bold text-primary hover:underline" to="/cultos">
            Ver a lista, inclusive os sem data
          </Link>
        </article>
      </div>

      <LibraryList />
    </div>
  );
}

function SongLink({ song }: { song?: { id: string; musica: string } }) {
  if (!song) return null;
  return (
    <Link to={`/musicas/${song.id}`} className="font-bold text-ink underline decoration-primary/40 underline-offset-2">
      {song.musica}
    </Link>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function LibraryList() {
  const [query, setQuery] = useState("");
  const items = stats.biblioteca_nunca_usadas.filter((title) => norm(title).includes(norm(query.trim())));
  return (
    <details className="card mt-4 p-5">
      <summary className="cursor-pointer text-lg font-extrabold">
        Biblioteca do Presenter: {formatNumber(stats.biblioteca_total)} faixas
      </summary>
      <p className="mt-3 text-sm text-muted">
        {formatNumber(stats.musicas_distintas)} foram cantadas em algum culto. A lista abaixo traz{" "}
        {formatNumber(stats.biblioteca_nunca_usadas.length)} nomes da biblioteca sem execução registrada. Ela não fecha a conta
        com o total da biblioteca, então tratamos como parcial.
      </p>
      <label className="field mt-4 max-w-sm">
        Filtrar nomes
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na lista" />
      </label>
      <ul className="mt-4 columns-1 gap-6 text-sm sm:columns-2 lg:columns-3">
        {items.map((title) => (
          <li key={title} className="mb-1 break-inside-avoid">
            {title}
          </li>
        ))}
      </ul>
      {!items.length ? <p className="mt-3 text-sm text-muted">Nenhum nome com esse filtro.</p> : null}
    </details>
  );
}
