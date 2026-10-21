import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ANOS, formatNumber } from "../lib/format";
import type { Song } from "../lib/types";

const PALETTE = ["#6D2FCB", "#A855F7", "#DB2777", "#7C3AED", "#C026D3", "#4F46E5", "#E11D48", "#9333EA", "#BE185D", "#5B21B6", "#8B5CF6", "#9D174D"];

function colorFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function BarRace({ songs }: { songs: Song[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const frames = useMemo(() => {
    return ANOS.map((year) => {
      const rows = songs
        .map((song) => {
          let total = 0;
          for (const [key, value] of Object.entries(song.usos_por_ano)) {
            if (Number(key) <= year) total += value;
          }
          return { id: song.id, nome: song.musica, usos: total };
        })
        .filter((row) => row.usos > 0)
        .sort((a, b) => b.usos - a.usos || a.nome.localeCompare(b.nome, "pt"))
        .slice(0, 12);
      return { year, rows };
    });
  }, [songs]);

  useEffect(() => {
    if (seen && !reduce) setPlaying(true);
  }, [seen, reduce]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= ANOS.length - 1) return current;
        return current + 1;
      });
    }, 1400);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (index >= ANOS.length - 1) setPlaying(false);
  }, [index]);

  const frame = frames[index];
  const max = Math.max(...frame.rows.map((row) => row.usos), 1);

  return (
    <div ref={ref}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-5xl font-extrabold tabular-nums tracking-tight text-primary">{frame.year}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setIndex((value) => Math.max(0, value - 1)); }}>
            Anterior
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (index >= ANOS.length - 1) setIndex(0);
              setPlaying((value) => !value);
            }}
          >
            {playing ? "Pausar" : "Reproduzir"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setIndex((value) => Math.min(ANOS.length - 1, value + 1)); }}>
            Próximo
          </button>
        </div>
      </div>
      <label className="mb-4 block text-xs font-bold text-muted">
        Ano
        <input
          className="mt-1 w-full accent-[var(--primary)]"
          type="range"
          min={0}
          max={ANOS.length - 1}
          value={index}
          onChange={(event) => {
            setPlaying(false);
            setIndex(Number(event.target.value));
          }}
        />
      </label>
      <ol className="relative min-h-[28rem]">
        <AnimatePresence initial={false}>
          {frame.rows.map((row, position) => (
            <motion.li
              layout
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="mb-2 grid grid-cols-[1.4rem_minmax(0,1fr)_2.6rem] items-center gap-2"
            >
              <span className="text-right text-xs font-bold text-muted">{position + 1}</span>
              <div className="min-w-0">
                <Link to={`/musicas/${row.id}`} className="block truncate text-sm font-bold hover:underline">
                  {row.nome}
                </Link>
                <div className="mt-1 h-2 rounded-full" style={{ background: "var(--primary-soft)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: colorFor(row.id) }}
                    animate={{ width: `${(row.usos / max) * 100}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  />
                </div>
              </div>
              <span className="text-right text-sm font-bold tabular-nums">{formatNumber(row.usos)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
