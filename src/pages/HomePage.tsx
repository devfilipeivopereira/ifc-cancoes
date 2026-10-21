import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { CountUp } from "../components/CountUp";
import { formatNumber, formatPercent } from "../lib/format";
import { stats } from "../lib/stats";

const HomeCharts = lazy(() => import("../components/HomeCharts").then((module) => ({ default: module.HomeCharts })));

export function HomePage() {
  useEffect(() => {
    document.title = "Repertório de Louvor · Igreja da Família Cristã";
    const id = window.setTimeout(() => void import("../components/HomeCharts"), 200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-w-0">
      <section className="relative isolate overflow-hidden text-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,hsl(262_55%_32%),hsl(280_55%_24%)_42%,hsl(262_60%_14%))]" />
        <div className="orb pointer-events-none absolute -left-8 top-8 -z-10 h-56 w-56 rounded-full bg-[hsla(300,85%,62%,0.45)] blur-3xl" />
        <div className="orb orb-delay pointer-events-none absolute right-0 top-24 -z-10 h-64 w-64 rounded-full bg-[hsla(262,90%,60%,0.4)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-48 w-48 rounded-full bg-[hsla(320,80%,55%,0.28)] blur-3xl" />
        <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 py-12 text-center lg:min-h-[78vh] lg:py-16">
          <img src="/logo-ifc-branco.png" alt="" width={112} height={112} className="h-24 w-24 md:h-32 md:w-32" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-white/80 sm:text-sm sm:tracking-[0.22em]">
            Igreja da Família Cristã
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">Repertório de Louvor</h1>
          <p className="mt-3 text-xl font-semibold text-white/95 md:text-2xl">Uma Família para Pertencer</p>
          <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">
            {formatNumber(stats.musicas_distintas)} músicas cantadas em {formatNumber(stats.eventos)} cultos, de 2017 a 2026. Um
            retrato do louvor da igreja — sem letras, só o repertório.
          </p>
          <div className="mt-8 flex w-full max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <Link className="btn btn-white min-h-12" to="/musicas">
              Explorar músicas
            </Link>
            <Link className="btn btn-outline min-h-12" to="/cultos">
              Ver cultos
            </Link>
          </div>
        </div>
      </section>

      <div id="numeros" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/cultos" className="card kpi block p-4 transition hover:-translate-y-0.5 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Cultos</p>
            <p className="mt-2 text-4xl font-extrabold text-primary">
              <CountUp value={stats.eventos} />
            </p>
            <p className="mt-1 text-sm text-muted">{formatNumber(stats.eventos_com_data)} com data no arquivo</p>
          </Link>
          <Link to="/musicas" className="card kpi block p-4 transition hover:-translate-y-0.5 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Execuções</p>
            <p className="mt-2 text-4xl font-extrabold text-primary">
              <CountUp value={stats.execucoes} />
            </p>
            <p className="mt-1 text-sm text-muted">vezes em que uma música entrou no culto</p>
          </Link>
          <Link to="/musicas" className="card kpi block p-4 transition hover:-translate-y-0.5 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Músicas distintas</p>
            <p className="mt-2 text-4xl font-extrabold text-primary">
              <CountUp value={stats.musicas_distintas} />
            </p>
            <p className="mt-1 text-sm text-muted">títulos diferentes no histórico</p>
          </Link>
          <Link to="/musicas?versao=sim" className="card kpi block p-4 transition hover:-translate-y-0.5 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Versões estrangeiras</p>
            <p className="mt-2 text-4xl font-extrabold text-primary">
              <CountUp value={stats.versoes_estrangeiras.pct_musicas * 100} digits={1} suffix="%" />
            </p>
            <p className="mt-1 text-sm text-muted">
              das músicas · {formatPercent(stats.versoes_estrangeiras.pct_execucoes)} das execuções
            </p>
          </Link>
        </div>
        <Suspense fallback={<ChartsFallback />}>
          <HomeCharts />
        </Suspense>
      </div>
    </div>
  );
}

function ChartsFallback() {
  return (
    <div className="mt-4 grid gap-3">
      <div className="card h-48 animate-pulse bg-primary/5" />
      <div className="card h-48 animate-pulse bg-primary/5" />
    </div>
  );
}
