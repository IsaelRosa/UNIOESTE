import type { ReactNode } from "react";
import { formatNumber, formatPercent, situation, type Tone } from "@/lib/format";

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`card ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 className="display text-[24px] leading-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-6">
      <div className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-2 text-[30px] leading-[1.1] text-ink sm:text-[36px]">{title}</h1>
        {description ? <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

const toneClasses: Record<Tone, string> = {
  good: "badge-good",
  info: "badge-info",
  warn: "badge-warn",
  bad: "badge-bad",
  neutral: "badge-neutral",
  accent: "badge-accent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${toneClasses[tone]}`}>{children}</span>;
}

export function SituationBadge({ execution }: { execution: number | null }) {
  const meta = situation(execution);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function Stat({
  label,
  value,
  hint,
  trend,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { value: number | null; label: string };
  accent?: string;
}) {
  return (
    <div className="card relative overflow-hidden p-4">
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: accent ?? "#146b52", opacity: 0.85 }}
        aria-hidden
      />
      <p className="eyebrow">{label}</p>
      <p className="num display mt-2 text-[30px] leading-none text-ink">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {trend ? (
          <span
            className={`badge ${trend.value !== null && trend.value >= 0 ? "badge-good" : "badge-bad"}`}
            title={trend.label}
          >
            {trend.value === null ? "—" : `${trend.value >= 0 ? "▲" : "▼"} ${formatNumber(Math.abs(trend.value), 1)} p.p.`}
          </span>
        ) : null}
        {hint ? <span className="text-[11.5px] leading-tight text-muted">{hint}</span> : null}
      </div>
    </div>
  );
}

export function Progress({
  value,
  color = "#146b52",
  height = 6,
  track = "#eee9de",
}: {
  value: number | null;
  color?: string;
  height?: number;
  track?: string;
}) {
  const width = value === null ? 0 : Math.max(2, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 overflow-hidden rounded-full" style={{ height, background: track }}>
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="num w-10 shrink-0 text-right text-[11.5px] font-semibold text-ink-soft">
        {value === null ? "—" : formatPercent(value)}
      </span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-[#fbf9f4] px-6 py-10 text-center">
      <p className="display text-lg text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[12.5px] text-muted">{description}</p>
    </div>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M20 2 35.3 11v18L20 38 4.7 29V11Z" fill="#146b52" />
      <path d="M20 8.5 29.7 28H10.3Z" fill="#f5f2eb" opacity="0.92" />
      <circle cx="20" cy="21.5" r="3.1" fill="#b8862b" />
    </svg>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="num mt-1 text-[13px] font-semibold text-ink">{value}</p>
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  const styles =
    tone === "warn"
      ? "border-[#e7d3a9] bg-[#fbf4e5] text-[#7d5a17]"
      : "border-[#c9dee3] bg-[#eef5f6] text-[#255f6a]";
  return <div className={`rounded-xl border px-4 py-3 text-[12.5px] leading-relaxed ${styles}`}>{children}</div>;
}
