import Link from "next/link";
import { Badge, Card, EmptyState, Notice, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { createPolicyLinkAction } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { getAxisOptions, getGoalProgress, getPolicyNetwork } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const [user, network, goals, axes, params] = await Promise.all([
    getSessionUser(),
    getPolicyNetwork(),
    getGoalProgress("2025"),
    getAxisOptions(),
    searchParams,
  ]);

  const linkedGoals = [...new Map(network.links.map((link) => [link.code, link])).values()];
  const activePlans = network.plans.filter((plan) => plan.links > 0);

  const rowHeight = 44;
  const width = 980;
  const nodeWidth = 380;
  const leftX = 12;
  const rightX = width - nodeWidth - 12;
  const height = Math.max(linkedGoals.length, activePlans.length) * rowHeight + 52;
  const goalPositions = new Map(linkedGoals.map((goal, index) => [goal.code, 30 + index * rowHeight]));
  const planPositions = new Map(activePlans.map((plan, index) => [plan.name, 30 + index * rowHeight]));

  const axisLinkCounts = axes.map((axis) => ({
    ...axis,
    links: network.links.filter((link) => link.axisCode === axis.code).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Módulo 7 · integração entre políticas públicas"
        title="Metas conectadas, políticas integradas"
        description="Relações entre as metas do Plano Estadual da Juventude e os planos de Saúde, Educação, Assistência Social, Segurança, Cultura, Esporte e Direitos Humanos."
        actions={
          <>
            <Link href="/transparencia#politicas" className="btn btn-ghost">
              Ver no portal público
            </Link>
            {user?.role === "estado_admin" ? (
              <a href="#nova-integracao" className="btn btn-primary">
                Nova integração
              </a>
            ) : null}
          </>
        }
      />

      {params.ok ? <Notice>{params.ok}</Notice> : null}
      {params.erro ? <Notice tone="warn">{params.erro}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Planos relacionados" value={formatNumber(activePlans.length)} hint="políticas públicas conectadas" />
        <Stat label="Vínculos registrados" value={formatNumber(network.links.length)} hint="relações entre metas e planos" accent="#2c7c8a" />
        <Stat label="Metas com transversalidade" value={formatNumber(linkedGoals.length)} hint={`de ${formatNumber(goals.length)} metas do plano`} accent="#7a5aa6" />
        <Stat
          label="Eixos com maior conexão"
          value={axisLinkCounts.sort((a, b) => b.links - a.links)[0]?.name.split(" ")[0] ?? "—"}
          hint="maior volume de vínculos"
          accent="#b8862b"
        />
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Diagrama de conexões"
          title="Malha de integração entre políticas"
          description="Cada linha liga uma meta da Juventude a um plano estadual ou federal correlato. A cor identifica o eixo estratégico."
        />
        <div className="mt-4 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[820px]" role="img" aria-label="Diagrama de integração entre políticas públicas">
            <text x={leftX + 8} y={14} fontSize="10" fontWeight="700" fill="#6b7a82" letterSpacing="1.4">
              METAS DA JUVENTUDE
            </text>
            <text x={rightX + 8} y={14} fontSize="10" fontWeight="700" fill="#6b7a82" letterSpacing="1.4">
              PLANOS SETORIAIS
            </text>
            {network.links.map((link, index) => {
              const y1 = goalPositions.get(link.code);
              const y2 = planPositions.get(link.plan);
              if (y1 === undefined || y2 === undefined) return null;
              const x1 = leftX + nodeWidth;
              const x2 = rightX;
              const mid = (x1 + x2) / 2;
              return (
                <path
                  key={`${link.code}-${link.plan}-${index}`}
                  d={`M ${x1} ${y1 + 15} C ${mid} ${y1 + 15}, ${mid} ${y2 + 15}, ${x2} ${y2 + 15}`}
                  fill="none"
                  stroke={link.axisColor}
                  strokeWidth={link.strength >= 3 ? 2.1 : 1.2}
                  opacity={link.strength >= 3 ? 0.65 : 0.35}
                />
              );
            })}
            {linkedGoals.map((goal) => {
              const y = goalPositions.get(goal.code) ?? 0;
              return (
                <g key={goal.code}>
                  <rect x={leftX} y={y} width={nodeWidth} height={30} rx="7" fill="#fdfcf8" stroke="#e3ddd1" />
                  <rect x={leftX} y={y} width={4} height={30} rx="2" fill={goal.axisColor} />
                  <text x={leftX + 12} y={y + 13} fontSize="9.5" fontWeight="700" fill="#6b7a82">
                    {goal.code} · {goal.axis}
                  </text>
                  <text x={leftX + 12} y={y + 24} fontSize="10" fill="#0e2230">
                    {goal.title.length > 62 ? `${goal.title.slice(0, 60)}…` : goal.title}
                  </text>
                </g>
              );
            })}
            {activePlans.map((plan) => {
              const y = planPositions.get(plan.name) ?? 0;
              return (
                <g key={plan.name}>
                  <rect x={rightX} y={y} width={nodeWidth} height={30} rx="7" fill="#fdfcf8" stroke="#e3ddd1" />
                  <rect x={rightX + nodeWidth - 4} y={y} width={4} height={30} rx="2" fill={plan.color} />
                  <text x={rightX + 12} y={y + 13} fontSize="9.5" fontWeight="700" fill="#6b7a82">
                    {plan.sphere}
                  </text>
                  <text x={rightX + 12} y={y + 24} fontSize="10" fill="#0e2230">
                    {plan.name.length > 52 ? `${plan.name.slice(0, 50)}…` : plan.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle eyebrow="Relações registradas" title="Justificativas de integração" />
          </div>
          <div className="scroll-x mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Meta</th>
                  <th>Política relacionada</th>
                  <th>Justificativa</th>
                  <th>Intensidade</th>
                </tr>
              </thead>
              <tbody>
                {network.links.map((link) => (
                  <tr key={`${link.id}-${link.plan}`}>
                    <td>
                      <p className="text-[11.5px] font-semibold text-ink">{link.code}</p>
                      <p className="max-w-[220px] text-[10.5px] text-muted">{link.title}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm" style={{ background: link.planColor }} />
                        <span className="text-[11.5px] text-ink-soft">{link.plan}</span>
                      </div>
                    </td>
                    <td className="max-w-[280px] text-[11px] text-muted">{link.rationale}</td>
                    <td>
                      <Badge tone={link.strength >= 3 ? "good" : "neutral"}>{link.strength >= 3 ? "Alta" : "Média"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle eyebrow="Cobertura" title="Conexões por eixo" />
            <div className="mt-3 space-y-2">
              {axisLinkCounts
                .sort((a, b) => b.links - a.links)
                .map((axis) => (
                  <div key={axis.code} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: axis.color }} />
                    <span className="flex-1 truncate text-[11.5px] text-ink-soft">{axis.name}</span>
                    <span className="num text-[11.5px] font-semibold text-ink">{axis.links} vínculos</span>
                  </div>
                ))}
            </div>
          </Card>

          {user?.role === "estado_admin" ? (
            <Card id="nova-integracao" className="p-5">
              <SectionTitle eyebrow="Administração" title="Registrar nova relação" />
              <form action={createPolicyLinkAction} className="mt-3 space-y-3">
                <div>
                  <label className="label" htmlFor="goalId">
                    Meta da juventude
                  </label>
                  <select id="goalId" name="goalId" className="select" required>
                    {goals.map((goal) => (
                      <option key={goal.goalId} value={goal.goalId}>
                        {goal.code} · {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="policyPlanId">
                    Plano setorial
                  </label>
                  <select id="policyPlanId" name="policyPlanId" className="select" required>
                    {network.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="rationale">
                    Justificativa
                  </label>
                  <textarea id="rationale" name="rationale" rows={2} className="textarea" required placeholder="Como as metas se complementam" />
                </div>
                <div>
                  <label className="label" htmlFor="strength">
                    Intensidade
                  </label>
                  <select id="strength" name="strength" className="select" defaultValue="2">
                    <option value="1">Baixa</option>
                    <option value="2">Média</option>
                    <option value="3">Alta</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Registrar integração
                </button>
              </form>
            </Card>
          ) : (
            <Card className="p-5">
              <SectionTitle eyebrow="Permissões" title="Somente leitura" />
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                A criação de relações entre políticas é restrita ao administrador estadual. A equipe técnica pode consultar
                e exportar a malha de integração.
              </p>
            </Card>
          )}
        </div>
      </div>

      {!network.links.length ? (
        <EmptyState title="Nenhuma integração registrada" description="Cadastre relações entre metas e planos setoriais para habilitar o diagrama." />
      ) : null}
    </div>
  );
}
