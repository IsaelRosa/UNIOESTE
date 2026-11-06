import Link from "next/link";
import { Badge, Card, Notice, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { createTeamMemberAction, toggleTeamMemberAction } from "@/lib/actions";
import { requireMunicipal } from "@/lib/auth";
import { getTeam } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const user = await requireMunicipal();
  const params = await searchParams;
  const team = await getTeam(user.municipalityId as number);
  const isManager = user.role === "municipal_gestor";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Módulo 3 · ${user.municipalityName} / PR`}
        title="Equipe municipal"
        description="A equipe técnica alimenta os dados; o gestor municipal revisa e aprova. Apenas o gestor administra usuários do município."
        actions={
          <Link href="/municipal" className="btn btn-ghost">
            Voltar ao painel
          </Link>
        }
      />

      {params.ok ? <Notice>{params.ok}</Notice> : null}
      {params.erro ? <Notice tone="warn">{params.erro}</Notice> : null}

      {!isManager ? (
        <Notice tone="warn">
          Seu perfil é de equipe técnica municipal. A administração de usuários é restrita ao gestor municipal — solicite a ele
          a criação de novos acessos. Esta restrição é aplicada no servidor, não apenas na interface.
        </Notice>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Usuários vinculados" value={String(team.length)} hint="escopo deste município" />
        <Stat label="Ativos" value={String(team.filter((member) => member.active).length)} hint="com acesso liberado" accent="#146b52" />
        <Stat label="Perfis" value="2" hint="gestor e equipe técnica" accent="#3e6b9c" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle eyebrow="Acessos" title="Usuários do município" />
          </div>
          <div className="scroll-x mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Perfil</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <p className="text-[12px] font-semibold text-ink">{member.name}</p>
                      <p className="text-[10.5px] text-muted">{member.email}</p>
                    </td>
                    <td>
                      <Badge tone={member.role === "municipal_gestor" ? "accent" : "info"}>
                        {member.role === "municipal_gestor" ? "Gestor municipal" : "Equipe técnica"}
                      </Badge>
                    </td>
                    <td className="text-[11px] text-muted">{member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "nunca acessou"}</td>
                    <td>
                      <Badge tone={member.active ? "good" : "neutral"}>{member.active ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td>
                      {isManager && member.id !== user.id ? (
                        <form action={toggleTeamMemberAction}>
                          <input type="hidden" name="id" value={member.id} />
                          <input type="hidden" name="active" value={String(!member.active)} />
                          <button type="submit" className="btn btn-ghost btn-sm">
                            {member.active ? "Inativar" : "Reativar"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-[10.5px] text-muted">sessão atual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line bg-[#fbf9f4] px-5 py-2 text-[10.5px] text-muted">
            Criado em {formatDate(team[0]?.createdAt)} · dados de acesso protegidos por hash scrypt.
          </p>
        </Card>

        {isManager ? (
          <Card className="p-5">
            <SectionTitle eyebrow="Cadastro" title="Novo acesso municipal" description="O usuário criado recebe o vínculo automático com o município da sessão." />
            <form action={createTeamMemberAction} className="mt-3 space-y-3">
              <div>
                <label className="label" htmlFor="name">
                  Nome completo
                </label>
                <input id="name" name="name" className="input" required placeholder="Nome do servidor" />
              </div>
              <div>
                <label className="label" htmlFor="email">
                  E-mail institucional
                </label>
                <input id="email" name="email" type="email" className="input" required placeholder="nome@municipio.pr.gov.br" />
              </div>
              <div>
                <label className="label" htmlFor="role">
                  Perfil
                </label>
                <select id="role" name="role" className="select" defaultValue="municipal_tecnico">
                  <option value="municipal_tecnico">Equipe técnica municipal</option>
                  <option value="municipal_gestor">Gestor municipal</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="password">
                  Senha inicial
                </label>
                <input id="password" name="password" type="password" className="input" minLength={8} required placeholder="Mínimo de 8 caracteres" />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Cadastrar acesso
              </button>
              <p className="text-[10.5px] leading-relaxed text-muted">
                A criação é auditada. Recomenda-se solicitar a troca de senha no primeiro acesso e revisar os vínculos
                periodicamente.
              </p>
            </form>
          </Card>
        ) : (
          <Card className="p-5">
            <SectionTitle eyebrow="Restrição" title="Administração de usuários" />
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Você pode preencher e enviar indicadores, salvar rascunhos e consultar seus resultados. Criação, inativação e
              alteração de perfis exigem o usuário gestor municipal.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11.5px] text-ink-soft">
              <li>• Enviar indicadores e anexar comprovações</li>
              <li>• Corrigir dados devolvidos pelo gestor</li>
              <li>• Consultar a situação das metas do município</li>
              <li className="text-muted">• Administrar usuários (restrito ao gestor)</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
