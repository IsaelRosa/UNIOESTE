import Link from "next/link";
import { PublicLayout } from "@/components/public-shell";
import { Badge, Card, Notice, SectionTitle } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { PERMISSIONS, ROLE_LABELS } from "@/lib/roles";

export const dynamic = "force-dynamic";

const COMPLIANCE = [
  ["Aplicação web", "Interface responsiva, acessível e compatível com navegadores corporativos.", "Protótipo navegável"],
  ["Linguagem Java", "Backend em Java 21 + Spring Boot 3, organizado em microsserviços.", "Definido na arquitetura"],
  ["Microsoft SQL Server", "Modelo relacional normalizado, migrações versionadas (Flyway) e views de agregação.", "Modelo do protótipo validado em PostgreSQL"],
  ["Microsserviços", "Serviços de plano, indicadores, território, workflow, relatórios e integrações, com API Gateway.", "Definido na arquitetura"],
  ["APIs REST com JSON", "Contrato OpenAPI 3.1, versionamento /v1 e paginação padronizada.", "Prototipado (API pública JSON)"],
  ["HTTPS, criptografia e RBAC", "TLS 1.2+, hash scrypt/BCrypt, RBAC por perfil e escopo territorial.", "Implementado no protótipo"],
  ["Metodologia Scrum", "Sprints de 2 semanas, backlog priorizado, reviews com a UNIOESTE.", "Plano de execução"],
  ["Hospedagem CELEPAR", "Pipeline de entrega em contêineres, com observabilidade e backup.", "Plano de implantação"],
  ["Acessibilidade eMAG", "Revisão de contraste, foco visível, navegação por teclado e rótulos ARIA.", "Etapa de homologação"],
];

const SERVICES = [
  { name: "plan-service", detail: "Eixos, objetivos, metas, ações e indicadores", color: "#146b52" },
  { name: "territory-service", detail: "Municípios, regiões e georreferenciamento", color: "#3e6b9c" },
  { name: "monitoring-service", detail: "Resultados, ciclos e consolidados", color: "#2c7c8a" },
  { name: "workflow-service", detail: "Envio, aprovação e correções com auditoria", color: "#b8862b" },
  { name: "reports-service", detail: "Consultas gerenciais e exportações XLSX/CSV", color: "#7a5aa6" },
  { name: "integration-service", detail: "Central de Segurança, CadÚnico e bases públicas", color: "#b4472f" },
  { name: "transparency-service", detail: "API pública agregada e anonimizada", color: "#6b7a3e" },
];

const ROADMAP = [
  ["Mês 1", "Requisitos e prototipação", "Workshops com a UNIOESTE, matriz de rastreabilidade, protótipos navegáveis e modelo de dados."],
  ["Meses 2–3", "Fundação e domínio", "Autenticação, RBAC, estrutura do plano, cadastros e APIs REST com contratos OpenAPI."],
  ["Meses 4–5", "Municípios, workflow e painéis", "Área municipal, fluxo de aprovação, dashboards, mapa, relatórios e integrações."],
  ["Meses 6–7", "Testes e homologação", "Testes funcionais, carga, segurança, acessibilidade eMAG e validação assistida."],
  ["Mês 8", "Implantação e capacitação", "Deploy CELEPAR, migração de dados, treinamento online e transferência de conhecimento."],
];

const SLA = [
  ["Extremamente alta", "Serviço indisponível ou risco a dados", "1 hora", "12 horas"],
  ["Alta", "Funcionalidade crítica degradada", "4 horas", "24 horas"],
  ["Média", "Erro com contorno operacional", "1 dia útil", "5 dias úteis"],
  ["Baixa", "Melhoria ou dúvida", "3 dias úteis", "Conforme backlog"],
];

const RISKS = [
  ["Alimentação de dados pelos 399 municípios", "Plano de engajamento, painel de conformidade, lembretes automáticos e assistência técnica regional."],
  ["Disponibilidade das APIs governamentais", "Camada anti-corrupção, cache, reprocessamento e fila de integração com retentativa."],
  ["Aderência ao prazo de 8 meses", "Escopo fatiado em sprints, MVP do fluxo crítico no mês 3 e paralelismo controlado."],
  ["Acessibilidade eMAG", "Revisão por especialista desde o design e testes automatizados de acessibilidade."],
  ["Segurança e LGPD", "Minimização de dados, anonimização no portal público, RBAC e trilha de auditoria imutável."],
  ["Sustentação por 12 meses com SLA", "Squad de sustentação, plantão definido e observabilidade com alertas."],
];

export default async function ArquiteturaPage() {
  const user = await getSessionUser();
  return (
    <PublicLayout user={user} active="arquitetura">
      <section className="py-9">
        <Badge tone="accent">Dossiê técnico do protótipo</Badge>
        <h1 className="display mt-3 max-w-4xl text-[34px] leading-[1.06] text-ink sm:text-[46px]">
          Arquitetura, conformidade e plano de execução do SISPROM-BR 360º
        </h1>
        <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">
          Material de apoio à proposta da Cronos Tecnologia e Sistemas para a UNIOESTE. O protótipo funcional demonstra a
          experiência do produto; a arquitetura de produção segue as exigências tecnológicas do edital.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/login" className="btn btn-primary">
            Explorar protótipo
          </Link>
          <Link href="/transparencia" className="btn btn-ghost">
            Ver portal público
          </Link>
        </div>
      </section>

      <Notice>
        <strong>Observação de escopo:</strong> este ambiente é um protótipo funcional de referência, construído para
        validação de requisitos, usabilidade e regras de negócio. A implementação contratada será entregue em Java + SQL
        Server, com microsserviços, APIs REST/JSON e hospedagem na CELEPAR, conforme o edital.
      </Notice>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Módulos do edital", "7/7", "cobertos no protótipo"],
          ["Perfis RBAC", "4", "com escopo territorial"],
          ["Cronograma", "8 meses", "+ 12 meses de suporte"],
          ["Integrações previstas", "3", "Central de Segurança, CadÚnico e bases públicas"],
        ].map(([label, value, hint]) => (
          <Card key={label} className="p-4">
            <p className="eyebrow">{label}</p>
            <p className="num display mt-1 text-[28px] leading-none text-ink">{value}</p>
            <p className="mt-1 text-[11px] text-muted">{hint}</p>
          </Card>
        ))}
      </section>

      <section className="mt-8">
        <SectionTitle eyebrow="Matriz de conformidade" title="Requisito do edital × entrega da Cronos" />
        <Card className="mt-3 overflow-hidden">
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Requisito</th>
                  <th>Como será atendido</th>
                  <th>Situação no protótipo</th>
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE.map(([requirement, how, status]) => (
                  <tr key={requirement}>
                    <td className="text-[12px] font-semibold text-ink">{requirement}</td>
                    <td className="text-[11.5px] leading-relaxed text-muted">{how}</td>
                    <td>
                      <Badge tone={status.includes("Implementado") || status.includes("Prototipado") || status.includes("Protótipo") ? "good" : status.includes("Definido") ? "info" : "warn"}>
                        {status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle eyebrow="Arquitetura de solução" title="Microsserviços e camadas" description="Separação por domínio, com API Gateway, segurança centralizada e banco relacional único por serviço." />
        <Card className="mt-3 p-5">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-[#f7f4ec] p-3">
              <p className="eyebrow">Canal</p>
              <p className="text-[12.5px] font-semibold text-ink">Frontend Web (React + eMAG)</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Painéis estadual e municipal, portal público, componentes acessíveis e consumo de APIs REST/JSON.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-[#f7f4ec] p-3">
              <p className="eyebrow">Borda</p>
              <p className="text-[12.5px] font-semibold text-ink">API Gateway + WAF</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                TLS, rate limiting, validação de token da Central de Segurança do Estado, logs e rastreamento.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-[#f7f4ec] p-3">
              <p className="eyebrow">Dados</p>
              <p className="text-[12.5px] font-semibold text-ink">Microsoft SQL Server</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Modelo normalizado, views materializadas de agregados, migrações Flyway e política de retenção.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((service) => (
              <div key={service.name} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: service.color }} />
                  <p className="font-mono text-[11px] font-semibold text-ink">{service.name}</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{service.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {[
              ["Central de Segurança do Estado", "Autenticação federada e ciclo de vida de identidade."],
              ["Cadastro Único", "Elegibilidade e territorialização de ações."],
              ["Bases sociais públicas", "IBGE, INEP e DATASUS para indicadores de contexto."],
            ].map(([name, detail]) => (
              <div key={name} className="rounded-xl border border-[#e7d3a9] bg-[#fbf4e5] p-3">
                <p className="text-[11.5px] font-semibold text-[#7d5a17]">{name}</p>
                <p className="text-[10.5px] leading-relaxed text-[#7d5a17]/80">{detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Controle de acesso" title="RBAC com escopo territorial" />
          <Card className="mt-3 overflow-hidden">
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Capacidade</th>
                    <th>Admin</th>
                    <th>Téc. estadual</th>
                    <th>Gestor municipal</th>
                    <th>Téc. municipal</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.slice(0, 6).map((row) => (
                    <tr key={row.capability}>
                      <td className="text-[11px] text-ink">{row.capability}</td>
                      {[row.estado_admin, row.estado_tecnico, row.municipal_gestor, row.municipal_tecnico].map((value, index) => (
                        <td key={index}>
                          <span className={`text-[10.5px] ${value === "Não" ? "text-muted" : "font-semibold text-verde"}`}>{value}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-2 text-[10.5px] text-muted">
            Perfis implementados: {Object.values(ROLE_LABELS).join(" · ")}.
          </p>
        </div>
        <div>
          <SectionTitle eyebrow="Cronograma" title="Execução em 8 meses" />
          <div className="mt-3 space-y-2">
            {ROADMAP.map(([period, title, detail]) => (
              <div key={period} className="card-flat flex gap-3 p-3">
                <span className="badge badge-neutral shrink-0">{period}</span>
                <div>
                  <p className="text-[12px] font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] text-muted">Suporte e manutenção corretiva por 12 meses após o recebimento definitivo.</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Sustentação" title="SLA de atendimento" />
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <table className="table">
              <thead>
                <tr>
                  <th>Prioridade</th>
                  <th>Retorno</th>
                  <th>Solução</th>
                </tr>
              </thead>
              <tbody>
                {SLA.map(([priority, , response, resolution]) => (
                  <tr key={priority}>
                    <td className="text-[11.5px] font-semibold text-ink">{priority}</td>
                    <td className="text-[11px] text-muted">{response}</td>
                    <td className="text-[11px] text-muted">{resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10.5px] text-muted">
            Plantão para prioridade extremamente alta com retorno em até 1 hora e solução definitiva em até 12 horas.
          </p>
        </Card>
        <Card className="p-5">
          <SectionTitle eyebrow="Gestão de riscos" title="Riscos e mitigação" />
          <div className="mt-3 space-y-2">
            {RISKS.map(([risk, mitigation]) => (
              <div key={risk} className="rounded-xl border border-line p-2.5">
                <p className="text-[11.5px] font-semibold text-ink">{risk}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{mitigation}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle eyebrow="Entregáveis da proposta" title="Três documentos para a banca" />
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            ["Documento de arquitetura", "Tecnologias, modelo de dados, integrações, segurança, RBAC e planos de implantação e continuidade.", "Este dossiê"],
            ["Protótipo navegável", "Painel estadual, painel municipal, cadastro de metas e indicadores, fluxo de aprovação, mapa e portal público.", "Ambiente demonstrativo"],
            ["Plano de execução", "Equipe, cronograma de 8 meses, custos, riscos, estratégia de implantação e sustentação com SLA.", "Cronograma e riscos acima"],
          ].map(([title, detail, tag]) => (
            <Card key={title} className="p-4">
              <Badge tone="accent">{tag}</Badge>
              <p className="mt-2 text-[13px] font-semibold text-ink">{title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-ink p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-[#8ea6af]">Próximo passo</p>
            <h2 className="display mt-1 text-[26px] leading-tight">Validar o protótipo com a UNIOESTE e fechar o escopo do MVP</h2>
            <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-[#c5d2d7]">
              O protótipo cobre os sete módulos do edital e permite estimar esforço por história de usuário. Recomenda-se
              congelar o modelo de dados e a matriz de rastreabilidade antes da sprint 1.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/painel" className="rounded-lg bg-white px-4 py-2 text-[12px] font-bold text-ink">
              Abrir painel estadual
            </Link>
            <Link href="/transparencia" className="rounded-lg border border-white/25 px-4 py-2 text-[12px] font-bold text-white">
              Portal público
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
