import { getAxisPerformance, getMunicipalityPerformance, getOverview, getRegionPerformance } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") === "2024" ? "2024" : "2025";
  const [overview, axes, regions, municipalities] = await Promise.all([
    getOverview(period),
    getAxisPerformance(period),
    getRegionPerformance(period),
    getMunicipalityPerformance({ period }),
  ]);

  return Response.json(
    {
      fonte: "SISPROM-BR 360º · Plano Estadual da Juventude do Paraná",
      observacao:
        "Protótipo funcional com dados paramétricos para demonstração. Dados agregados e sem informação pessoal (LGPD).",
      ciclo: period,
      geradoEm: new Date().toISOString(),
      resumo: overview,
      eixos: axes.map((axis) => ({
        codigo: axis.code,
        nome: axis.name,
        execucaoMedia: axis.execution,
        metas: axis.goalCount,
        municipiosComDados: axis.participants,
        pendencias: axis.pending,
      })),
      regioes: regions.map((region) => ({
        nome: region.region,
        municipios: region.municipalities,
        municipiosComDados: region.participating,
        execucaoMedia: region.execution,
        pendencias: region.pending,
      })),
      municipios: municipalities.map((row) => ({
        id: row.id,
        nome: row.name,
        regiao: row.region,
        latitude: row.lat,
        longitude: row.lng,
        execucaoMedia: row.execution,
        registrosAprovados: row.approved,
        pendencias: row.pending,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
