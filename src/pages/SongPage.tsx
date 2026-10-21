import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ApproxBadge, ConfidenceBadge } from "../components/Badges";
import { RankBars, Sparkline } from "../components/Charts";
import { LyricsLink } from "../components/LyricsLink";
import { approximateReason, eventById, isApproximate, launchYear, performancesBySong, songById, songs, stats, undatedUses } from "../lib/data";
import { ANOS, formatDate, formatNumber, labelDecada, labelEstilo, labelVersao, tipoHint } from "../lib/format";

export function SongPage() {
  const { id } = useParams();
  const song = id ? songById.get(id) : undefined;

  useEffect(() => {
    document.title = song ? `${song.musica} · Repertório IFC` : "Música não encontrada · Repertório IFC";
  }, [song]);

  const perfs = useMemo(() => performancesBySong.get(song?.id ?? "") ?? [], [song]);
  const dated = useMemo(
    () => [...perfs].filter((item) => item.date).sort((a, b) => b.date.localeCompare(a.date) || a.eventName.localeCompare(b.eventName, "pt")),
    [perfs],
  );
  const undated = useMemo(() => perfs.filter((item) => !item.date), [perfs]);
  const byYear = useMemo(() => {
    const map = new Map<string, typeof dated>();
    for (const item of dated) {
      const year = item.date.slice(0, 4);
      const list = map.get(year) ?? [];
      list.push(item);
      map.set(year, list);
    }
    return [...map.entries()];
  }, [dated]);

  if (!song) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Não encontramos essa música</h1>
        <Link className="btn btn-primary mt-6" to="/musicas">
          Voltar ao repertório
        </Link>
      </div>
    );
  }

  const sparkValues = ANOS.map((year) => song.usos_por_ano[String(year)] ?? 0);
  const types = Object.entries(song.tipos_evento)
    .map(([tipo, usos]) => ({ tipo, usos }))
    .sort((a, b) => b.usos - a.usos);
  const related = songs
    .filter((item) => item.artista_ministerio === song.artista_ministerio && item.id !== song.id)
    .sort((a, b) => b.total_usos - a.total_usos)
    .slice(0, 6);
  const year = launchYear(song);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/musicas" className="text-sm font-bold text-primary hover:underline">
        ← Todas as músicas
      </Link>
      <header className="mt-3">
        <h1 className="break-words text-3xl font-extrabold tracking-tight md:text-5xl">{song.musica}</h1>
        <p className="mt-2 text-lg text-muted">{song.artista_ministerio}</p>
        {song.titulo_canonico && song.titulo_canonico !== song.musica ? (
          <p className="mt-1 text-sm text-muted">Título de referência: {song.titulo_canonico}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="badge badge-neutral">{labelEstilo(song.estilo)}</span>
          <span className="badge badge-neutral">{labelVersao(song.versao_estrangeira)}</span>
          <ConfidenceBadge value={song.confianca} />
          <ApproxBadge song={song} />
        </div>
        {isApproximate(song) ? <p className="mt-3 max-w-3xl text-sm text-muted">{approximateReason(song)}</p> : null}
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Execuções" value={formatNumber(song.total_usos)} />
        <Stat label="Primeira vez" value={song.primeiro_uso ? formatDate(song.primeiro_uso) : "sem data"} />
        <Stat label="Última vez" value={song.ultimo_uso ? formatDate(song.ultimo_uso) : "sem data"} />
        <Stat label="Últimos 12 meses" value={formatNumber(song.usos_ultimos_12m)} hint={`até ${formatDate(stats.gerado_em)}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section className="card p-4 lg:col-span-3">
          <h2 className="text-lg font-extrabold">Usos por ano</h2>
          <p className="mt-1 text-sm text-muted">Cada ponto é um ano entre 2017 e 2026.</p>
          <div className="mt-2">
            <Sparkline values={sparkValues} labels={ANOS.map(String)} />
          </div>
          {undatedUses(song) > 0 ? (
            <p className="mt-2 text-xs text-muted">{formatNumber(undatedUses(song))} usos estão em cultos sem data e não entram na linha.</p>
          ) : null}
        </section>
        <section className="card p-4 lg:col-span-2">
          <h2 className="text-lg font-extrabold">Letra</h2>
          <p className="mt-1 text-sm text-muted">A letra abre num site externo. Este site não guarda nem mostra o texto.</p>
          <div className="mt-4">
            <LyricsLink song={song} />
          </div>
          {song.link_letra_verificado !== "sim" && song.letras_sugestao_nao_verificada ? (
            <p className="mt-3 text-xs text-muted">O selo “sugestão” marca um link ainda não conferido. A busca no Google é o recuo.</p>
          ) : null}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-4 md:p-5">
          <h2 className="text-lg font-extrabold">Ficha</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Meta label="Artista ou ministério" value={song.artista_ministerio} />
            <Meta label="Origem do artista" value={song.fonte_artista || "—"} />
            <Meta label="Estilo" value={labelEstilo(song.estilo)} />
            <Meta label="Confiança" value={song.confianca} />
            <Meta label="Ano de lançamento" value={year ? String(year) : "não informado"} />
            <Meta label="Década" value={labelDecada(song.decada)} />
            <Meta label="Compositores" value={song.compositores || "—"} />
            {song.tom ? <Meta label="Tom" value={song.tom} /> : null}
            <Meta
              label="Origem da canção"
              value={
                song.versao_estrangeira === "sim"
                  ? `Versão estrangeira${song.titulo_original ? `: ${song.titulo_original}` : ""}${song.artista_original ? ` — ${song.artista_original}` : ""}`
                  : labelVersao(song.versao_estrangeira)
              }
            />
            {song.artista_divergente === "sim" && song.artistas_no_letras ? (
              <Meta label="Outras fontes citam" value={song.artistas_no_letras} />
            ) : null}
          </dl>
        </section>
        <section className="card p-4 md:p-5">
          <h2 className="text-lg font-extrabold">Tipos de culto</h2>
          <div className="mt-4">
            <RankBars rows={types.map((type) => ({ key: type.tipo, label: type.tipo, value: type.usos }))} />
          </div>
        </section>
      </div>

      <section className="mt-4 card p-4 md:p-5">
        <h2 className="text-lg font-extrabold">Quando foi cantada</h2>
        <p className="mt-1 text-sm text-muted">{formatNumber(perfs.length)} entradas no histórico.</p>
        <div className="mt-5 space-y-6">
          {byYear.map(([yearLabel, items]) => (
            <div key={yearLabel}>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary">{yearLabel}</h3>
              <ol className="mt-3 border-l-2 border-primary/30">
                {items.map((item) => {
                  const event = eventById.get(item.eventId);
                  return (
                    <li key={`${item.eventId}-${item.date}`} className="relative mb-4 ml-4">
                      <span className="absolute -left-[1.35rem] top-1.5 h-3 w-3 rounded-full bg-primary" />
                      <p className="text-sm font-bold">{formatDate(item.date)}</p>
                      <Link to={`/cultos/${item.eventId}`} className="font-semibold hover:underline">
                        {item.eventName}
                      </Link>
                      <p className="text-sm text-muted">
                        {item.tipo}
                        {event ? ` · ${tipoHint(event.fonte_tipo)}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
          {undated.length ? (
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary">Sem data</h3>
              <ul className="mt-3 space-y-2">
                {undated.map((item) => (
                  <li key={item.eventId}>
                    <Link to={`/cultos/${item.eventId}`} className="font-semibold hover:underline">
                      {item.eventName}
                    </Link>
                    <span className="ml-2 text-sm text-muted">{item.tipo}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {related.length ? (
        <section className="mt-4">
          <h2 className="text-lg font-extrabold">Outras de {song.artista_ministerio}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.id}>
                <Link to={`/musicas/${item.id}`} className="card block px-4 py-3 hover:-translate-y-0.5">
                  <span className="font-bold">{item.musica}</span>
                  <span className="mt-0.5 block text-sm text-muted">{formatNumber(item.total_usos)} usos</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}
