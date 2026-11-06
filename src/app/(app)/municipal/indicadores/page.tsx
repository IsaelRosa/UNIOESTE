import Link from "next/link";
import { Badge, Card, EmptyState, Notice, PageHeader, Progress, SectionTitle, Stat } from "@/components/ui";
import { reviewResultAction, submitResultAction } from "@/lib/actions";
import { requireMunicipal } from "@/lib/auth";
import { getMunicipalityIndicators, getResultsQueue } from "@/lib/data";
import { formatDateTime, formatNumber, formatPercent, statusMeta } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const user = await requireMunicipal();
  const params = await searchParams;
  const municipalityId = user.municipalityId as number;
  const [indicators, submitted] = await Promise.all([
    getMunicipalityIndicators(municipalityId),
    getResultsQueue({ status: "enviado", municipalityId, limit: 20 }),
  ]);

  const grouped = new Map<string, typeof indicators>();
  for (const indicator of indicators) {
    if (!grouped.has(indicator.axis)) grouped.set(indicator.axis, []);
    grouped.get(indicator.axis)!.push(indicator);
  }
  const isManager = user.role === "municipal_gestor";
  const corrections = indicators.filter((row) => row.status2025 === "corrigir").length;
  const approved = indicators.filter((row) => row.status2025 === "aprovado").length;
  const filled = indicators.filter((row) => row.status2025 !== null).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Módulo 2 e 3 · ${user.municipalityName} / PR`}
        title="Indicadores municipais"
        description="Preencha o resultado do ciclo, registre observações e anexe referência de comprovação. O envio segue para aprovação do gestor municipal."
        actions={
          <>
            <Link href="/municipal" className="btn btn-ghost">
              Voltar ao painel
            </Link>
            <Badge tone="accent">{isManager ? "Perfil gestor municipal" : "Perfil equipe técnica"}</Badge>
          </>
        }
      />

      {params.ok ? <Notice>{params.ok}</Notice> : null}
      {params.erro ? <Notice tone="warn">{params.erro}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Indicadores do plano" value={formatNumber(indicators.length)} hint="referência estadual" />
        <Stat label="Preenchidos" value={`${filled}/${indicators.length}`} hint={formatPercent((filled / Math.max(1, indicators.length)) * 100)} accent="#2c7c8a" />
        <Stat label="Aprovados" value={formatNumber(approved)} hint="incorporados ao consolidado" accent="#146b52" />
        <Stat label="Correções" value={formatNumber(corrections)} hint="ajustes solicitados" accent="#b4472f" />
      </div>

      {isManager && submitted.length ? (
        <Card className="p-5">
          <SectionTitle
            eyebrow="Fluxo de aprovação"
            title="Dados enviados pela equipe técnica"
            description="Revise as informações antes de encaminhar ao consolidado estadual."
            action={<Badge tone="warn">{submitted.length} aguardando</Badge>}
          />
          <div className="mt-3 space-y-2">
            {submitted.map((item) => (
              <div key={item.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold text-ink">{item.indicator}</p>
                    <p className="text-[10.5px] text-muted">
                      {item.indicatorCode} · {item.axis} · ciclo {item.period} · enviado {formatDateTime(item.submittedAt)}
                    </p>
                    {item.note ? <p className="mt-1 text-[10.5px] text-ink-soft">Observação: {item.note}</p> : null}
                  </div>
                  <div className="num text-right text-[12px]">
                    <span className="font-bold text-ink">{formatNumber(item.value, 1)}</span>
                    <span className="text-muted"> / ref. {formatNumber(item.target, 1)}</span>
                  </div>
                </div>
                <form action={reviewResultAction} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="backTo" value="/municipal/indicadores" />
                  <input name="note" className="input min-w-[200px] flex-1" placeholder="Observação da aprovação (opcional)" />
                  <button type="submit" name="decision" value="aprovar" className="btn btn-green btn-sm">
                    Aprovar
                  </button>
                  <button type="submit" name="decision" value="corrigir" className="btn btn-danger btn-sm">
                    Solicitar correção
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {[...grouped.entries()].map(([axisName, rows]) => {
          const color = rows[0]?.axisColor ?? "#146b52";
          return (
            <Card key={axisName} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <p className="text-[13px] font-semibold text-ink">{axisName}</p>
                  <Badge tone="neutral">{rows.length} indicadores</Badge>
                </div>
                <span className="text-[10.5px] text-muted">
                  {rows.filter((row) => row.status2025 === "aprovado").length} aprovados·{" "}
                  {rows.filter((row) => row.status2025 === "enviado").length} em análise
                </span>
              </div>
              <div className="divide-y divide-[#efeae0]">
                {rows.map((row) => {
                  const meta = row.status2025 ? statusMeta(row.status2025) : null;
                  return (
                    <details key={row.indicatorId} className="group">
                      <summary className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-[#fbf9f4]">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-neutral">{row.code}</span>
                            <p className="text-[12.5px] font-medium text-ink">{row.indicator}</p>
                            {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : <Badge tone="neutral">não preenchido</Badge>}
                          </div>
                          <p className="mt-0.5 text-[10.5px] text-muted">
                            {row.goal} · {row.frequency} · referência {formatNumber(row.target, 1)} {row.unit}
                          </p>
                          {row.reviewNote ? <p className="mt-0.5 text-[10.5px] text-rust">Parecer: {row.reviewNote}</p> : null}
                        </div>
                        <div className="w-24 text-right">
                          <p className="eyebrow">Informado</p>
                          <p className="num text-[14px] font-bold text-ink">{formatNumber(row.value2025, 1)}</p>
                        </div>
                        <div className="w-32">
                          <Progress value={row.execution} color={color} />
                        </div>
                        <span className="text-[10.5px] font-semibold text-verde group-open:hidden">preencher</span>
                      </summary>
                      <form action={submitResultAction} className="grid gap-3 bg-[#fdfcf8] px-5 py-4 md:grid-cols-2 xl:grid-cols-[160px_180px_1fr_1fr_auto]">
                        <input type="hidden" name="indicatorId" value={row.indicatorId} />
                        <input type="hidden" name="period" value="2025" />
                        <input type="hidden" name="backTo" value="/municipal/indicadores" />
                        <div>
                          <label className="label" htmlFor={`value-${row.indicatorId}`}>
                            Resultado do ciclo
                          </label>
                          <input
                            id={`value-${row.indicatorId}`}
                            name="value"
                            type="number"
                            step="0.1"
                            min="0"
                            defaultValue={row.value2025 ?? ""}
                            className="input"
                            placeholder="0,0"
                            required
                          />
                        </div>
                        <div>
                          <p className="label">Referência</p>
                          <p className="num rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-muted">
                            {formatNumber(row.target, 1)} {row.unit}
                          </p>
                        </div>
                        <div>
                          <label className="label" htmlFor={`note-${row.indicatorId}`}>
                            Observação
                          </label>
                          <input id={`note-${row.indicatorId}`} name="note" defaultValue="" className="input" placeholder="Detalhe da execução" />
                        </div>
                        <div>
                          <label className="label" htmlFor={`evidence-${row.indicatorId}`}>
                            Comprovação (referência)
                          </label>
                          <input
                            id={`evidence-${row.indicatorId}`}
                            name="evidence"
                            className="input"
                            placeholder="Link do relatório, processo ou portaria"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button type="submit" name="intent" value="rascunho" className="btn btn-ghost btn-sm">
                            Rascunho
                          </button>
                          <button type="submit" name="intent" value="enviar" className="btn btn-green btn-sm">
                            Enviar
                          </button>
                        </div>
                      </form>
                    </details>
                  );
                })}
              </div>
            </Card>
          );
        })}
        {!indicators.length ? (
          <EmptyState title="Nenhum indicador cadastrado" description="A gestão estadual precisa publicar a estrutura do plano para habilitar o preenchimento." />
        ) : null}
      </div>

      <Notice>
        Os dados enviados ficam disponíveis ao gestor municipal e, após aprovação, são incorporados ao consolidado estadual e ao
        portal público de transparência de forma agregada. Cada envio registra autor, data/hora e parecer.
      </Notice>
    </div>
  );
}
