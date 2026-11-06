import { formatNumber, formatPercent } from "@/lib/format";

export function TrendChart({
  data,
  height = 170,
}: {
  data: { period: string; execution: number; participating: number }[];
  height?: number;
}) {
  const width = 520;
  const padding = { top: 16, right: 18, bottom: 30, left: 38 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = 100;
  const min = Math.max(0, Math.min(...data.map((d) => d.execution), 60) - 20);
  const x = (index: number) => padding.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => padding.top + innerH - ((value - min) / (max - min)) * innerH;
  const line = data.map((d, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(d.execution)}`).join(" ");
  const area = `${line} L ${x(data.length - 1)} ${padding.top + innerH} L ${x(0)} ${padding.top + innerH} Z`;
  const ticks = [min, (min + max) / 2, max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Evolução da execução média">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#146b52" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#146b52" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="#e9e4d9"
            strokeDasharray="3 4"
          />
          <text x={padding.left - 8} y={y(tick) + 3} textAnchor="end" fontSize="9.5" fill="#8b969c">
            {formatNumber(tick)}%
          </text>
        </g>
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke="#146b52" strokeWidth="2.2" strokeLinejoin="round" />
      {data.map((d, index) => (
        <g key={d.period}>
          <circle cx={x(index)} cy={y(d.execution)} r="4.5" fill="#fff" stroke="#146b52" strokeWidth="2.2" />
          <text x={x(index)} y={y(d.execution) - 11} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0e2230">
            {formatPercent(d.execution)}
          </text>
          <text x={x(index)} y={height - 9} textAnchor="middle" fontSize="10" fill="#6b7a82">
            {d.period}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HBarChart({
  items,
  suffix = "%",
  showValue = true,
}: {
  items: { label: string; value: number | null; color?: string; hint?: string }[];
  suffix?: string;
  showValue?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.value ?? 0), 100);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[12.5px] font-medium text-ink-soft">{item.label}</span>
            <span className="num shrink-0 text-[12px] font-semibold text-ink">
              {item.value === null ? "—" : `${formatNumber(item.value, 0)}${suffix}`}
            </span>
          </div>
          <div className="h-[7px] w-full overflow-hidden rounded-full bg-[#efeae0]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.value === null ? 0 : Math.max(2, (item.value / max) * 100)}%`,
                background: item.color ?? "#146b52",
              }}
            />
          </div>
          {item.hint ? <p className="mt-1 text-[10.5px] text-muted">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function Gauge({
  value,
  label,
  size = 150,
  color = "#146b52",
}: {
  value: number | null;
  label: string;
  size?: number;
  color?: string;
}) {
  const radius = 54;
  const circumference = Math.PI * radius;
  const progress = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.66} viewBox="0 0 140 92" role="img" aria-label={label}>
        <path d="M 16 80 A 54 54 0 0 1 124 80" fill="none" stroke="#efeae0" strokeWidth="11" strokeLinecap="round" />
        <path
          d="M 16 80 A 54 54 0 0 1 124 80"
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${circumference * progress} ${circumference}`}
        />
        <text x="70" y="70" textAnchor="middle" fontSize="25" fontWeight="700" fill="#0e2230" className="num">
          {value === null ? "—" : `${formatNumber(value)}%`}
        </text>
      </svg>
      <p className="-mt-1 text-center text-[11.5px] font-medium text-muted">{label}</p>
    </div>
  );
}

export function Donut({
  segments,
  total,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}) {
  const radius = 52;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={centerLabel}>
        <circle cx="66" cy="66" r={radius} fill="none" stroke="#efeae0" strokeWidth={stroke} />
        {segments.map((segment) => {
          const length = total > 0 ? (segment.value / total) * circumference : 0;
          const dash = `${length} ${circumference - length}`;
          const element = (
            <circle
              key={segment.label}
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 66 66)"
              strokeLinecap="butt"
            />
          );
          offset += length;
          return element;
        })}
        <text x="66" y="62" textAnchor="middle" fontSize="21" fontWeight="700" fill="#0e2230" className="num">
          {formatNumber(total)}
        </text>
        <text x="66" y="78" textAnchor="middle" fontSize="9" fill="#6b7a82">
          {centerLabel}
        </text>
      </svg>
      <ul className="space-y-1.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-[12px] text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: segment.color }} />
            <span className="mr-2">{segment.label}</span>
            <span className="num font-semibold">{formatNumber(segment.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ColumnChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number | null; color?: string }[];
  height?: number;
}) {
  const width = 520;
  const padding = { top: 20, bottom: 34, left: 8, right: 8 };
  const innerH = height - padding.top - padding.bottom;
  const barWidth = Math.min(46, (width - padding.left - padding.right) / data.length - 14);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Comparativo por eixo">
      <line x1="0" x2={width} y1={padding.top + innerH} y2={padding.top + innerH} stroke="#e9e4d9" />
      {data.map((item, index) => {
        const slot = (width - padding.left - padding.right) / data.length;
        const x = padding.left + slot * index + (slot - barWidth) / 2;
        const barHeight = item.value === null ? 0 : Math.max(3, (Math.min(100, item.value) / 100) * innerH);
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={padding.top + innerH - barHeight}
              width={barWidth}
              height={barHeight}
              rx="5"
              fill={item.color ?? "#146b52"}
              opacity="0.92"
            />
            <text
              x={x + barWidth / 2}
              y={padding.top + innerH - barHeight - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#0e2230"
            >
              {item.value === null ? "—" : formatPercent(item.value)}
            </text>
            <text
              x={x + barWidth / 2}
              y={padding.top + innerH + 15}
              textAnchor="middle"
              fontSize="9"
              fill="#6b7a82"
            >
              {item.label.length > 12 ? `${item.label.slice(0, 11)}…` : item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
