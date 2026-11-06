export type Role = "estado_admin" | "estado_tecnico" | "municipal_gestor" | "municipal_tecnico";

export const ROLE_LABELS: Record<Role, string> = {
  estado_admin: "Gestão estadual · Administrador",
  estado_tecnico: "Equipe técnica estadual",
  municipal_gestor: "Gestor municipal",
  municipal_tecnico: "Equipe técnica municipal",
};

export const STATE_ROLES: Role[] = ["estado_admin", "estado_tecnico"];

export function isStateRole(role: Role): boolean {
  return STATE_ROLES.includes(role);
}

export const PERMISSIONS: { capability: string; estado_admin: string; estado_tecnico: string; municipal_gestor: string; municipal_tecnico: string }[] = [
  { capability: "Configurar plano, eixos, metas e indicadores", estado_admin: "Total", estado_tecnico: "Consulta", municipal_gestor: "Não", municipal_tecnico: "Não" },
  { capability: "Validar dados enviados pelos municípios", estado_admin: "Total", estado_tecnico: "Total", municipal_gestor: "Não", municipal_tecnico: "Não" },
  { capability: "Preencher e enviar resultados", estado_admin: "Não", estado_tecnico: "Não", municipal_gestor: "Total", municipal_tecnico: "Total" },
  { capability: "Aprovar dados da equipe municipal", estado_admin: "Total", estado_tecnico: "Total", municipal_gestor: "Total (próprio município)", municipal_tecnico: "Não" },
  { capability: "Administrar usuários do município", estado_admin: "Total", estado_tecnico: "Não", municipal_gestor: "Total (próprio município)", municipal_tecnico: "Não" },
  { capability: "Exportar relatórios gerenciais", estado_admin: "Total", estado_tecnico: "Total", municipal_gestor: "Próprio município", municipal_tecnico: "Próprio município" },
  { capability: "Consultar trilha de auditoria", estado_admin: "Total", estado_tecnico: "Total", municipal_gestor: "Próprio município", municipal_tecnico: "Não" },
  { capability: "Portal público de transparência", estado_admin: "Total", estado_tecnico: "Total", municipal_gestor: "Total", municipal_tecnico: "Total" },
];
