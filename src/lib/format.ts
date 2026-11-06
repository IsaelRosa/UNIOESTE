export const PERIODS = ["2025", "2024"] as const;
export type Period = (typeof PERIODS)[number];

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${formatNumber(value, digits)}%`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Tone = "good" | "info" | "warn" | "bad" | "neutral" | "accent";

export function situation(execution: number | null | undefined): { label: string; tone: Tone; short: string } {
  if (execution === null || execution === undefined) return { label: "Sem dados", tone: "neutral", short: "SD" };
  if (execution >= 85) return { label: "Meta atingida", tone: "good", short: "MA" };
  if (execution >= 60) return { label: "Em execução", tone: "info", short: "EE" };
  if (execution >= 35) return { label: "Atenção", tone: "warn", short: "AT" };
  return { label: "Crítico", tone: "bad", short: "CR" };
}

export const STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  enviado: { label: "Aguardando gestor", tone: "warn" },
  aprovado: { label: "Aprovado", tone: "good" },
  corrigir: { label: "Correção solicitada", tone: "bad" },
};

export function statusMeta(status: string) {
  return STATUS_LABELS[status] ?? { label: status, tone: "neutral" as Tone };
}

export const EXECUTION_COLORS: Record<string, string> = {
  good: "#1F6F5C",
  info: "#2C7C8A",
  warn: "#B8862B",
  bad: "#B4472F",
  neutral: "#9AA3AB",
  accent: "#3E6B9C",
};

export function executionColor(execution: number | null | undefined): string {
  const { tone } = situation(execution);
  return EXECUTION_COLORS[tone] ?? EXECUTION_COLORS.neutral;
}
