import { Badge, Card, EmptyState, Notice, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { getAuditLogs, getQueueCounts } from "@/lib/data";
import { requireState } from "@/lib/auth";
import { PERMISSIONS, ROLE_LABELS } from "@/lib/roles";
import { formatDateTime, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  {
    name: "Central de Segurança do Estado (CELEPAR)",
    type: "Autenticação e identidade",
    status: "Contrato definido",
    detail: "SSO via OIDC/SAML, com federação de identidade institucional e sincronização de perfis.",
    tone: "info" as const,
  },
  {
    name: "Cadastro Único (CadÚnico)",
    type: "Base de dados social",
    status: "Mapeado",
    detail: "Consulta de elegibilidade para ações de permanência e proteção social, sem exposição de dados pessoais.",
    tone: "warn" as const,
  },
  {
    name: "Bases sociais públicas (IBGE, INEP, DATASUS)",
    type: "Enriquecimento de indicadores",
    status: "Mapeado",
    detail: "Coleta periódica para indicadores de contexto, com versionamento e registro de origem do dado.",
    tone: "warn" as const,
  },
  {
    name: "API REST pública de transparência",
    type: "Publicação de dados",
    status: "Prototipado",
    detail: "Endpoint JSON com agregados por eixo e região, utilizado pelo portal público e por consumidores externos.",
    tone: "good" as const,
  },
];

const SECURITY = [
  ["HTTPS obrigatório", "TLS 1.2+ em todas as camadas, HSTS e redirecionamento forçado.", "Implementado no protótipo"],
  ["RBAC por perfil e território", "Permissões verificadas no servidor, com escopo por município.", "Implementado"],
  ["Trilha de auditoria imutável", "Eventos de criação, envio, aprovação, correção e exportação.", "Implementado"],
  ["Sessão segura", "Cookie httpOnly assinado (HMAC), expiração de 12h e verificação de usuário ativo.", "Implementado"],
  ["Criptografia de senhas", "scrypt com salt individual; nunca armazenamento em texto claro.", "Implementado"],
  ["LGPD e minimização de dados", "Portal público com dados agregados e anonimizados.", "Implementado"],
  ["Acessibilidade eMAG / WCAG 2.1 AA", "Revisão de contraste, foco, navegação por teclado e leitores de tela.", "Etapa de homologação"],
  ["Backup e continuidade", "RPO 24h, RTO 4h, retenção de 90 dias em ambiente CELEPAR.", "Plano definido"],
];

export default async function AuditoriaPage() {
  const user = await requireState();
  const [logs, counts] = await Promise.all([getAuditLogs(50), getQueueCounts()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Segurança, governança e conformidade"
        title="Auditoria & controles de acesso"
        description="Trilha completa das operações, matriz de permissões por perfil e panorama das integrações previstas no edital."
        actions={<Badge tone="good">Ambiente de demonstração</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Eventos registrados" value={formatNumber(logs.length)} hint="últimas operações auditadas" />
        <Stat label="Registros aprovados" value={formatNumber(counts.aprovado ?? 0)} hint="com parecer registrado" accent="#146b52" />
        <Stat label="Pendências" value={formatNumber(counts.enviado ?? 0)} hint="aguardando análise" accent="#b8862b" />
        <Stat label="Perfis de acesso" value="4" hint="RBAC com escopo territorial" accent="#3e6b9c" />
      </div>

      <Notice>
        Sessão ativa: <strong>{user.name}</strong> · {ROLE_LABELS[user.role]} · {user.email}
        {user.municipalityName ? ` · escopo ${user.municipalityName}` : " · escopo estadual"}
      </Notice>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <SectionTitle eyebrow="Trilha de auditoria" title="Eventos do sistema" description="Registro sequencial de quem fez, o quê, quando e em qual entidade." />
        </div>
        <div className="scroll-x mt-3">
          <table className="table">
            <thead>
              <tr>
                <th>Data e hora</th>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.id}>
                  <td className="num whitespace-nowrap text-[11px] text-muted">{formatDateTime(entry.createdAt)}</td>
                  <td className="text-[11.5px] font-medium text-ink">{entry.userName}</td>
                  <td className="text-[10.5px] text-muted">{entry.role}</td>
                  <td>
                    <Badge tone="neutral">{entry.action.replaceAll("_", " ").toLowerCase()}</Badge>
                  </td>
                  <td className="text-[11px] text-muted">
                    {entry.entity}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                  </td>
                  <td className="max-w-[360px] text-[11px] text-ink-soft">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!logs.length ? (
            <div className="p-6">
              <EmptyState title="Nenhum evento registrado" description="As operações de escrita passam a compor a trilha de auditoria automaticamente." />
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <SectionTitle eyebrow="RBAC" title="Matriz de permissões" description="Controle de acesso baseado em perfis, com escopo territorial para os perfis municipais." />
        </div>
        <div className="scroll-x mt-3">
          <table className="table">
            <thead>
              <tr>
                <th>Capacidade</th>
                <th>{ROLE_LABELS.estado_admin}</th>
                <th>{ROLE_LABELS.estado_tecnico}</th>
                <th>{ROLE_LABELS.municipal_gestor}</th>
                <th>{ROLE_LABELS.municipal_tecnico}</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((row) => (
                <tr key={row.capability}>
                  <td className="text-[12px] font-medium text-ink">{row.capability}</td>
                  {[row.estado_admin, row.estado_tecnico, row.municipal_gestor, row.municipal_tecnico].map((value, index) => (
                    <td key={index}>
                      <Badge tone={value === "Não" ? "neutral" : value === "Total" ? "good" : "info"}>{value}</Badge>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle eyebrow="Integrações obrigatórias" title="Panorama de interfaces" />
          <div className="mt-3 space-y-2">
            {INTEGRATIONS.map((integration) => (
              <div key={integration.name} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-ink">{integration.name}</p>
                  <Badge tone={integration.tone}>{integration.status}</Badge>
                </div>
                <p className="mt-0.5 text-[10.5px] uppercase tracking-wide text-muted">{integration.type}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{integration.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle eyebrow="Controles" title="Segurança e acessibilidade" />
          <div className="mt-3 space-y-2">
            {SECURITY.map(([title, detail, status]) => (
              <div key={title} className="flex items-start justify-between gap-3 border-b border-[#efeae0] pb-2 last:border-none">
                <div>
                  <p className="text-[12px] font-semibold text-ink">{title}</p>
                  <p className="text-[11px] leading-relaxed text-muted">{detail}</p>
                </div>
                <Badge tone={status === "Implementado" || status.startsWith("Implementado") ? "good" : "warn"}>{status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
