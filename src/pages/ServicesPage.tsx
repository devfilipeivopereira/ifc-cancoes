import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IconChevron } from "../components/Icons";
import { events, songByTitle, TIPOS } from "../lib/data";
import { ANOS, formatDate, formatMonthYear, formatNumber, MESES, norm, tipoHint } from "../lib/format";
import type { Culto } from "../lib/types";

export function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const ano = params.get("ano") ?? "";
  const tipo = params.get("tipo") ?? "";
  const q = params.get("q") ?? "";
  const visao = params.get("visao") === "calendario" ? "calendario" : "lista";
  const mesParam = Number(params.get("mes") || "10");
  const mes = mesParam >= 1 && mesParam <= 12 ? mesParam : 10;
  const [draft, setDraft] = useState(q);

  useEffect(() => {
    document.title = "Cultos · Repertório IFC";
  }, []);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft === q) return;
      const next = new URLSearchParams(params);
      if (draft) next.set("q", draft);
      else next.delete("q");
      setParams(next, { replace: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [draft, params, q, setParams]);

  function set(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  const filtered = useMemo(() => {
    const query = norm(q.trim());
    return events.filter((event) => {
      if (tipo && event.tipo !== tipo) return false;
      if (ano && event.data.slice(0, 4) !== ano) return false;
      if (!query) return true;
      return norm([event.evento, event.tipo, event.data, ...event.musicas].join(" ")).includes(query);
    });
  }, [ano, q, tipo]);

  const dated = filtered.filter((event) => event.data).sort((a, b) => b.data.localeCompare(a.data) || a.evento.localeCompare(b.evento, "pt"));
  const undated = filtered.filter((event) => !event.data);
  const calendarYear = ano ? Number(ano) : 2026;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      if (tipo && event.tipo !== tipo) continue;
      const year = event.data.slice(0, 4);
      if (!year) continue;
      map.set(year, (map.get(year) ?? 0) + 1);
    }
    return map;
  }, [tipo]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Histórico</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Cultos</h1>
        <p className="mt-2 max-w-3xl text-muted">
          {formatNumber(events.length)} encontros entre 2017 e 2026. Abra um culto para ver a lista de músicas.
        </p>
      </header>

      <div className="card mb-4 space-y-4 p-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" className={`btn btn-sm shrink-0 ${ano === "" ? "btn-primary" : "btn-ghost"}`} onClick={() => set({ ano: "" })}>
            Todos
          </button>
          {ANOS.map((year) => (
            <button
              key={year}
              type="button"
              className={`btn btn-sm shrink-0 ${ano === String(year) ? "btn-primary" : "btn-ghost"}`}
              onClick={() => set({ ano: String(year) })}
            >
              {year}
              <span className="font-medium opacity-80">{counts.get(String(year)) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="field">
            Buscar culto ou música
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nome do culto ou da música" />
          </label>
          <label className="field">
            Tipo
            <select value={tipo} onChange={(event) => set({ tipo: event.target.value })}>
              <option value="">Todos</option>
              {TIPOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" className={`btn btn-sm ${visao === "lista" ? "btn-primary" : "btn-ghost"}`} onClick={() => set({ visao: "" })}>
              Lista
            </button>
            <button type="button" className={`btn btn-sm ${visao === "calendario" ? "btn-primary" : "btn-ghost"}`} onClick={() => set({ visao: "calendario" })}>
              Calendário
            </button>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">
        {formatNumber(filtered.length)} {filtered.length === 1 ? "culto" : "cultos"} neste recorte
        {ano ? "" : ` · ${formatNumber(undated.length)} sem data`}
      </p>

      {visao === "calendario" ? (
        <Calendar
          year={calendarYear}
          month={mes}
          events={dated.filter((event) => event.data.startsWith(String(calendarYear)))}
          onYear={(year) => set({ ano: String(year), visao: "calendario" })}
          onMonth={(month) => set({ mes: String(month), visao: "calendario", ano: String(calendarYear) })}
        />
      ) : (
        <EventGroups events={dated} />
      )}

      {undated.length && !ano ? (
        <section className="mt-8">
          <h2 className="text-xl font-extrabold">Sem data registrada</h2>
          <p className="mt-1 text-sm text-muted">Estes cultos entram nos totais, mas não no calendário nem nos gráficos por ano.</p>
          <div className="mt-3 grid gap-3">
            {undated.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function EventGroups({ events: list }: { events: Culto[] }) {
  const groups = new Map<string, Culto[]>();
  for (const event of list) {
    const key = event.data.slice(0, 7);
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  }
  if (!list.length) return <Empty />;
  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([key, items]) => {
        const [year, month] = key.split("-").map(Number);
        return (
          <section key={key}>
            <h2 className="text-lg font-extrabold">{formatMonthYear(year, month)}</h2>
            <div className="mt-3 grid gap-3">
              {items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function EventCard({ event }: { event: Culto }) {
  return (
    <details className="event card">
      <summary className="cursor-pointer px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{event.data ? formatDate(event.data) : "Sem data"}</p>
            <p className="text-lg font-extrabold">{event.evento}</p>
            <p className="text-sm text-muted">
              {event.tipo} · {tipoHint(event.fonte_tipo)} · {formatNumber(event.musicas.length)}{" "}
              {event.musicas.length === 1 ? "música" : "músicas"}
            </p>
          </div>
          <IconChevron className="chev mt-1 h-5 w-5 shrink-0" />
        </div>
      </summary>
      <SetList event={event} />
    </details>
  );
}

export function SetList({ event }: { event: Culto }) {
  return (
    <div className="border-t border-line px-4 py-4">
      {event.secoes.length ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Seções: {event.secoes.join(" · ")}</p>
      ) : null}
      {event.musicas.length ? (
        <ol className="space-y-2">
          {event.musicas.map((title, index) => {
            const song = songByTitle.get(title);
            return (
              <li key={`${title}-${index}`} className="flex gap-3">
                <span className="w-6 text-right text-sm font-bold text-muted">{index + 1}</span>
                {song ? (
                  <Link to={`/musicas/${song.id}`} className="font-semibold hover:underline">
                    {title}
                  </Link>
                ) : (
                  <span>{title}</span>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted">Nenhuma música registrada neste culto.</p>
      )}
      <Link to={`/cultos/${event.id}`} className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
        Abrir página do culto
      </Link>
    </div>
  );
}

function Calendar({
  year,
  month,
  events: list,
  onYear,
  onMonth,
}: {
  year: number;
  month: number;
  events: Culto[];
  onYear: (year: number) => void;
  onMonth: (month: number) => void;
}) {
  const inMonth = list.filter((event) => event.data.slice(5, 7) === String(month).padStart(2, "0"));
  const byDay = new Map<string, Culto[]>();
  for (const event of inMonth) {
    const bucket = byDay.get(event.data) ?? [];
    bucket.push(event);
    byDay.set(event.data, bucket);
  }
  const fallback = inMonth.at(-1)?.data ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked && byDay.has(picked) ? picked : fallback;

  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: days }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const chosen = selected ? (byDay.get(selected) ?? []) : [];

  function shift(delta: number) {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    let nextYear = date.getUTCFullYear();
    let nextMonth = date.getUTCMonth() + 1;
    if (nextYear < 2017) {
      nextYear = 2017;
      nextMonth = 1;
    }
    if (nextYear > 2026) {
      nextYear = 2026;
      nextMonth = 12;
    }
    onYear(nextYear);
    onMonth(nextMonth);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" className="btn btn-ghost h-11 w-11 shrink-0 !px-0 text-xl" onClick={() => shift(-1)} aria-label="Mês anterior">
            ‹
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-base font-extrabold sm:text-lg">{formatMonthYear(year, month)}</p>
            <label className="sr-only" htmlFor="ano-cal">
              Ano
            </label>
            <select id="ano-cal" className="mt-1 rounded-full border border-line bg-canvas px-2 py-1 text-sm" value={year} onChange={(event) => onYear(Number(event.target.value))}>
              {ANOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-ghost h-11 w-11 shrink-0 !px-0 text-xl" onClick={() => shift(1)} aria-label="Próximo mês">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted">
          {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;
            const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = byDay.get(iso)?.length ?? 0;
            const isSelected = selected === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setPicked(iso)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-sm font-bold ${isSelected ? "bg-primary text-white" : count ? "bg-primary/15" : "hover:bg-primary/10"}`}
                aria-pressed={isSelected}
                aria-label={`${day} de ${MESES[month - 1]}, ${count} cultos`}
              >
                {day}
                {count ? <span className={`text-[10px] ${isSelected ? "text-white" : "text-primary"}`}>{count}</span> : null}
              </button>
            );
          })}
        </div>
      </section>
      <aside className="card p-4">
        <h2 className="text-lg font-extrabold">{selected ? formatDate(selected) : "Escolha um dia"}</h2>
        {selected && !chosen.length ? <p className="mt-2 text-sm text-muted">Nenhum culto nesta data.</p> : null}
        <div className="mt-3 space-y-3">
          {chosen.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function Empty() {
  return (
    <div className="card p-8 text-center">
      <p className="text-lg font-extrabold">Nenhum culto neste recorte</p>
      <p className="mt-1 text-sm text-muted">Tente outro ano, tipo ou busca.</p>
    </div>
  );
}
