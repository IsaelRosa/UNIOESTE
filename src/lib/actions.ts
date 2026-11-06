"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, goals, policyLinks, results, users } from "@/db/schema";
import { authenticate, destroySession, getSessionUser, hashPassword, isStateRole, requireUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/roles";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function number(formData: FormData, key: string): number {
  return Number(text(formData, key).replace(",", "."));
}

function withNotice(path: string, key: "ok" | "erro", message: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

async function audit(
  user: { id: number; name: string; role: Role },
  action: string,
  entity: string,
  entityId: string,
  detail: string,
) {
  await db.insert(auditLogs).values({
    userId: user.id,
    userName: user.name,
    role: ROLE_LABELS[user.role],
    action,
    entity,
    entityId,
    detail,
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = text(formData, "email");
  const password = text(formData, "password");
  const next = text(formData, "next");
  const result = await authenticate(email, password);
  if (!result.ok) {
    redirect(`/login?erro=${encodeURIComponent(result.error)}&email=${encodeURIComponent(email)}`);
  }
  const user = await getSessionUser();
  const destination = next || (user && isStateRole(user.role) ? "/painel" : "/municipal");
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function submitResultAction(formData: FormData): Promise<void> {
  const user = await requireUser(["municipal_gestor", "municipal_tecnico"]);
  if (!user.municipalityId) redirect("/municipal");
  const indicatorId = number(formData, "indicatorId");
  const period = text(formData, "period") || "2025";
  const rawValue = text(formData, "value");
  const note = text(formData, "note");
  const evidence = text(formData, "evidence");
  const intent = text(formData, "intent") || "enviar";
  const backTo = text(formData, "backTo") || "/municipal/indicadores";
  const value = Number(rawValue.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) {
    redirect(withNotice(backTo, "erro", "Informe um valor numérico válido (maior ou igual a zero)."));
  }
  const status = intent === "rascunho" ? "rascunho" : "enviado";
  await db
    .insert(results)
    .values({
      indicatorId,
      municipalityId: user.municipalityId,
      period,
      value,
      note,
      evidence,
      status,
      submittedById: user.id,
      submittedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [results.indicatorId, results.municipalityId, results.period],
      set: {
        value,
        note,
        evidence,
        status,
        submittedById: user.id,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  await audit(
    user,
    status === "rascunho" ? "RESULTADO_RASCUNHO" : "RESULTADO_ENVIADO",
    "results",
    `${indicatorId}/${period}`,
    `Indicador ${indicatorId} atualizado com valor ${value} no ciclo ${period}`,
  );
  revalidatePath("/municipal");
  revalidatePath("/municipal/indicadores");
  revalidatePath("/painel");
  redirect(withNotice(backTo, "ok", status === "rascunho" ? "Rascunho salvo." : "Dados enviados para validação do gestor municipal."));
}

export async function reviewResultAction(formData: FormData): Promise<void> {
  const user = await requireUser(["estado_admin", "estado_tecnico", "municipal_gestor"]);
  const id = number(formData, "id");
  const decision = text(formData, "decision");
  const note = text(formData, "note");
  const backTo = text(formData, "backTo") || "/painel/validacao";
  const status = decision === "aprovar" ? "aprovado" : decision === "corrigir" ? "corrigir" : "enviado";

  const [current] = await db
    .select({ id: results.id, municipalityId: results.municipalityId, indicatorId: results.indicatorId, period: results.period })
    .from(results)
    .where(eq(results.id, id))
    .limit(1);
  if (!current) redirect(withNotice(backTo, "erro", "Registro não encontrado."));
  if (!isStateRole(user.role) && current.municipalityId !== user.municipalityId) {
    redirect(withNotice(backTo, "erro", "Sem permissão para validar dados de outro município."));
  }

  await db
    .update(results)
    .set({
      status,
      reviewedById: user.id,
      reviewedAt: new Date(),
      reviewNote: note,
      updatedAt: new Date(),
    })
    .where(eq(results.id, id));
  await audit(
    user,
    status === "aprovado" ? "RESULTADO_APROVADO" : status === "corrigir" ? "CORRECAO_SOLICITADA" : "RESULTADO_REABERTO",
    "results",
    String(id),
    `Indicador ${current.indicatorId} · município ${current.municipalityId} · ciclo ${current.period}${note ? ` · ${note}` : ""}`,
  );
  revalidatePath(backTo);
  revalidatePath("/painel");
  revalidatePath("/painel/validacao");
  revalidatePath("/municipal");
  redirect(withNotice(backTo, "ok", status === "aprovado" ? "Registro aprovado e incorporado ao consolidado estadual." : status === "corrigir" ? "Correção solicitada ao município." : "Registro reaberto para envio."));
}

export async function bulkApproveAction(formData: FormData): Promise<void> {
  const user = await requireUser(["estado_admin", "estado_tecnico", "municipal_gestor"]);
  const municipalityId = number(formData, "municipalityId");
  const backTo = text(formData, "backTo") || "/painel/validacao";
  if (!municipalityId) redirect(withNotice(backTo, "erro", "Município não informado."));
  if (!isStateRole(user.role) && municipalityId !== user.municipalityId) {
    redirect(withNotice(backTo, "erro", "Sem permissão para este município."));
  }
  const updated = await db
    .update(results)
    .set({ status: "aprovado", reviewedById: user.id, reviewedAt: new Date(), reviewNote: "Aprovação em lote", updatedAt: new Date() })
    .where(and(eq(results.municipalityId, municipalityId), eq(results.status, "enviado")))
    .returning({ id: results.id });
  await audit(user, "APROVACAO_EM_LOTE", "results", String(municipalityId), `${updated.length} registros aprovados em lote`);
  revalidatePath(backTo);
  revalidatePath("/painel");
  revalidatePath("/painel/validacao");
  redirect(withNotice(backTo, "ok", `${updated.length} registros aprovados em lote.`));
}

export async function createGoalAction(formData: FormData): Promise<void> {
  const user = await requireUser(["estado_admin"]);
  const objectiveId = number(formData, "objectiveId");
  const title = text(formData, "title");
  const description = text(formData, "description");
  const target = number(formData, "target");
  const unit = text(formData, "unit");
  const baseline = number(formData, "baseline");
  const deadline = text(formData, "deadline");
  const responsible = text(formData, "responsible");
  const weight = number(formData, "weight") || 1;
  const code = text(formData, "code");
  if (!objectiveId || !title || !unit || !deadline || !Number.isFinite(target)) {
    redirect(`/painel/plano?erro=${encodeURIComponent("Preencha objetivo, título, unidade, meta e prazo.")}`);
  }
  const [inserted] = await db
    .insert(goals)
    .values({
      objectiveId,
      code: code || `META-${Date.now().toString().slice(-5)}`,
      title,
      description: description || title,
      targetValue: target,
      unit,
      baseline: Number.isFinite(baseline) ? baseline : 0,
      deadline,
      responsible: responsible || "Coordenadoria Estadual da Juventude",
      weight: weight >= 1 ? weight : 1,
    })
    .returning({ id: goals.id, code: goals.code });
  await audit(user, "META_CRIADA", "goals", String(inserted.id), `Meta ${inserted.code} · ${title}`);
  revalidatePath("/painel/plano");
  revalidatePath("/painel");
  redirect(`/painel/plano?ok=${encodeURIComponent(`Meta ${inserted.code} criada com sucesso.`)}`);
}

export async function createPolicyLinkAction(formData: FormData): Promise<void> {
  const user = await requireUser(["estado_admin"]);
  const goalId = number(formData, "goalId");
  const policyPlanId = number(formData, "policyPlanId");
  const rationale = text(formData, "rationale");
  const strength = number(formData, "strength") || 2;
  if (!goalId || !policyPlanId || !rationale) {
    redirect(`/painel/integracoes?erro=${encodeURIComponent("Selecione a meta, o plano e descreva a justificativa.")}`);
  }
  await db.insert(policyLinks).values({ goalId, policyPlanId, rationale, strength });
  await audit(user, "INTEGRACAO_CRIADA", "policy_links", `${goalId}-${policyPlanId}`, rationale);
  revalidatePath("/painel/integracoes");
  revalidatePath("/transparencia");
  redirect(`/painel/integracoes?ok=${encodeURIComponent("Relação entre políticas registrada.")}`);
}

export async function createTeamMemberAction(formData: FormData): Promise<void> {
  const user = await requireUser(["municipal_gestor"]);
  if (!user.municipalityId) redirect("/municipal");
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const role = text(formData, "role") === "municipal_gestor" ? "municipal_gestor" : "municipal_tecnico";
  const password = text(formData, "password");
  if (!name || !email || password.length < 8) {
    redirect(`/municipal/equipe?erro=${encodeURIComponent("Informe nome, e-mail e senha com pelo menos 8 caracteres.")}`);
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    redirect(`/municipal/equipe?erro=${encodeURIComponent("Já existe um usuário com este e-mail.")}`);
  }
  const [inserted] = await db
    .insert(users)
    .values({
      name,
      email,
      role: role as Role,
      passwordHash: hashPassword(password),
      municipalityId: user.municipalityId,
    })
    .returning({ id: users.id });
  await audit(user, "USUARIO_CRIADO", "users", String(inserted.id), `${name} · ${ROLE_LABELS[role as Role]}`);
  revalidatePath("/municipal/equipe");
  redirect(`/municipal/equipe?ok=${encodeURIComponent("Membro da equipe cadastrado com sucesso.")}`);
}

export async function toggleTeamMemberAction(formData: FormData): Promise<void> {
  const user = await requireUser(["municipal_gestor"]);
  const id = number(formData, "id");
  const active = text(formData, "active") === "true";
  if (!user.municipalityId) redirect("/municipal");
  const [target] = await db
    .select({ id: users.id, municipalityId: users.municipalityId, name: users.name })
    .from(users)
    .where(inArray(users.id, [id]))
    .limit(1);
  if (!target || target.municipalityId !== user.municipalityId) {
    redirect(`/municipal/equipe?erro=${encodeURIComponent("Usuário não pertence ao seu município.")}`);
  }
  await db.update(users).set({ active }).where(eq(users.id, id));
  await audit(user, active ? "USUARIO_ATIVADO" : "USUARIO_INATIVADO", "users", String(id), target.name);
  revalidatePath("/municipal/equipe");
  redirect(`/municipal/equipe?ok=${encodeURIComponent(active ? "Usuário reativado." : "Usuário inativado.")}`);
}
