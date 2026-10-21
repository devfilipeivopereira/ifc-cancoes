import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConfidenceBadge } from "../components/Badges";
import { IconChevron } from "../components/Icons";
import { flowLabel, insights, typeByName } from "../lib/insights";
import type { SongHit } from "../lib/insights";
import { formatDate, formatNumber, formatPercent, labelDecada, labelEstilo, MESES, norm } from "../lib/format";
import { stats } from "../lib/stats";

const SECTIONS = [
  { id: "plano", label: "Próximo culto" },
  { id: "saude", label: "Saúde" },
  { id: "rotacao", label: "Rotação" },
  { id: "esquecidas", label: "Esquecidas" },
  { id: "novas", label: "Novas" },
  { id: "culto", label: "Culto típico" },
  { id: "pares", label: "Combinações" },
  { id: "sazonal", label: "Sazonalidade" },
  { id: "diversidade", label: "Diversidade" },
];

export function InsightsPage() {
  useEffect(() => {
    document.title = "Insights · Repertório IFC";
  }, []);

  const report = insights;
  const sunday = typeByName(report, "Culto de Domingo");
  const retreat = typeByName(report, "Retiro/Congresso");
  const firstYear = report.years[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Para quem monta o culto</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Planejar o louvor</h1>
        <p className="mt-2 text-muted">
          Leitura prática de {formatDate(report.firstDate)} a {formatDate(report.lastDate)}. Cada número sai dos arquivos de
          cultos e músicas e muda quando esses arquivos mudam.
        </p>
        <p className="mt-3 rounded-2xl border border-line bg-card px-3 py-3 text-sm leading-relaxed text-muted">
          {formatNumber(report.undatedServices)} cultos sem data ({formatNumber(report.undatedExecutions)} execuções) entram nos
          totais e nas combinações, mas ficam de fora de ano, mês, intervalo e dos últimos 12 meses. Esses prazos usam{" "}
          {formatDate(report.generated)} como “hoje” do arquivo. Artista, estilo e década foram gerados por IA. As seções do
          Presenter não dizem qual música entrou em cada bloco.
        </p>
      </header>

      <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
        <Kpi label="Ativas em 12 meses" value={formatNumber(report.active12)} hint={`de ${formatNumber(report.catalog)} no catálogo`} />
        <Kpi label="Ativas em 6 meses" value={formatNumber(report.active6)} hint="repertório que a igreja ainda tem na mão" />
        <Kpi
          label={`Top 20 em ${report.latestFullYear.year}`}
          value={formatPercent(report.latestFullYear.top20)}
          hint="das execuções daquele ano"
        />
        <Kpi label="Músicas por culto" value={formatNumber(report.meanSongs, 1)} hint={`mediana ${formatNumber(report.medianSongs, report.medianSongs % 1 ? 1 : 0)}`} />
        <Kpi label="Em desgaste" value={formatNumber(report.worn.length)} hint="6 ou mais usos nos últimos 12 meses" />
        <Kpi label="Fortes paradas" value={formatNumber(report.forgotten.length)} hint="12 usos ou mais e um ano fora" />
      </div>

      <nav aria-label="Seções dos insights" className="sticky top-16 z-30 -mx-4 mt-4 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {SECTIONS.map((section) => (
            <button key={section.id} type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => focusSection(section.id)}>
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-4 grid gap-3">
        <Block id="plano" title="Para o próximo culto" open>
          <p className="text-sm text-muted">
            Confiança alta, pelo menos 8 usos no histórico, e última vez entre 4 e 10 meses. A igreja ainda lembra, e a música não
            está no grupo das mais repetidas nas últimas semanas.
          </p>
          <SongList items={report.forNextService} detail={(song) => `última ${formatDate(song.last)}`} />
          <h3 className="mt-5 text-base font-extrabold">Para reintroduzir</h3>
          <p className="mt-1 text-sm text-muted">
            12 usos ou mais, confiança que não é baixa, e nenhuma execução desde {formatDate(report.start12)}.
          </p>
          <SongList
            items={report.reintroduce}
            detail={(song) => `${formatNumber(song.uses)} usos`}
            showConfidence
          />
          <Advice>
            Escolha uma da primeira lista para o próximo domingo e deixe a reintrodução para um ensaio, não para estrear no meio de
            duas músicas novas. Cada nome abre a ficha da música.
          </Advice>
        </Block>

        <Block id="saude" title="Saúde do repertório">
          <p className="text-sm text-muted">
            Concentração é a fatia das execuções do ano que cabe nas músicas mais cantadas daquele mesmo ano. Quanto maior, mais o
            culto gira em torno de poucas canções.
          </p>
          <div className="mt-4 grid gap-3">
            {report.years.map((year) => (
              <Meter
                key={year.year}
                label={year.partial ? `${year.year} (em aberto)` : String(year.year)}
                value={year.top20}
                max={0.5}
                hint={`top 10 ${formatPercent(year.top10)} · top 20 ${formatPercent(year.top20)} · ${formatNumber(year.distinct)} músicas`}
              />
            ))}
          </div>
          <Advice>
            O ano fechado mais concentrado foi {report.peakYear.year}: as 20 mais cantadas cobriram{" "}
            {formatPercent(report.peakYear.top20)} das execuções. Em {report.latestFullYear.year} essa fatia foi{" "}
            {formatPercent(report.latestFullYear.top20)}. Nos últimos 12 meses só {formatNumber(report.active12)} das{" "}
            {formatNumber(report.catalog)} músicas apareceram; em 6 meses, {formatNumber(report.active6)}. Trate esse grupo de cerca
            de {formatNumber(report.active6)} canções como repertório vivo. Num domingo, duas ou três podem ser do núcleo que a
            igreja canta sem ler; o restante pode sair de quem ficou alguns meses fora.
          </Advice>
        </Block>

        <Block id="rotacao" title="Rotação">
          <p className="text-sm text-muted">
            “Em alta” subiu pelo menos 3 usos nos últimos 12 meses em relação aos 12 anteriores, e teve no mínimo 4 agora. “Em
            queda” fez o caminho inverso. O intervalo é a média de dias entre datas diferentes, só para músicas com pelo menos três
            datas.
            {report.medianGap != null
              ? ` Entre as que já têm 8 datas ou mais, a mediana desse intervalo é ${formatNumber(report.medianGap)} dias.`
              : ""}
          </p>
          <h3 className="mt-4 text-base font-extrabold">Risco de desgaste</h3>
          <SongList items={report.worn} detail={(song) => `${formatNumber(song.recent)} em 12 meses`} />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-extrabold">Em alta</h3>
              <SongList items={report.rising.slice(0, 6)} detail={(song) => `${formatNumber(song.previous)} → ${formatNumber(song.recent)}`} />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Em queda</h3>
              <SongList items={report.falling.slice(0, 6)} detail={(song) => `${formatNumber(song.previous)} → ${formatNumber(song.recent)}`} />
            </div>
          </div>
          <h3 className="mt-5 text-base font-extrabold">Quem volta mais depressa</h3>
          <p className="mt-1 text-sm text-muted">Média de dias entre usos, só entre músicas com 8 datas diferentes ou mais.</p>
          <SongList items={report.fastest} detail={(song) => `${formatNumber(song.gapDays ?? 0)} dias`} />
          <Advice>
            {report.worn[0]
              ? `${report.worn[0].title} entrou ${formatNumber(report.worn[0].recent)} vezes nos últimos 12 meses${
                  report.worn[1] ? ` e ${report.worn[1].title}, ${formatNumber(report.worn[1].recent)}` : ""
                }. `
              : ""}
            Dê algumas semanas de descanso para quem já passou de 6 vezes nesse prazo. Para renovar sem estrear, use uma música em
            queda: a igreja ainda reconhece, e ela saiu do centro.
          </Advice>
        </Block>

        <Block id="esquecidas" title="Esquecidas que valem voltar">
          <p className="text-sm text-muted">
            São músicas com 12 execuções ou mais no histórico e nenhuma desde {formatDate(report.start12)}. Não é a lista inteira
            de quem sumiu: é a que já foi forte o bastante para valer um ensaio.
          </p>
          <SongList
            items={report.forgotten}
            detail={(song) => formatDate(song.last)}
            showConfidence
          />
          <Advice>
            {report.forgotten[0]
              ? `${report.forgotten[0].title} lidera essa lista, com ${formatNumber(report.forgotten[0].uses)} usos e última vez em ${formatDate(report.forgotten[0].last)}. `
              : ""}
            Reintroduza uma por mês, começando pelas de confiança alta. Uma música forte esquecida ensina mais fácil do que uma
            estreia.
          </Advice>
        </Block>

        <Block id="novas" title="Músicas novas">
          <p className="text-sm text-muted">
            Estreia aqui é a primeira data registrada no arquivo, que começa em {firstYear?.year}. Por isso {firstYear?.year} reúne{" "}
            {formatNumber(firstYear?.introduced ?? 0)} “estreias”: muitas já podiam ser conhecidas antes do corte. De{" "}
            {report.years[1]?.year} em diante, o número é a primeira aparição dentro deste histórico.
          </p>
          <div className="mt-4 grid gap-3">
            {report.years.map((year) => (
              <Meter
                key={year.year}
                label={String(year.year)}
                value={year.introduced}
                max={Math.max(...report.years.map((item) => item.introduced), 1)}
                hint={`${formatNumber(year.introduced)} estreias · ${formatPercent(year.returned / (year.introduced || 1))} voltaram depois`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            {formatNumber(report.introduced)} músicas têm data de estreia. {formatPercent(report.returned / (report.introduced || 1))} foram
            cantadas de novo em outra data. {formatNumber(report.caughtOn)} “pegaram”: pelo menos 4 usos com data, ou um retorno em
            ano seguinte. {formatNumber(report.abandoned)} ficaram em 1 ou 2 usos com data. Nos 56 dias depois da estreia, a mediana
            de repetições é {formatNumber(report.medianRepeat56)} e só {formatPercent(report.repeatWithin56)} voltam nesse prazo.
          </p>
          <Advice>
            Se a canção importa, marque a segunda vez dentro de oito semanas. Hoje a maioria não volta nesse prazo e acaba
            abandonada. Num domingo, uma estreia já está perto do que a igreja absorve; duas no mesmo culto fogem do padrão.
          </Advice>
        </Block>

        <Block id="culto" title="Perfil de um culto típico">
          <p className="text-sm text-muted">
            A média geral, quando há repertório, é {formatNumber(report.meanSongs, 1)} músicas (mediana {formatNumber(report.medianSongs, report.medianSongs % 1 ? 1 : 0)}).{" "}
            {formatPercent(report.debutShare)} das execuções com data são a primeira vez daquela música no arquivo, e{" "}
            {formatPercent(report.servicesWithDebut / (report.datedServicesWithSongs || 1))} dos cultos com data incluem pelo menos
            uma estreia. O tipo às vezes foi inferido pelo nome ou pelo dia. As músicas de cada tipo incluem os cultos sem data.
          </p>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {report.types.map((type) => (
              <li key={type.tipo} className="rounded-2xl border border-line p-3">
                <p className="font-extrabold">{type.tipo}</p>
                <p className="text-sm text-muted">
                  {formatNumber(type.withSongs)} cultos com repertório · média {formatNumber(type.mean, 1)} · mediana{" "}
                  {formatNumber(type.median, type.median % 1 ? 1 : 0)}
                </p>
                <ol className="mt-2 space-y-1 text-sm">
                  {type.top.map((song, index) => (
                    <li key={song.id}>
                      <Link className="font-semibold underline decoration-primary/40 underline-offset-2" to={`/musicas/${song.id}`}>
                        {index + 1}. {song.title}
                      </Link>
                      <span className="text-muted"> · {formatNumber(song.uses)}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-base font-extrabold">Seções do roteiro</h3>
          <p className="mt-1 text-sm text-muted">
            Em {formatNumber(report.withSections)} cultos existe uma lista de blocos. O número é em quantos desses cultos o bloco
            aparece, não quantas músicas foram cantadas nele. O arquivo não liga a música à seção, então não há ranking honesto de
            “melhor abertura” ou “melhor final”.
          </p>
          <div className="mt-3 grid gap-3">
            {report.sectionShare.map((section) => (
              <Meter
                key={section.name}
                label={sectionLabel(section.name)}
                value={section.count}
                max={report.withSections || 1}
                hint={formatPercent(section.count / (report.withSections || 1))}
              />
            ))}
          </div>
          {report.sundayFlow ? (
            <p className="mt-4 text-sm text-muted">
              Nos {formatNumber(report.sundayWithSections)} domingos com seções, o fluxo mais repetido ({formatNumber(report.sundayFlow.count)}{" "}
              vezes) é {flowLabel(report.sundayFlow.steps.map(sectionLabel))}.
            </p>
          ) : null}
          <Advice>
            Domingo costuma ter cerca de {formatNumber(sunday?.mean ?? report.meanSongs, 1)} músicas
            {retreat ? ` e retiro cerca de ${formatNumber(retreat.mean, 1)}` : ""}. Monte os blocos na ordem que o domingo já
            repete e coloque uma estreia no máximo. Para a música em si, use o tipo de evento: a lista de cada card acima é o que
            esse tipo de culto de fato cantou.
          </Advice>
        </Block>

        <Block id="pares" title="Combinações">
          <p className="text-sm text-muted">
            Pares que entraram no mesmo culto pelo menos 8 vezes. O lift diz quantas vezes isso aconteceu a mais do que a
            popularidade de cada uma preveria. Lift 2 significa “juntas o dobro do acaso”.
          </p>
          <ul className="mt-3 grid gap-2">
            {report.pairs.map((pair) => (
              <li key={`${pair.a.id}-${pair.b.id}`} className="rounded-2xl bg-primary/10 px-3 py-3">
                <p className="font-semibold leading-snug">
                  <Link className="underline decoration-primary/40 underline-offset-2" to={`/musicas/${pair.a.id}`}>
                    {pair.a.title}
                  </Link>
                  <span className="text-muted"> + </span>
                  <Link className="underline decoration-primary/40 underline-offset-2" to={`/musicas/${pair.b.id}`}>
                    {pair.b.title}
                  </Link>
                </p>
                <p className="text-sm text-muted">
                  {formatNumber(pair.count)} cultos · lift {formatNumber(pair.lift, 1)}
                </p>
              </li>
            ))}
          </ul>
          <Advice>
            {report.frequentPair
              ? `O par mais repetido é ${report.frequentPair.a.title} com ${report.frequentPair.b.title}, em ${formatNumber(report.frequentPair.count)} cultos (lift ${formatNumber(report.frequentPair.lift, 1)}). `
              : ""}
            Use um par conhecido quando o culto precisa de segurança. Um lift alto, mesmo com poucas ocorrências, aponta uma
            sequência que já funcionou e não é só “as duas mais famosas”.
          </Advice>
        </Block>

        <Block id="sazonal" title="Sazonalidade e tipo de evento">
          <p className="text-sm text-muted">
            Uma música entra aqui quando tem pelo menos 8 usos com data e 35% deles caem num único mês, com no mínimo 4 naquele
            mês. A amostra ainda é pequena: trate como pista, não como regra.
            {report.seasonalTitles.natal + report.seasonalTitles.pascoa === 0
              ? " Nenhum título usado traz Natal ou Páscoa no nome, então o arquivo não guarda um repertório dessas datas."
              : ` Há ${formatNumber(report.seasonalTitles.natal)} títulos com Natal e ${formatNumber(report.seasonalTitles.pascoa)} com Páscoa no nome.`}
          </p>
          <SongList
            items={report.seasonal.map((item) => item.song)}
            detail={(song) => {
              const item = report.seasonal.find((entry) => entry.song.id === song.id);
              if (!item) return "";
              return `${MESES[item.month - 1]} · ${formatNumber(item.count)} de ${formatNumber(item.total)}`;
            }}
          />
          <Advice>
            {report.seasonal[0]
              ? `O sinal mais forte é ${report.seasonal[0].song.title}: ${formatNumber(report.seasonal[0].count)} de ${formatNumber(report.seasonal[0].total)} usos em ${MESES[report.seasonal[0].month - 1]}. `
              : ""}
            Não monte Natal ou Páscoa só com este histórico. Para adolescentes, jovens, mulheres e retiro, use as listas do culto
            típico: elas separam o repertório por tipo de encontro.
          </Advice>
        </Block>

        <Block id="diversidade" title="Diversidade">
          <p className="text-sm text-muted">
            {formatNumber(report.divergentArtists)} de {formatNumber(report.catalog)} músicas têm artista divergente entre as
            fontes, e {formatNumber(report.lowConfidence)} estão com confiança baixa. A lista da esquerda soma todo o metadado. A
            da direita só usa confiança alta, sem divergência ({formatNumber(report.firmSongs)} músicas). Não trate a da esquerda
            como autoria confirmada.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-extrabold">Todos os metadados</h3>
              <ol className="mt-2 space-y-2">
                {report.artists.map((artist, index) => (
                  <li key={artist.name} className="flex items-baseline justify-between gap-3 text-sm">
                    <Link className="min-w-0 truncate font-semibold hover:underline" to={`/musicas?artista=${encodeURIComponent(artist.name)}`}>
                      {index + 1}. {artist.name}
                    </Link>
                    <span className="shrink-0 text-muted">{formatNumber(artist.executions)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-base font-extrabold">Só confiança alta</h3>
              <ol className="mt-2 space-y-2">
                {report.firmArtists.map((artist, index) => (
                  <li key={artist.name} className="flex items-baseline justify-between gap-3 text-sm">
                    <Link className="min-w-0 truncate font-semibold hover:underline" to={`/musicas?artista=${encodeURIComponent(artist.name)}`}>
                      {index + 1}. {artist.name}
                    </Link>
                    <span className="shrink-0 text-muted">{formatNumber(artist.executions)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Versões estrangeiras: {formatNumber(report.foreignSongs)} músicas ({formatPercent(report.foreignSongs / report.catalog)}) e{" "}
            {formatPercent(report.foreignExecutions / report.executions)} das execuções. Estilo e década abaixo contam o catálogo
            inteiro; o número “baixa” é quantas daquele grupo têm confiança baixa.
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
              {report.styles.map((style) => (
                <Meter
                  key={style.name}
                  label={labelEstilo(style.name)}
                  value={style.executions}
                  max={report.styles[0]?.executions || 1}
                  hint={`${formatNumber(style.songs)} músicas · ${formatNumber(style.low)} confiança baixa`}
                />
              ))}
            </div>
            <div className="grid gap-3">
              {report.decades.map((decade) => (
                <Meter
                  key={decade.name}
                  label={labelDecada(decade.name)}
                  value={decade.executions}
                  max={Math.max(...report.decades.map((item) => item.executions), 1)}
                  hint={`${formatNumber(decade.songs)} músicas · ${formatNumber(decade.low)} confiança baixa`}
                />
              ))}
            </div>
          </div>
          <Advice>
            Para dizer “de quem é” no ensaio, use só a lista de confiança alta. Versão estrangeira pesa quase metade do que se
            canta: vale alternar com hino e canção nacional de propósito, sem tratar década e estilo como fato quando a confiança
            é baixa.
          </Advice>
        </Block>
      </div>

      <LibraryList />
    </div>
  );
}

function sectionLabel(name: string) {
  if (name === "dízimos e ofertas") return "Dízimos e ofertas";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function focusSection(id: string) {
  const section = document.getElementById(id);
  if (section instanceof HTMLDetailsElement) section.open = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="card kpi min-w-[78%] snap-start p-4 sm:min-w-0">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </article>
  );
}

function Block({ id, title, open = false, children }: { id: string; title: string; open?: boolean; children: ReactNode }) {
  return (
    <details id={id} className="insight card scroll-mt-32 p-4 md:p-5" open={open}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        <IconChevron className="chev h-5 w-5 shrink-0" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Advice({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-2xl bg-primary/10 px-3 py-3 text-sm leading-relaxed">
      <span className="font-extrabold text-primary">O que fazer. </span>
      {children}
    </p>
  );
}

function Meter({ label, value, max, hint }: { label: string; value: number; max: number; hint: string }) {
  const width = Math.max(2, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-right text-muted">{hint}</span>
      </div>
      <div className="h-2 rounded-full bg-primary/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SongList({
  items,
  detail,
  showConfidence = false,
}: {
  items: SongHit[];
  detail: (song: SongHit) => string;
  showConfidence?: boolean;
}) {
  if (!items.length) return <p className="mt-3 text-sm text-muted">Nada neste recorte com os critérios atuais.</p>;
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.map((song) => (
        <li key={song.id}>
          <Link to={`/musicas/${song.id}`} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-primary/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block font-semibold leading-snug">{song.title}</span>
              {showConfidence ? (
                <span className="mt-1 inline-flex">
                  <ConfidenceBadge value={song.confidence} />
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-right text-sm text-muted">{detail(song)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LibraryList() {
  const [query, setQuery] = useState("");
  const items = stats.biblioteca_nunca_usadas.filter((title) => norm(title).includes(norm(query.trim())));
  return (
    <details className="insight card mt-3 p-4 md:p-5">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Biblioteca sem uso registrado</h2>
        <IconChevron className="chev h-5 w-5 shrink-0" />
      </summary>
      <p className="mt-3 text-sm text-muted">
        O Presenter lista {formatNumber(stats.biblioteca_total)} faixas. {formatNumber(stats.musicas_distintas)} foram cantadas em
        algum culto deste arquivo. Abaixo há {formatNumber(stats.biblioteca_nunca_usadas.length)} nomes sem execução registrada.
        A lista não fecha a conta com o total, então é parcial. São títulos da biblioteca, não uma sugestão automática.
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
