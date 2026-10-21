import { useMemo } from "react";
import { Link } from "react-router-dom";
import { monthPoints, newSongsByYear, originSplit, rankArtists, rankDecades, rankTypes, topSongs, weekdayPoints, yearPoints } from "../lib/aggregate";
import { events, performances, songs } from "../lib/data";
import { formatNumber, formatPercent } from "../lib/format";
import { BarRace } from "./BarRace";
import { ChartCard, ChartScroller, ComboChart, Donut, RankBars, useSeriesColors } from "./Charts";
import { Heatmap } from "./Heatmap";

const DATED_NOTE = "Cultos e execuções sem data ficam de fora deste gráfico, mas entram nos totais do topo da página.";

export function HomeCharts() {
  const colors = useSeriesColors();
  const years = useMemo(() => yearPoints(performances), []);
  const novas = useMemo(() => newSongsByYear(songs), []);
  const artists = useMemo(() => rankArtists(performances, 12), []);
  const origin = useMemo(() => originSplit(performances, songs), []);
  const decades = useMemo(() => rankDecades(songs, performances), []);
  const types = useMemo(() => rankTypes(performances), []);
  const months = useMemo(() => monthPoints(performances), []);
  const weekdays = useMemo(() => weekdayPoints(performances), []);
  const ranking = useMemo(() => topSongs(songs, 20), []);
  const undatedExec = performances.filter((item) => item.year == null).length;
  const undatedEvents = events.filter((event) => !event.data).length;
  const semEstreia = songs.filter((song) => !song.primeiro_uso).length;
  const foreignExec = origin.find((item) => item.key === "sim")?.execucoes ?? 0;
  const totalExec = performances.length || 1;

  return (
    <>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Execuções e cultos por ano"
          subtitle="Cada barra é uma música cantada. A linha conta cultos com data naquele ano."
          note={`${formatNumber(undatedEvents)} cultos sem data reúnem ${formatNumber(undatedExec)} execuções. ${DATED_NOTE}`}
        >
          <ChartScroller>
            <ComboChart
              data={years}
              labelKey="ano"
              bar={{ key: "execucoes", name: "Execuções" }}
              line={{ key: "eventos", name: "Cultos" }}
              caption="Execuções e cultos por ano"
            />
          </ChartScroller>
        </ChartCard>
        <ChartCard
          title="Músicas novas por ano"
          subtitle="Estreia é o ano da primeira execução com data."
          note={semEstreia ? `${formatNumber(semEstreia)} músicas só aparecem em cultos sem data e não entram neste gráfico.` : undefined}
        >
          <ChartScroller>
            <ComboChart data={novas} labelKey="ano" bar={{ key: "novas", name: "Músicas novas" }} caption="Músicas novas por ano" />
          </ChartScroller>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <ChartCard
            title="Corrida do repertório"
            subtitle="Top 12 acumulado, ano a ano, só com execuções que têm data. Aperte reproduzir ou arraste o ano."
            note="O ranking completo, incluindo usos sem data, está ao lado no computador e abaixo no celular."
          >
            <BarRace songs={songs} />
          </ChartCard>
        </div>
        <div className="min-w-0 xl:col-span-2">
          <ChartCard title="Top 20 de todos os tempos" subtitle="Barras horizontais. Inclui execuções sem data.">
            <RankBars
              rows={ranking.map((song) => ({
                key: song.id,
                label: song.musica,
                value: song.total_usos,
                to: `/musicas/${song.id}`,
              }))}
            />
          </ChartCard>
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <ChartCard
          title="Mapa de calor: top 30 × ano"
          subtitle="Quanto mais roxo, mais vezes a música foi cantada naquele ano."
          note="A coluna “s/ data” reúne usos em cultos sem data registrada."
        >
          <Heatmap songs={songs} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Artistas e ministérios" subtitle="Soma das execuções de cada nome no metadado.">
          <RankBars
            rows={artists.map((artist) => ({
              key: artist.artista,
              label: artist.artista,
              value: artist.execucoes,
              hint: `${formatNumber(artist.musicas)} músicas`,
              to: `/musicas?artista=${encodeURIComponent(artist.artista)}`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Nacional e versão estrangeira" subtitle="A fatia colorida é a parcela das execuções.">
          <Donut
            caption="Distribuição entre músicas nacionais e versões estrangeiras"
            center={
              <div>
                <p className="text-xl font-extrabold text-primary">{formatPercent(foreignExec / totalExec)}</p>
                <p className="text-[11px] font-semibold text-muted">execuções estrangeiras</p>
              </div>
            }
            slices={origin.map((item) => ({
              key: item.key,
              label: item.nome,
              value: item.execucoes,
              color: item.key === "sim" ? colors.estrangeira : item.key === "não" ? colors.nacional : colors.outro,
              detail: `${formatNumber(item.execucoes)} exec. · ${formatNumber(item.musicas)} músicas`,
            }))}
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Por década de lançamento" subtitle="Ano de lançamento vem do metadado e pode faltar.">
          <RankBars
            rows={decades.map((decade) => ({
              key: decade.key,
              label: decade.label,
              value: decade.execucoes,
              hint: `${formatNumber(decade.musicas)} músicas`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Por tipo de culto" subtitle="A barra mede cultos.">
          <RankBars
            valueLabel="cultos"
            rows={types.map((type) => ({
              key: type.tipo,
              label: type.tipo,
              value: type.eventos,
              hint: `${formatNumber(type.execucoes)} exec.`,
              to: `/cultos?tipo=${encodeURIComponent(type.tipo)}`,
            }))}
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Por mês" subtitle="Todos os anos somados. A barra conta cultos; a linha, execuções." note={DATED_NOTE}>
          <ChartScroller>
            <ComboChart
              data={months}
              labelKey="mes"
              bar={{ key: "eventos", name: "Cultos" }}
              line={{ key: "execucoes", name: "Execuções" }}
              caption="Cultos e execuções por mês"
            />
          </ChartScroller>
        </ChartCard>
        <ChartCard title="Por dia da semana" subtitle="Quase tudo acontece no domingo — o gráfico mostra os cultos com data." note={DATED_NOTE}>
          <ChartScroller wide={false}>
            <ComboChart data={weekdays} labelKey="dia" bar={{ key: "eventos", name: "Cultos" }} caption="Cultos por dia da semana" />
          </ChartScroller>
        </ChartCard>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Quer o relato em frases?{" "}
        <Link className="font-bold text-primary" to="/insights">
          Abra os insights
        </Link>
        .
      </p>
    </>
  );
}
