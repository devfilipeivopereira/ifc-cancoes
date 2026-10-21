import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatNumber } from "../lib/format";
import { useTheme } from "../lib/theme";

export function ChartCard({
  title,
  subtitle,
  children,
  note,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <section className="card p-4 md:p-5">
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
      {note ? <p className="mt-3 text-xs text-muted">{note}</p> : null}
    </section>
  );
}

export function useSeriesColors() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    bar: dark ? "#C4B5FD" : "#6D2FCB",
    line: dark ? "#F0ABFC" : "#C026D3",
    nacional: dark ? "#C4B5FD" : "#6D2FCB",
    estrangeira: dark ? "#F9A8D4" : "#DB2777",
    outro: dark ? "#CBD5E1" : "#94A3B8",
  };
}

type ComboRow = Record<string, string | number>;

export function ComboChart({
  data,
  labelKey,
  bar,
  line,
  caption,
}: {
  data: ComboRow[];
  labelKey: string;
  bar: { key: string; name: string };
  line?: { key: string; name: string };
  caption: string;
}) {
  const colors = useSeriesColors();
  const [active, setActive] = useState<number | null>(data.length ? data.length - 1 : null);
  useEffect(() => {
    setActive(data.length ? data.length - 1 : null);
  }, [data]);
  const barMax = Math.max(...data.map((row) => Number(row[bar.key]) || 0), 1);
  const lineMax = line ? Math.max(...data.map((row) => Number(row[line.key]) || 0), 1) : 1;
  const plot = 200;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-xs font-bold">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.bar }} />
          {bar.name}
        </span>
        {line ? (
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: colors.line }} />
            {line.name}
          </span>
        ) : null}
      </div>
      <div className="flex gap-1">
        <div className="flex h-[200px] flex-col justify-between text-[10px] text-muted">
          <span>{formatNumber(barMax)}</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <span className="border-t border-dashed" style={{ borderColor: "var(--grid)" }} />
            <span className="border-t border-dashed" style={{ borderColor: "var(--grid)" }} />
            <span className="border-t border-dashed" style={{ borderColor: "var(--grid)" }} />
          </div>
          <div className="absolute inset-0 flex items-end">
            {data.map((row, index) => {
              const value = Number(row[bar.key]) || 0;
              return (
                <button
                  key={`${row[labelKey]}-${index}`}
                  type="button"
                  className={`relative flex h-full min-w-9 flex-1 items-end justify-center rounded-t-md ${active === index ? "bg-primary/10" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  aria-label={`${row[labelKey]}: ${bar.name} ${formatNumber(value)}${line ? `, ${line.name} ${formatNumber(Number(row[line.key]) || 0)}` : ""}`}
                >
                  <motion.span
                    className="block w-[70%] max-w-8 rounded-t-md"
                    style={{ background: colors.bar }}
                    initial={{ height: 0 }}
                    whileInView={{ height: (value / barMax) * plot }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.03 }}
                  />
                </button>
              );
            })}
          </div>
          {line ? (
            <svg viewBox={`0 0 ${data.length * 100} 100`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <polyline
                fill="none"
                stroke={colors.line}
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                points={data
                  .map((row, index) => {
                    const value = Number(row[line.key]) || 0;
                    const x = index * 100 + 50;
                    const y = 100 - (value / lineMax) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
          ) : null}
          {line
            ? data.map((row, index) => {
                const value = Number(row[line.key]) || 0;
                return (
                  <span
                    key={`dot-${row[labelKey]}`}
                    className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card"
                    style={{
                      background: colors.line,
                      left: `${((index + 0.5) / data.length) * 100}%`,
                      bottom: `${(value / lineMax) * 100}%`,
                    }}
                  />
                );
              })
            : null}
          </div>
        {line ? (
          <div className="flex h-[200px] flex-col justify-between text-[10px]" style={{ color: colors.line }}>
            <span>{formatNumber(lineMax)}</span>
            <span>0</span>
          </div>
        ) : null}
      </div>
      <div className="mt-1 flex pl-6 pr-6">
        {data.map((row, index) => (
          <span
            key={`label-${row[labelKey]}-${index}`}
            className={`flex-1 text-center text-[11px] ${active === index ? "font-extrabold text-ink" : "text-muted"}`}
          >
            {row[labelKey]}
          </span>
        ))}
      </div>
      {active != null && data[active] ? (
        <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2 text-sm font-semibold">
          {data[active][labelKey]}: {bar.name} {formatNumber(Number(data[active][bar.key]) || 0)}
          {line ? ` · ${line.name} ${formatNumber(Number(data[active][line.key]) || 0)}` : ""}
        </p>
      ) : null}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Período</th>
            <th>{bar.name}</th>
            {line ? <th>{line.name}</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={`sr-${row[labelKey]}-${index}`}>
              <td>{row[labelKey]}</td>
              <td>{formatNumber(Number(row[bar.key]) || 0)}</td>
              {line ? <td>{formatNumber(Number(row[line.key]) || 0)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartScroller({ children, wide = true }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="max-w-full">
      <p className="mb-2 text-xs font-semibold text-muted md:hidden">Deslize para o lado e toque numa coluna.</p>
      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-1">
        <div className={wide ? "min-w-[40rem]" : "min-w-[22rem]"}>{children}</div>
      </div>
    </div>
  );
}

export function RankBars({
  rows,
  valueLabel = "execuções",
}: {
  rows: { key: string; label: string; value: number; hint?: string; to?: string }[];
  valueLabel?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const colors = useSeriesColors();
  if (!rows.length) return <p className="text-sm text-muted">Nada para mostrar neste recorte.</p>;
  return (
    <ol className="flex flex-col gap-2.5">
      {rows.map((row, index) => (
        <li key={row.key}>
          <div className="mb-1 flex min-h-11 items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">
              <span className="mr-1 text-muted">{index + 1}.</span>
              {row.to ? (
                <Link to={row.to} className="hover:underline">
                  {row.label}
                </Link>
              ) : (
                row.label
              )}
              {row.hint ? <span className="ml-2 font-medium text-muted">{row.hint}</span> : null}
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatNumber(row.value)} <span className="sr-only">{valueLabel}</span>
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--primary-soft)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: colors.bar }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(row.value / max) * 100}%` }}
              viewport={{ once: true }}
              animate={{ width: `${(row.value / max) * 100}%` }}
              transition={{ duration: 0.55, delay: Math.min(index * 0.03, 0.4) }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Donut({
  slices,
  center,
  caption,
}: {
  slices: { key: string; label: string; value: number; color: string; detail: string }[];
  center: ReactNode;
  caption: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = (cursor / total) * 360;
    cursor += slice.value;
    const end = (cursor / total) * 360;
    return `${slice.color} ${start}deg ${end}deg`;
  });
  return (
    <div>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div
          className="relative h-40 w-40 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${stops.join(", ")})` }}
          role="img"
          aria-label={caption}
        >
          <div className="absolute inset-[1.15rem] grid place-items-center rounded-full bg-card text-center">{center}</div>
        </div>
        <ul className="w-full space-y-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-start justify-between gap-3">
              <span className="font-semibold">
                <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                {slice.label}
              </span>
              <span className="text-right text-muted">{slice.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Sparkline({ values, labels }: { values: number[]; labels: string[] }) {
  const width = 320;
  const height = 84;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - 16 - (value / max) * (height - 28);
    return { x, y, value };
  });
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" role="img" aria-label="Execuções por ano">
        <path d={d} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <circle key={labels[index]} cx={point.x} cy={point.y} r="3.5" fill="var(--primary)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted">
        {labels.map((label) => (
          <span key={label}>{label.slice(2)}</span>
        ))}
      </div>
    </div>
  );
}
