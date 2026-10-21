export const ANOS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const DECADE_ORDER = ["1870s", "1920s", "1950s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s", "desconhecida"];

export function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(fraction: number, digits = 1) {
  return `${(fraction * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatDate(iso: string) {
  if (!iso) return "sem data";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatDateShort(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatMonthYear(year: number, month: number) {
  const name = MESES[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

export function norm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function labelDecada(decade: string) {
  if (!decade || decade === "desconhecida") return "Desconhecida";
  return `Anos ${decade.replace("s", "")}`;
}

export function decadeIndex(decade: string) {
  const key = decade || "desconhecida";
  const index = DECADE_ORDER.indexOf(key);
  return index === -1 ? 99 : index;
}

export function labelEstilo(estilo: string) {
  if (!estilo) return "Outro";
  return estilo.charAt(0).toUpperCase() + estilo.slice(1);
}

export function labelVersao(value: string) {
  if (value === "sim") return "Estrangeira";
  if (value === "não") return "Nacional";
  return "Não identificado";
}

export function tipoHint(fonte: string) {
  if (fonte.startsWith("inferido")) return "tipo inferido";
  if (fonte === "Planning") return "planning";
  return fonte;
}
