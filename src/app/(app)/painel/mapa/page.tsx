import Link from "next/link";
import { ParanaMap, type MapPoint } from "@/components/parana-map";
import { Badge, Card, PageHeader, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import { getAxisOptions, getMunicipalityPerformance, getOverview, getRegionPerformance, REGIONS } from "@/lib/data";
import { formatNumber, formatPercent, situation } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MapaPage({
  searchParams,
}: {
  searchParams: Promise<{ regiao?: string; eixo?: string; periodo?: string }>;
}) {
  const params = await searchParams;
  const period = params.periodo === "2024" ? "2024" : "2025";
  const region = params.regiao || undefined;
  const axis = params.eixo || undefined;

  const [municipalities, overview, regions, axes] = await Promise.all([
    getMunicipalityPerformance({ period, region, axis }),
    getOverview(period),
    getRegionPerformance(period, axis),
    getAxisOptions(),
  ]);

  const points: MapPoint[] = municipalities.map((row) => ({
    id: row.id,
    name: row.name,
    region: row.region,
    lat: row.lat,
    lng: row.lng,
    execution: row.execution,
    pending: row.pending,
    approved: row.approved,
  }));

  const groups = [
    { label: "Meta atingida", filter: (value: number | null) => value !== null && value >= 85, tone: "good" as const },
    { label: "Em execução", filter: (value: number | null) => value !== null && value >= 60 && value < 85, tone: "info" as const },
    { label: "Atenção", filter: (value: number | null) => value !== null && value >= 35 && value < 60, tone: "warn" as const },
    { label: "Crítico", filter: (value: number | null) => value !== null && value < 35, tone: "bad" as const },
    { label: "Sem dados", filter: (value: number | null) => value === null, tone: "neutral" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Módulo 5 · mapa georreferenciado"
        title="Inteligência territorial do Paraná"
        description="Leitura georreferenciada dos indicadores por município. Selecione um ponto no mapa para inspecionar metas atingidas, pendências e situação geral."
        actions={
          <>
            <div className="flex rounded-lg border border-line bg-white p-1">
              {["2025", "2024"].map((item) => (
                <Link
                  key={item}
                  href={`/painel/mapa?periodo=${item}${region ? `&regiao=${encodeURIComponent(region)}` : ""}${axis ? `&eixo=${axis}` : ""}`}
                  className="tab"
                  data-active={period === item}
                >
                  {item}
                </Link>
              ))}
            </div>
            <Link href={`/api/export?format=xlsx&period=${period}`} className="btn btn-primary">
              Exportar base
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Municípios monitorados" value={formatNumber(municipalities.length)} hint={`de ${formatNumber(overview.municipalities)} no estado`} />
        <Stat label="Execução média" value={formatPercent(overview.execution)} hint={`ciclo ${period}`} accent="#2c7c8a" />
        <Stat
          label="Municípios com dados"
          value={formatNumber(municipalities.filter((row) => row.execution !== null).length)}
          hint={`${formatNumber(municipalities.filter((row) => row.execution === null).length)} sem dados aprovados`}
          accent="#b8862b"
        />
        <Stat label="Pendências no recorte" value={formatNumber(municipalities.reduce((acc, row) => acc + row.pending, 0))} hint="aguardando validação" accent="#b4472f" />
      </div>

      <Card className="p-4">
        <form action="/painel/mapa" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="label" htmlFor="regiao">
              Região
            </label>
            <select id="regiao" name="regiao" defaultValue={region ?? ""} className="select">
              <option value="">Todas as regiões</option>
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="eixo">
              Eixo estratégico
            </label>
            <select id="eixo" name="eixo" defaultValue={axis ?? ""} className="select">
              <option value="">Todos os eixos</option>
              {axes.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="periodo">
              Ciclo
            </label>
            <select id="periodo" name="periodo" defaultValue={period} className="select">
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary">
              Aplicar filtros
            </button>
          </div>
        </form>
      </Card>

      <ParanaMap points={points} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Distribuição" title="Municípios por faixa de execução" />
          <div className="mt-3 space-y-2">
            {groups.map((group) => {
              const count = municipalities.filter((row) => group.filter(row.execution)).length;
              return (
                <div key={group.label} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={group.tone}>{group.label}</Badge>
                    <span className="text-[11px] text-muted">{formatPercent((count / Math.max(1, municipalities.length)) * 100)} do recorte</span>
                  </div>
                  <span className="num text-[13px] font-bold text-ink">{formatNumber(count)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-[#f7f4ec] p-3">
            <p className="eyebrow mb-1">Como ler o mapa</p>
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              A cor representa a execução média das metas do município no ciclo. Municípios sem dados aparecem em cinza e
              demandam ação de assistência técnica. A escala é comparável entre ciclos e eixos.
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle eyebrow="Agregação regional" title="Desempenho por região" />
          </div>
          <div className="scroll-x mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Região</th>
                  <th>Municípios</th>
                  <th style={{ minWidth: 160 }}>Execução</th>
                  <th>Pendências</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {[...regions]
                  .sort((a, b) => (b.execution ?? -1) - (a.execution ?? -1))
                  .map((row) => (
                    <tr key={row.region}>
                      <td className="font-medium text-ink">{row.region}</td>
                      <td className="num">{formatNumber(row.municipalities)}</td>
                      <td>
                        <Progress value={row.execution} color={row.execution && row.execution >= 60 ? "#146b52" : "#b8862b"} />
                      </td>
                      <td>
                        <Badge tone={row.pending ? "warn" : "good"}>{formatNumber(row.pending)}</Badge>
                      </td>
                      <td>
                        <SituationBadge execution={row.execution} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Priorização"
          title="Municípios com menor execução"
          description={`${situation(null).label === "Sem dados" ? "Territórios que precisam de apoio" : "Territórios prioritários"} para assistência técnica estadual.`}
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[...municipalities]
            .filter((row) => row.execution !== null)
            .reverse()
            .slice(0, 8)
            .map((row) => (
              <Link key={row.id} href={`/painel/municipios/${row.id}`} className="rounded-xl border border-line p-3 hover:bg-[#fbf9f4]">
                <p className="truncate text-[12px] font-semibold text-ink">{row.name}</p>
                <p className="text-[10px] text-muted">{row.region}</p>
                <div className="mt-1.5">
                  <Progress value={row.execution} color="#b4472f" />
                </div>
              </Link>
            ))}
        </div>
      </Card>
    </div>
  );
}
