import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "estado_admin",
  "estado_tecnico",
  "municipal_gestor",
  "municipal_tecnico",
]);

export const resultStatusEnum = pgEnum("result_status", [
  "rascunho",
  "enviado",
  "aprovado",
  "corrigir",
]);

export const municipalities = pgTable(
  "municipalities",
  {
    id: serial("id").primaryKey(),
    ibgeCode: varchar("ibge_code", { length: 7 }).notNull(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
  },
  (table) => [
    uniqueIndex("municipalities_ibge_idx").on(table.ibgeCode),
    index("municipalities_region_idx").on(table.region),
  ],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    municipalityId: integer("municipality_id").references(() => municipalities.id),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const axes = pgTable("axes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  color: varchar("color", { length: 9 }).notNull(),
  position: integer("position").notNull().default(0),
});

export const objectives = pgTable("objectives", {
  id: serial("id").primaryKey(),
  axisId: integer("axis_id")
    .notNull()
    .references(() => axes.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 16 }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id")
    .notNull()
    .references(() => objectives.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 24 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetValue: doublePrecision("target_value").notNull(),
  unit: text("unit").notNull(),
  baseline: doublePrecision("baseline").notNull().default(0),
  deadline: text("deadline").notNull(),
  responsible: text("responsible").notNull(),
  weight: integer("weight").notNull().default(1),
  status: text("status").notNull().default("em_execucao"),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 24 }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  responsible: text("responsible").notNull(),
  status: text("status").notNull().default("em_execucao"),
});

export const indicators = pgTable("indicators", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id")
    .notNull()
    .references(() => actions.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 24 }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  unit: text("unit").notNull(),
  targetValue: doublePrecision("target_value").notNull(),
  source: text("source").notNull(),
  frequency: text("frequency").notNull().default("Anual"),
  polarity: text("polarity").notNull().default("maior_melhor"),
});

export const results = pgTable(
  "results",
  {
    id: serial("id").primaryKey(),
    indicatorId: integer("indicator_id")
      .notNull()
      .references(() => indicators.id, { onDelete: "cascade" }),
    municipalityId: integer("municipality_id")
      .notNull()
      .references(() => municipalities.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    value: doublePrecision("value").notNull(),
    note: text("note").notNull().default(""),
    evidence: text("evidence").notNull().default(""),
    status: resultStatusEnum("status").notNull().default("rascunho"),
    submittedById: integer("submitted_by_id").references(() => users.id),
    reviewedById: integer("reviewed_by_id").references(() => users.id),
    reviewNote: text("review_note").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("results_unique_idx").on(table.indicatorId, table.municipalityId, table.period),
    index("results_municipality_idx").on(table.municipalityId),
    index("results_status_idx").on(table.status),
  ],
);

export const policyPlans = pgTable("policy_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sphere: text("sphere").notNull(),
  description: text("description").notNull(),
  color: varchar("color", { length: 9 }).notNull(),
});

export const policyLinks = pgTable("policy_links", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  policyPlanId: integer("policy_plan_id")
    .notNull()
    .references(() => policyPlans.id, { onDelete: "cascade" }),
  rationale: text("rationale").notNull(),
  strength: integer("strength").notNull().default(2),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    userName: text("user_name").notNull(),
    role: text("role").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull().default(""),
    detail: text("detail").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_created_idx").on(table.createdAt)],
);

export type Municipality = typeof municipalities.$inferSelect;
export type User = typeof users.$inferSelect;
export type Indicator = typeof indicators.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type ResultRow = typeof results.$inferSelect;
