import ExcelJS from "exceljs";
import { getAxisPerformance, getExportRows, getOverview, getRegionPerformance } from "@/lib/data";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Município",
  "Região",
  "Eixo estratégico",
  "Meta",
  "Indicador",
  "Unidade",
  "Referência",
  "Valor informado",
  "Execução (%)",
  "Situação do registro",
  "Ciclo",
  "Atualizado em",
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const period = url.searchParams.get("period") === "2024" ? "2024" : "2025";
  const region = url.searchParams.get("regiao") ?? undefined;
  const axis = url.searchParams.get("eixo") ?? undefined;

  const [rows, overview, axes, regions] = await Promise.all([
    getExportRows({ region, axis, period }),
    getOverview(period),
    getAxisPerformance(period, region),
    getRegionPerformance(period, axis),
  ]);

  const generatedAt = new Date();
  const suffix = [period, region ? region.replace(/\s+/g, "-").toLowerCase() : "parana", axis ?? "todos-os-eixos"].join("-");

  if (format === "csv") {
    const lines = [
      HEADERS.join(";"),
      ...rows.map((row) =>
        [
          row.municipality,
          row.region,
          row.axis,
          row.goal,
          row.indicator,
          row.unit,
          row.target.toFixed(2).replace(".", ","),
          row.value === null ? "" : row.value.toFixed(2).replace(".", ","),
          row.execution === null ? "" : row.execution.toFixed(1).replace(".", ","),
          row.status,
          row.period,
          row.updatedAt ?? "",
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";"),
      ),
    ];
    return new Response(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sisprom-relatorio-${suffix}.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SISPROM-BR 360º";
  workbook.created = generatedAt;
  const summary = workbook.addWorksheet("Resumo executivo");
  summary.columns = [
    { header: "Indicador", key: "label", width: 46 },
    { header: "Valor", key: "value", width: 24 },
  ];
  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E2230" } };
  [
    ["Relatório", "Plano Estadual da Juventude — SISPROM-BR 360º"],
    ["Ciclo", period],
    ["Recorte regional", region ?? "Estado do Paraná"],
    ["Recorte por eixo", axis ?? "Todos os eixos"],
    ["Gerado em", generatedAt.toLocaleString("pt-BR")],
    ["Municípios com dados aprovados", overview.participants],
    ["Execução média (%)", Number((overview.execution ?? 0).toFixed(1))],
    ["Registros aprovados", overview.approved],
    ["Registros aguardando validação", overview.pending],
    ["Correções solicitadas", overview.corrections],
    ["Metas monitoradas", overview.goals],
    ["Indicadores monitorados", overview.indicators],
  ].forEach(([label, value]) => summary.addRow({ label, value }));

  const axisSheet = workbook.addWorksheet("Eixos");
  axisSheet.columns = [
    { header: "Eixo", key: "name", width: 38 },
    { header: "Execução (%)", key: "execution", width: 16 },
    { header: "Municípios com dados", key: "participants", width: 22 },
    { header: "Metas", key: "goals", width: 12 },
    { header: "Pendências", key: "pending", width: 14 },
  ];
  axisSheet.getRow(1).font = { bold: true };
  axes.forEach((row) =>
    axisSheet.addRow({
      name: row.name,
      execution: row.execution === null ? "" : Number(row.execution.toFixed(1)),
      participants: row.participants,
      goals: row.goalCount,
      pending: row.pending,
    }),
  );

  const regionSheet = workbook.addWorksheet("Regiões");
  regionSheet.columns = [
    { header: "Região", key: "region", width: 30 },
    { header: "Municípios", key: "municipalities", width: 14 },
    { header: "Com dados aprovados", key: "participating", width: 20 },
    { header: "Execução (%)", key: "execution", width: 16 },
    { header: "Pendências", key: "pending", width: 14 },
  ];
  regionSheet.getRow(1).font = { bold: true };
  regions.forEach((row) =>
    regionSheet.addRow({
      region: row.region,
      municipalities: row.municipalities,
      participating: row.participating,
      execution: row.execution === null ? "" : Number(row.execution.toFixed(1)),
      pending: row.pending,
    }),
  );

  const detail = workbook.addWorksheet("Dados por indicador");
  detail.columns = HEADERS.map((header) => ({ header, key: header, width: header.length + 8 }));
  detail.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  detail.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF146B52" } };
  detail.views = [{ state: "frozen", ySplit: 1 }];
  rows.forEach((row) =>
    detail.addRow({
      Município: row.municipality,
      Região: row.region,
      "Eixo estratégico": row.axis,
      Meta: row.goal,
      Indicador: row.indicator,
      Unidade: row.unit,
      Referência: row.target,
      "Valor informado": row.value ?? "",
      "Execução (%)": row.execution === null ? "" : Number(row.execution.toFixed(1)),
      "Situação do registro": row.status,
      Ciclo: row.period,
      "Atualizado em": row.updatedAt ?? "",
    }),
  );
  detail.autoFilter = { from: "A1", to: `L${Math.max(1, rows.length + 1)}` };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(Buffer.from(buffer)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sisprom-relatorio-${suffix}.xlsx"`,
    },
  });
}
