import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, Progress, SituationBadge, Stat } from "@/components/ui";
import { getAxisOptions, getMunicipalityPerformance, REGIONS } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

const SITUATIONS = [
  ["", "Todas as situações"],
  ["atingida", "Meta atingida"],
  ["execucao", "Em execução"],
  ["atencao", "Atenção"],
  ["critico", "Crítico"],
  ["sem_dados", "Sem dados"],
];

export default async function MunicipiosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; regiao?: string; eixo?: string; situacao?: string; periodo?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const period = params.periodo === "2024" ? "2024" : "2025";
  const [axes, municipalities] = await Promise.all([
    getAxisOptions(),
    getMunicipalityPerformance({
      period,
      region: params.regiao || undefined,
      axis: params.eixo || undefined,
      search: params.q?.trim() || undefined,
      situation: params.situacao || undefined,
    }),
  ]);
  const page = Math.max(1, Number(params.pagina ?? 1));
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(municipalities.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = municipalities.slice((current - 1) * pageSize, current * pageSize);
  const approved = municipalities.reduce((acc, row) => acc + row.approved, 0);
  const pending = municipalities.reduce((acc, row) => acc + row.pending, 0);
  const withData = municipalities.filter((row) => row.execution !== null);
  const avg = withData.length ? withData.reduce((acc, row) => acc + (row.execution ?? 0), 0) / withData.length : null;
  const queryString = new URLSearchParams(
    Object.entries({ q: params.q, regiao: params.regiao, eixo: params.eixo, situacao: params.situacao, periodo: period }).filter(
      ([, value]) => Boolean(value),
    ) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Módulo 2 · área dos municípios"
        title="Municípios do Paraná"
        description="Panorama dos 399 municípios: execução das metas, cobertura de indicadores, pendências de validação e situação de conformidade."
        actions={
          <>
            <Link href={`/api/export?format=csv&${queryString}`} className="btn btn-ghost">
              CSV
            </Link>
            <Link href={`/api/export?format=xlsx&${queryString}`} className="btn btn-primary">
              Exportar XLSX
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Municípios listados" value={formatNumber(municipalities.length)} hint={`ciclo ${period}`} />
        <Stat label="Execução média" value={formatPercent(avg)} hint={`${formatNumber(withData.length)} com dados aprovados`} accent="#2c7c8a" />
        <Stat label="Registros aprovados" value={formatNumber(approved)} hint="fontes validadas" accent="#146b52" />
        <Stat label="Pendências" value={formatNumber(pending)} hint="aguardando validação" accent="#b8862b" />
      </div>

      <Card className="p-4">
        <form action="/painel/municipios" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="label" htmlFor="q">
              Buscar município
            </label>
            <input id="q" name="q" defaultValue={params.q ?? ""} className="input" placeholder="Nome do município" />
          </div>
          <div>
            <label className="label" htmlFor="regiao">
              Região
            </label>
            <select id="regiao" name="regiao" defaultValue={params.regiao ?? ""} className="select">
              <option value="">Todas</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="eixo">
              Eixo
            </label>
            <select id="eixo" name="eixo" defaultValue={params.eixo ?? ""} className="select">
              <option value="">Todos</option>
              {axes.map((axis) => (
                <option key={axis.code} value={axis.code}>
                  {axis.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="situacao">
              Situação
            </label>
            <select id="situacao" name="situacao" defaultValue={params.situacao ?? ""} className="select">
              {SITUATIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <input type="hidden" name="periodo" value={period} />
            <button type="submit" className="btn btn-primary">
              Aplicar
            </button>
            <Link href="/painel/municipios" className="btn btn-ghost">
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-[12px] font-semibold text-ink">
            {formatNumber(municipalities.length)} municípios encontrados
            {params.eixo ? ` · eixo ${axes.find((axis) => axis.code === params.eixo)?.name ?? params.eixo}` : ""}
          </p>
          <span className="text-[10.5px] text-muted">
            Página {current} de {totalPages} · ciclo {period}
          </span>
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Município</th>
                <th>Região</th>
                <th style={{ minWidth: 170 }}>Execução</th>
                <th>Indicadores aprovados</th>
                <th>Pendências</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="num text-muted">{(current - 1) * pageSize + index + 1}</td>
                  <td>
                    <Link href={`/painel/municipios/${row.id}`} className="font-semibold text-ink hover:text-verde">
                      {row.name}
                    </Link>
                  </td>
                  <td className="text-[11.5px] text-muted">{row.region}</td>
                  <td>
                    <Progress value={row.execution} color={(row.execution ?? 0) >= 60 ? "#146b52" : (row.execution ?? 0) >= 35 ? "#b8862b" : "#b4472f"} />
                  </td>
                  <td>
                    <span className="num text-[12px] font-semibold text-ink">{formatNumber(row.indicatorsApproved)}</span>
                    {row.corrections ? <span className="ml-2 badge badge-bad">{row.corrections} correção</span> : null}
                  </td>
                  <td>
                    {row.pending ? <Badge tone="warn">{formatNumber(row.pending)}</Badge> : <span className="text-[11px] text-muted">—</span>}
                  </td>
                  <td>
                    <SituationBadge execution={row.execution} />
                  </td>
                  <td>
                    <Link href={`/painel/municipios/${row.id}`} className="btn btn-ghost btn-sm">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <div className="p-6">
              <EmptyState title="Nenhum município encontrado" description="Ajuste os filtros de região, eixo ou situação para ampliar a busca." />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <span className="text-[11px] text-muted">
            Exibindo {formatNumber(rows.length)} de {formatNumber(municipalities.length)} registros
          </span>
          <div className="flex gap-2">
            <Link
              href={`/painel/municipios?${new URLSearchParams({ ...(params as Record<string, string>), pagina: String(Math.max(1, current - 1)) }).toString()}`}
              className={`btn btn-ghost btn-sm ${current === 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              Anterior
            </Link>
            <Link
              href={`/painel/municipios?${new URLSearchParams({ ...(params as Record<string, string>), pagina: String(Math.min(totalPages, current + 1)) }).toString()}`}
              className={`btn btn-ghost btn-sm ${current === totalPages ? "pointer-events-none opacity-40" : ""}`}
            >
              Próxima
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
