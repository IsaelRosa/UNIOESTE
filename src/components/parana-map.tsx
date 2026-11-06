"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PARANA_PATH, PARANA_VIEWBOX, projectPoint } from "@/data/parana";
import { executionColor, formatNumber, formatPercent, situation } from "@/lib/format";

export type MapPoint = {
  id: number;
  name: string;
  region: string;
  lat: number;
  lng: number;
  execution: number | null;
  pending: number;
  approved: number;
};

export function ParanaMap({
  points,
  linkBase = "/painel/municipios",
  compact = false,
}: {
  points: MapPoint[];
  linkBase?: string;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<MapPoint | null>(points.find((p) => p.name === "Cascavel") ?? null);
  const [hovered, setHovered] = useState<MapPoint | null>(null);
  const [region, setRegion] = useState("todas");

  const regions = useMemo(() => [...new Set(points.map((p) => p.region))].sort((a, b) => a.localeCompare(b, "pt-BR")), [points]);
  const visible = useMemo(
    () => points.filter((point) => region === "todas" || point.region === region),
    [points, region],
  );
  const withData = visible.filter((point) => point.execution !== null);
  const avg = withData.length
    ? withData.reduce((acc, point) => acc + (point.execution ?? 0), 0) / withData.length
    : null;

  const maxX = PARANA_VIEWBOX.width;
  const maxY = PARANA_VIEWBOX.height;
  const detail = selected;
  const meta = situation(detail?.execution ?? null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <p className="eyebrow">Mapa territorial · 399 municípios</p>
            <p className="text-[12px] text-muted">
              {formatNumber(visible.length)} municípios exibidos · execução média {formatPercent(avg)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select className="select !w-auto !py-1.5 !text-[12px]" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="todas">Todas as regiões</option>
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="relative bg-[radial-gradient(600px_280px_at_50%_0%,#eef3ee,transparent)] px-3 py-4">
          <div className="relative mx-auto" style={{ maxWidth: compact ? 520 : 620 }}>
            <svg viewBox={`0 0 ${maxX} ${maxY}`} className="w-full" role="img" aria-label="Mapa dos municípios do Paraná">
              <defs>
                <linearGradient id="stateFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f0ede3" />
                  <stop offset="100%" stopColor="#e4e9de" />
                </linearGradient>
              </defs>
              <path d={PARANA_PATH} fill="url(#stateFill)" stroke="#c9c3b3" strokeWidth="1.4" />
              {visible.map((point) => {
                const [x, y] = projectPoint(point.lng, point.lat);
                const color = executionColor(point.execution);
                const isActive = selected?.id === point.id;
                return (
                  <circle
                    key={point.id}
                    cx={x}
                    cy={y}
                    r={isActive ? 6 : 3.6}
                    fill={color}
                    stroke={isActive ? "#0e2230" : "#ffffff"}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={point.execution === null ? 0.55 : 0.95}
                    className="map-dot"
                    onMouseEnter={() => setHovered(point)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(point)}
                  />
                );
              })}
              {hovered ? (
                <circle
                  cx={projectPoint(hovered.lng, hovered.lat)[0]}
                  cy={projectPoint(hovered.lng, hovered.lat)[1]}
                  r="10"
                  fill="none"
                  stroke="#0e2230"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                />
              ) : null}
            </svg>
            {hovered ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-lg"
                style={{
                  left: `${(projectPoint(hovered.lng, hovered.lat)[0] / maxX) * 100}%`,
                  top: `${(projectPoint(hovered.lng, hovered.lat)[1] / maxY) * 100}%`,
                }}
              >
                <p className="font-semibold text-ink">{hovered.name}</p>
                <p className="num text-muted">
                  {hovered.execution === null ? "sem dados" : formatPercent(hovered.execution)} · {hovered.pending} pendências
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-[10.5px] text-muted">
            {[
              ["Meta atingida", "#1F6F5C"],
              ["Em execução", "#2C7C8A"],
              ["Atenção", "#B8862B"],
              ["Crítico", "#B4472F"],
              ["Sem dados", "#9AA3AB"],
            ].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="border-t border-line bg-[#fbf9f4] px-4 py-2 text-[10.5px] text-muted">
          Posicionamento georreferenciado por coordenadas oficiais dos municípios · malha simplificada do Paraná.
        </p>
      </div>

      <div className="card flex flex-col p-4">
        {detail ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{detail.region}</p>
                <h3 className="display text-[24px] leading-tight text-ink">{detail.name}</h3>
              </div>
              <span className="badge" style={{ background: `${executionColor(detail.execution)}1a`, color: executionColor(detail.execution), borderColor: `${executionColor(detail.execution)}33` }}>
                {meta.label}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f7f4ec] p-3">
                <p className="eyebrow">Execução</p>
                <p className="num display text-[26px] text-ink">{formatPercent(detail.execution)}</p>
              </div>
              <div className="rounded-xl bg-[#f7f4ec] p-3">
                <p className="eyebrow">Fontes aprovadas</p>
                <p className="num display text-[26px] text-ink">{formatNumber(detail.approved)}</p>
              </div>
              <div className="rounded-xl bg-[#f7f4ec] p-3">
                <p className="eyebrow">Aguardando validação</p>
                <p className="num display text-[26px] text-ink">{formatNumber(detail.pending)}</p>
              </div>
              <div className="rounded-xl bg-[#f7f4ec] p-3">
                <p className="eyebrow">Situação</p>
                <p className="mt-1 text-[13px] font-semibold text-ink">{meta.label}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-line p-3">
              <p className="eyebrow mb-2">Leitura do território</p>
              <p className="text-[12px] leading-relaxed text-muted">
                {detail.execution === null
                  ? "Nenhum dado aprovado para o ciclo atual. A gestão municipal precisa enviar os indicadores para habilitar a leitura territorial."
                  : detail.execution >= 85
                    ? "O município superou a faixa de meta do ciclo. Recomenda-se documentar as práticas para disseminação regional."
                    : detail.execution >= 60
                      ? "Execução consistente, com espaço para avanço em indicadores de menor desempenho."
                      : "Execução abaixo do esperado. Priorizar assistência técnica e revisão das ações pactuadas."}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`${linkBase}/${detail.id}`} className="btn btn-primary btn-sm">
                Abrir painel do município
              </Link>
              <Link href={`/transparencia#dados`} className="btn btn-ghost btn-sm">
                Ver dados públicos
              </Link>
            </div>
            <p className="mt-auto pt-4 text-[10.5px] leading-relaxed text-muted">
              Clique em qualquer ponto do mapa para inspecionar o município. Dados agregados e anonimizados.
            </p>
          </>
        ) : (
          <p className="text-[12.5px] text-muted">Selecione um município no mapa.</p>
        )}
      </div>
    </div>
  );
}
