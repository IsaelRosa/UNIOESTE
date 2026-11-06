import Link from "next/link";
import { Badge, Card, EmptyState, Notice, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { reviewResultAction } from "@/lib/actions";
import { getQueueCounts, getResultsQueue } from "@/lib/data";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "enviado", label: "Aguardando análise" },
  { key: "corrigir", label: "Correções solicitadas" },
  { key: "aprovado", label: "Aprovados" },
];

export default async function ValidacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; ok?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const status = TABS.some((tab) => tab.key === params.status) ? (params.status as string) : "enviado";
  const search = params.q?.trim() ?? "";
  const [queue, counts] = await Promise.all([
    getResultsQueue({ status, search: search || undefined, limit: 40 }),
    getQueueCounts(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Módulo 3 · fluxo de validação"
        title="Fila de validação estadual"
        description="Dados enviados pelas equipes técnicas municipais e aprovados pelos gestores municipais. A gestão estadual consolida ou devolve para correção."
        actions={
          <>
            <Link href="/api/export?format=csv&period=2025" className="btn btn-ghost">
              Exportar CSV
            </Link>
            <Link href="/painel/relatorios" className="btn btn-primary">
              Consolidação
            </Link>
          </>
        }
      />

      {params.ok ? <Notice>{params.ok}</Notice> : null}
      {params.erro ? <Notice tone="warn">{params.erro}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Aguardando análise" value={formatNumber(counts.enviado ?? 0)} hint="registros enviados" accent="#b8862b" />
        <Stat label="Correções solicitadas" value={formatNumber(counts.corrigir ?? 0)} hint="devolvidos ao município" accent="#b4472f" />
        <Stat label="Registros aprovados" value={formatNumber(counts.aprovado ?? 0)} hint="consolidados no estado" accent="#146b52" />
        <Stat label="Rascunhos" value={formatNumber(counts.rascunho ?? 0)} hint="ainda não enviados" accent="#6b7a82" />
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Workflow"
          title="Registros para análise"
          description="Equipe técnica preenche → gestor municipal aprova → gestão estadual consolida. Toda decisão gera evento de auditoria."
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-line bg-[#f7f4ec] p-1">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/painel/validacao?status=${tab.key}`}
                className="tab"
                data-active={status === tab.key}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <form className="flex items-center gap-2" action="/painel/validacao" method="get">
            <input type="hidden" name="status" value={status} />
            <input name="q" defaultValue={search} className="input !w-56" placeholder="Buscar município ou indicador" />
            <button type="submit" className="btn btn-ghost btn-sm">
              Filtrar
            </button>
          </form>
        </div>

        <div className="mt-4 space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.axisColor }} />
                    <Link href={`/painel/municipios/${item.municipalityId}`} className="text-[13px] font-semibold text-ink hover:text-verde">
                      {item.municipality}
                    </Link>
                    <span className="text-[10.5px] text-muted">{item.region}</span>
                    <Badge tone="neutral">{item.axis}</Badge>
                    <Badge tone="accent">ciclo {item.period}</Badge>
                  </div>
                  <p className="mt-1.5 text-[12.5px] font-medium text-ink-soft">
                    {item.indicatorCode} · {item.indicator}
                  </p>
                  <p className="text-[11px] text-muted">{item.goal}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                  <div>
                    <p className="eyebrow">Informado</p>
                    <p className="num text-[14px] font-bold text-ink">
                      {formatNumber(item.value, 1)} <span className="text-[10px] font-normal text-muted">{item.unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow">Referência</p>
                    <p className="num text-[14px] font-semibold text-muted">{formatNumber(item.target, 1)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[10.5px] text-muted">
                <span>
                  Enviado por <strong className="text-ink-soft">{item.submittedBy ?? "equipe municipal"}</strong> em{" "}
                  {formatDateTime(item.submittedAt)}
                </span>
                <span>
                  {item.reviewedBy ? `Analisado por ${item.reviewedBy} em ${formatDateTime(item.reviewedAt)}` : "Sem análise registrada"}
                  {item.reviewNote ? ` · ${item.reviewNote}` : ""}
                </span>
              </div>

              {status !== "aprovado" ? (
                <form action={reviewResultAction} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="backTo" value={`/painel/validacao?status=${status}`} />
                  <div className="min-w-[220px] flex-1">
                    <label className="label" htmlFor={`note-${item.id}`}>
                      Parecer técnico (opcional)
                    </label>
                    <input
                      id={`note-${item.id}`}
                      name="note"
                      className="input"
                      placeholder="Ex.: conferir comprovação anexada"
                      defaultValue={item.reviewNote}
                    />
                  </div>
                  <button type="submit" name="decision" value="aprovar" className="btn btn-green btn-sm">
                    Aprovar registro
                  </button>
                  <button type="submit" name="decision" value="corrigir" className="btn btn-danger btn-sm">
                    Solicitar correção
                  </button>
                </form>
              ) : (
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <Badge tone="good">{formatPercent(item.value && item.target ? Math.min(100, (item.value / item.target) * 100) : null)} da referência</Badge>
                  <span className="text-[10.5px] text-muted">Registro incorporado ao consolidado estadual.</span>
                </div>
              )}
            </div>
          ))}
          {!queue.length ? (
            <EmptyState
              title="Nenhum registro nesta situação"
              description="Quando as equipes municipais enviarem dados, eles aparecerão aqui para análise da gestão estadual."
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
