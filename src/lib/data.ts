import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { PR_REGIONS } from "@/data/municipalities";

export type Tone = "good" | "info" | "warn" | "bad" | "neutral" | "accent";

const ratio = sql`(CASE WHEN i.polarity = 'menor_melhor' THEN i.target_value / NULLIF(r.value, 0) ELSE r.value / NULLIF(i.target_value, 0) END)`;
const filteredRatio = sql`(CASE WHEN i.polarity = 'menor_melhor' THEN i.target_value / NULLIF(f.value, 0) ELSE f.value / NULLIF(i.target_value, 0) END)`;
const baseJoins = sql`FROM results r
  JOIN municipalities m ON m.id = r.municipality_id
  JOIN indicators i ON i.id = r.indicator_id
  JOIN actions ac ON ac.id = i.action_id
  JOIN goals g ON g.id = ac.goal_id
  JOIN objectives o ON o.id = g.objective_id
  JOIN axes a ON a.id = o.axis_id`;

const axisExists = (axis: string): SQL => sql`EXISTS (
  SELECT 1 FROM indicators i2
  JOIN actions ac2 ON ac2.id = i2.action_id
  JOIN goals g2 ON g2.id = ac2.goal_id
  JOIN objectives o2 ON o2.id = g2.objective_id
  JOIN axes a2 ON a2.id = o2.axis_id
  WHERE i2.id = r.indicator_id AND a2.code = ${axis}
)`;

async function query<T>(statement: SQL): Promise<T[]> {
  const result = await db.execute(statement);
  return result.rows as T[];
}

const num = (value: unknown, fallback: number | null = null): number | null => {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const PERIODS = ["2025", "2024"] as const;
export const REGIONS = [...PR_REGIONS] as string[];

// ---------------------------------------------------------------- overview --
export type Overview = {
  municipalities: number;
  participants: number;
  approved: number;
  pending: number;
  corrections: number;
  execution: number | null;
  previousExecution: number | null;
  axes: number;
  goals: number;
  indicators: number;
  goalsOnTrack: number;
  goalsCritical: number;
};

export async function getOverview(period = "2025"): Promise<Overview> {
  const [current] = await query<Record<string, unknown>>(sql`
    SELECT
      COUNT(DISTINCT CASE WHEN r.status = 'aprovado' THEN r.municipality_id END) AS participants,
      COUNT(*) FILTER (WHERE r.status = 'aprovado') AS approved,
      COUNT(*) FILTER (WHERE r.status = 'enviado') AS pending,
      COUNT(*) FILTER (WHERE r.status = 'corrigir') AS corrections,
      AVG(LEAST(1.0, ${ratio})) FILTER (WHERE r.status = 'aprovado') * 100 AS execution
    ${baseJoins}
    WHERE r.period = ${period}
  `);
  const [previous] = await query<Record<string, unknown>>(sql`
    SELECT AVG(LEAST(1.0, ${ratio})) FILTER (WHERE r.status = 'aprovado') * 100 AS execution
    ${baseJoins} WHERE r.period = '2024'
  `);
  const [structure] = await query<Record<string, unknown>>(sql`
    SELECT
      (SELECT COUNT(*) FROM municipalities) AS municipalities,
      (SELECT COUNT(*) FROM axes) AS axes,
      (SELECT COUNT(*) FROM goals) AS goals,
      (SELECT COUNT(*) FROM indicators) AS indicators
  `);
  const goalRows = await getGoalProgress(period);
  const execution = num(current?.execution, 0) ?? 0;
  return {
    municipalities: num(structure?.municipalities, 0) ?? 0,
    participants: num(current?.participants, 0) ?? 0,
    approved: num(current?.approved, 0) ?? 0,
    pending: num(current?.pending, 0) ?? 0,
    corrections: num(current?.corrections, 0) ?? 0,
    execution,
    previousExecution: num(previous?.execution, 0),
    axes: num(structure?.axes, 0) ?? 0,
    goals: num(structure?.goals, 0) ?? 0,
    indicators: num(structure?.indicators, 0) ?? 0,
    goalsOnTrack: goalRows.filter((g) => (g.execution ?? 0) >= 85).length,
    goalsCritical: goalRows.filter((g) => (g.execution ?? 0) < 35).length,
  };
}

// ------------------------------------------------------------ axis/region ----
export type AxisPerformance = {
  id: number;
  code: string;
  name: string;
  color: string;
  execution: number | null;
  approved: number;
  pending: number;
  corrections: number;
  participants: number;
  goalCount: number;
};

export async function getAxisPerformance(period = "2025", region?: string): Promise<AxisPerformance[]> {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT a.id, a.code, a.name, a.color,
      AVG(LEAST(1.0, ${ratio})) FILTER (WHERE r.status = 'aprovado') * 100 AS execution,
      COUNT(*) FILTER (WHERE r.status = 'aprovado') AS approved,
      COUNT(*) FILTER (WHERE r.status = 'enviado') AS pending,
      COUNT(*) FILTER (WHERE r.status = 'corrigir') AS corrections,
      COUNT(DISTINCT m.id) FILTER (WHERE r.status = 'aprovado') AS participants,
      (SELECT COUNT(*) FROM goals gx JOIN objectives ox ON ox.id = gx.objective_id WHERE ox.axis_id = a.id) AS goal_count
    ${baseJoins}
    WHERE r.period = ${period} ${region ? sql`AND m.region = ${region}` : sql``}
    GROUP BY a.id, a.code, a.name, a.color, a.position
    ORDER BY a.position
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    color: String(row.color),
    execution: num(row.execution),
    approved: num(row.approved, 0) ?? 0,
    pending: num(row.pending, 0) ?? 0,
    corrections: num(row.corrections, 0) ?? 0,
    participants: num(row.participants, 0) ?? 0,
    goalCount: num(row.goal_count, 0) ?? 0,
  }));
}

export type RegionPerformance = {
  region: string;
  execution: number | null;
  municipalities: number;
  participating: number;
  pending: number;
  approved: number;
};

export async function getRegionPerformance(period = "2025", axis?: string): Promise<RegionPerformance[]> {
  const rows = await query<Record<string, unknown>>(sql`
    WITH filtered AS (
      SELECT r.* FROM results r
      WHERE r.period = ${period} ${axis ? sql`AND ${axisExists(axis)}` : sql``}
    )
    SELECT m.region,
      AVG(LEAST(1.0, ${filteredRatio})) FILTER (WHERE f.status = 'aprovado') * 100 AS execution,
      COUNT(DISTINCT m.id) AS municipalities,
      COUNT(DISTINCT CASE WHEN f.status = 'aprovado' THEN m.id END) AS participating,
      COUNT(*) FILTER (WHERE f.status = 'enviado') AS pending,
      COUNT(*) FILTER (WHERE f.status = 'aprovado') AS approved
    FROM municipalities m
    LEFT JOIN filtered f ON f.municipality_id = m.id
    LEFT JOIN indicators i ON i.id = f.indicator_id
    GROUP BY m.region
    ORDER BY m.region
  `);
  return rows.map((row) => ({
    region: String(row.region),
    execution: num(row.execution),
    municipalities: num(row.municipalities, 0) ?? 0,
    participating: num(row.participating, 0) ?? 0,
    pending: num(row.pending, 0) ?? 0,
    approved: num(row.approved, 0) ?? 0,
  }));
}

// ------------------------------------------------------------- municipalities --
export type MunicipalityPerformance = {
  id: number;
  name: string;
  region: string;
  lat: number;
  lng: number;
  approved: number;
  pending: number;
  corrections: number;
  reported: number;
  indicatorsApproved: number;
  execution: number | null;
};

export type MunicipalityQuery = {
  period?: string;
  region?: string;
  axis?: string;
  search?: string;
  situation?: string;
  limit?: number;
};

export async function getMunicipalityPerformance(options: MunicipalityQuery = {}): Promise<MunicipalityPerformance[]> {
  const { period = "2025", region, axis, search, situation, limit } = options;
  const rows = await query<Record<string, unknown>>(sql`
    WITH filtered AS (
      SELECT r.* FROM results r
      WHERE r.period = ${period} ${axis ? sql`AND ${axisExists(axis)}` : sql``}
    )
    SELECT m.id, m.name, m.region, m.lat, m.lng,
      COUNT(*) FILTER (WHERE f.status = 'aprovado') AS approved,
      COUNT(*) FILTER (WHERE f.status = 'enviado') AS pending,
      COUNT(*) FILTER (WHERE f.status = 'corrigir') AS corrections,
      COUNT(*) FILTER (WHERE f.status IS NOT NULL) AS reported,
      COUNT(DISTINCT f.indicator_id) FILTER (WHERE f.status = 'aprovado') AS indicators_approved,
      AVG(LEAST(1.0, ${filteredRatio})) FILTER (WHERE f.status = 'aprovado') * 100 AS execution
    FROM municipalities m
    LEFT JOIN filtered f ON f.municipality_id = m.id
    LEFT JOIN indicators i ON i.id = f.indicator_id
    WHERE (${region ?? null}::text IS NULL OR m.region = ${region ?? null})
      AND (${search ?? null}::text IS NULL OR m.name ILIKE '%' || ${search ?? null} || '%')
    GROUP BY m.id, m.name, m.region, m.lat, m.lng
    ORDER BY execution DESC NULLS LAST, m.name ASC
  `);
  let mapped = rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    region: String(row.region),
    lat: Number(row.lat),
    lng: Number(row.lng),
    approved: num(row.approved, 0) ?? 0,
    pending: num(row.pending, 0) ?? 0,
    corrections: num(row.corrections, 0) ?? 0,
    reported: num(row.reported, 0) ?? 0,
    indicatorsApproved: num(row.indicators_approved, 0) ?? 0,
    execution: num(row.execution),
  }));
  if (situation) {
    const threshold = situation;
    mapped = mapped.filter((row) => {
      const value = row.execution;
      if (threshold === "sem_dados") return value === null;
      if (value === null) return false;
      if (threshold === "atingida") return value >= 85;
      if (threshold === "execucao") return value >= 60 && value < 85;
      if (threshold === "atencao") return value >= 35 && value < 60;
      if (threshold === "critico") return value < 35;
      return true;
    });
  }
  return limit ? mapped.slice(0, limit) : mapped;
}

export async function getMunicipalityById(id: number) {
  const rows = await query<{
    id: number;
    name: string;
    region: string;
    ibge_code: string;
    lat: number;
    lng: number;
  }>(sql`SELECT id, name, region, ibge_code, lat, lng FROM municipalities WHERE id = ${id} LIMIT 1`);
  return rows[0] ?? null;
}

export type MunicipalityIndicator = {
  indicatorId: number;
  code: string;
  indicator: string;
  unit: string;
  target: number;
  polarity: string;
  axis: string;
  axisColor: string;
  goal: string;
  action: string;
  frequency: string;
  value2025: number | null;
  value2024: number | null;
  status2025: string | null;
  status2024: string | null;
  reviewNote: string;
  execution: number | null;
};

export async function getMunicipalityIndicators(id: number): Promise<MunicipalityIndicator[]> {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT i.id AS indicator_id, i.code, i.name AS indicator, i.unit, i.target_value, i.polarity, i.frequency,
      a.name AS axis, a.color AS axis_color, g.title AS goal, ac.name AS action,
      MAX(r.value) FILTER (WHERE r.period = '2025') AS value_2025,
      MAX(r.value) FILTER (WHERE r.period = '2024') AS value_2024,
      MAX(r.status::text) FILTER (WHERE r.period = '2025') AS status_2025,
      MAX(r.status::text) FILTER (WHERE r.period = '2024') AS status_2024,
      COALESCE(MAX(r.review_note) FILTER (WHERE r.period = '2025'), '') AS review_note
    FROM indicators i
    JOIN actions ac ON ac.id = i.action_id
    JOIN goals g ON g.id = ac.goal_id
    JOIN objectives o ON o.id = g.objective_id
    JOIN axes a ON a.id = o.axis_id
    LEFT JOIN results r ON r.indicator_id = i.id AND r.municipality_id = ${id}
    GROUP BY i.id, i.code, i.name, i.unit, i.target_value, i.polarity, i.frequency, a.name, a.color, a.position, g.id, g.title, ac.id, ac.name
    ORDER BY a.position, g.id, ac.id, i.id
  `);
  return rows.map((row) => {
    const target = num(row.target_value, 0) ?? 0;
    const value = num(row.value_2025);
    const polarity = String(row.polarity);
    const execution =
      value === null || value === 0
        ? value === 0 && polarity === "menor_melhor"
          ? 100
          : null
        : Math.min(100, Math.round((polarity === "menor_melhor" ? target / value : value / target) * 100));
    return {
      indicatorId: Number(row.indicator_id),
      code: String(row.code),
      indicator: String(row.indicator),
      unit: String(row.unit),
      target,
      polarity,
      axis: String(row.axis),
      axisColor: String(row.axis_color),
      goal: String(row.goal),
      action: String(row.action),
      frequency: String(row.frequency),
      value2025: value,
      value2024: num(row.value_2024),
      status2025: row.status_2025 ? String(row.status_2025) : null,
      status2024: row.status_2024 ? String(row.status_2024) : null,
      reviewNote: String(row.review_note ?? ""),
      execution,
    };
  });
}

export async function getMunicipalityAxisPerformance(id: number, period = "2025") {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT a.name AS axis, a.color, a.code,
      AVG(LEAST(1.0, ${ratio})) FILTER (WHERE r.status = 'aprovado') * 100 AS execution,
      COUNT(*) FILTER (WHERE r.status = 'aprovado') AS approved,
      COUNT(*) FILTER (WHERE r.status = 'enviado') AS pending
    ${baseJoins}
    WHERE r.period = ${period} AND r.municipality_id = ${id}
    GROUP BY a.id, a.name, a.color, a.code, a.position
    ORDER BY a.position
  `);
  return rows.map((row) => ({
    axis: String(row.axis),
    color: String(row.color),
    code: String(row.code),
    execution: num(row.execution),
    approved: num(row.approved, 0) ?? 0,
    pending: num(row.pending, 0) ?? 0,
  }));
}

// ------------------------------------------------------------------- trend --
export async function getTrend() {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT r.period,
      AVG(LEAST(1.0, ${ratio})) FILTER (WHERE r.status = 'aprovado') * 100 AS execution,
      COUNT(DISTINCT r.municipality_id) FILTER (WHERE r.status = 'aprovado') AS participating,
      COUNT(*) FILTER (WHERE r.status = 'aprovado') AS approved
    ${baseJoins}
    GROUP BY r.period
    ORDER BY r.period
  `);
  return rows.map((row) => ({
    period: String(row.period),
    execution: num(row.execution, 0) ?? 0,
    participating: num(row.participating, 0) ?? 0,
    approved: num(row.approved, 0) ?? 0,
  }));
}

// ------------------------------------------------------------------- goals --
export type GoalProgress = {
  goalId: number;
  code: string;
  title: string;
  target: number;
  unit: string;
  deadline: string;
  responsible: string;
  baseline: number;
  axis: string;
  axisColor: string;
  axisCode: string;
  objective: string;
  execution: number | null;
  approved: number;
  pending: number;
};

export async function getGoalProgress(period = "2025"): Promise<GoalProgress[]> {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT g.id AS goal_id, g.code, g.title, g.target_value, g.unit, g.deadline, g.responsible, g.baseline,
      a.name AS axis, a.color AS axis_color, a.code AS axis_code, o.name AS objective,
      AVG(LEAST(1.0, ${ratio})) FILTER (WHERE r.status = 'aprovado') * 100 AS execution,
      COUNT(*) FILTER (WHERE r.status = 'aprovado') AS approved,
      COUNT(*) FILTER (WHERE r.status = 'enviado') AS pending
    FROM goals g
    JOIN objectives o ON o.id = g.objective_id
    JOIN axes a ON a.id = o.axis_id
    LEFT JOIN actions ac ON ac.goal_id = g.id
    LEFT JOIN indicators i ON i.action_id = ac.id
    LEFT JOIN results r ON r.indicator_id = i.id AND r.period = ${period}
    GROUP BY g.id, g.code, g.title, g.target_value, g.unit, g.deadline, g.responsible, g.baseline, a.name, a.color, a.code, a.position, o.name, o.id
    ORDER BY a.position, o.id, g.id
  `);
  return rows.map((row) => ({
    goalId: Number(row.goal_id),
    code: String(row.code),
    title: String(row.title),
    target: num(row.target_value, 0) ?? 0,
    unit: String(row.unit),
    deadline: String(row.deadline),
    responsible: String(row.responsible),
    baseline: num(row.baseline, 0) ?? 0,
    axis: String(row.axis),
    axisColor: String(row.axis_color),
    axisCode: String(row.axis_code),
    objective: String(row.objective),
    execution: num(row.execution),
    approved: num(row.approved, 0) ?? 0,
    pending: num(row.pending, 0) ?? 0,
  }));
}

export type PlanAxis = {
  id: number;
  code: string;
  name: string;
  color: string;
  description: string;
  objectives: {
    id: number;
    code: string;
    name: string;
    goals: {
      id: number;
      code: string;
      title: string;
      description: string;
      target: number;
      unit: string;
      baseline: number;
      deadline: string;
      responsible: string;
      weight: number;
      execution: number | null;
      actions: { id: number; code: string; name: string; responsible: string; indicators: { id: number; code: string; name: string; unit: string; target: number; source: string; frequency: string }[] }[];
    }[];
  }[];
};

export async function getPlan(): Promise<PlanAxis[]> {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT a.id AS axis_id, a.code AS axis_code, a.name AS axis_name, a.color, a.description AS axis_description,
      o.id AS objective_id, o.code AS objective_code, o.name AS objective_name,
      g.id AS goal_id, g.code AS goal_code, g.title, g.description, g.target_value, g.unit, g.baseline, g.deadline, g.responsible, g.weight,
      ac.id AS action_id, ac.code AS action_code, ac.name AS action_name, ac.responsible AS action_responsible,
      i.id AS indicator_id, i.code AS indicator_code, i.name AS indicator_name, i.unit AS indicator_unit,
      i.target_value AS indicator_target, i.source, i.frequency,
      (SELECT AVG(LEAST(1.0, CASE WHEN i2.polarity = 'menor_melhor' THEN i2.target_value / NULLIF(r2.value,0) ELSE r2.value / NULLIF(i2.target_value,0) END)) * 100
        FROM results r2 JOIN indicators i2 ON i2.id = r2.indicator_id
        JOIN actions ac2 ON ac2.id = i2.action_id
        WHERE ac2.goal_id = g.id AND r2.status = 'aprovado' AND r2.period = '2025') AS execution
    FROM axes a
    JOIN objectives o ON o.axis_id = a.id
    JOIN goals g ON g.objective_id = o.id
    LEFT JOIN actions ac ON ac.goal_id = g.id
    LEFT JOIN indicators i ON i.action_id = ac.id
    ORDER BY a.position, o.id, g.id, ac.id, i.id
  `);
  const axisMap = new Map<number, PlanAxis>();
  const objectiveMap = new Map<number, PlanAxis["objectives"][number]>();
  const goalMap = new Map<number, PlanAxis["objectives"][number]["goals"][number]>();
  const actionMap = new Map<number, { id: number; code: string; name: string; responsible: string; indicators: { id: number; code: string; name: string; unit: string; target: number; source: string; frequency: string }[] }>();
  for (const row of rows) {
    const axisId = Number(row.axis_id);
    if (!axisMap.has(axisId)) {
      axisMap.set(axisId, {
        id: axisId,
        code: String(row.axis_code),
        name: String(row.axis_name),
        color: String(row.color),
        description: String(row.axis_description),
        objectives: [],
      });
    }
    const axis = axisMap.get(axisId)!;
    const objectiveId = Number(row.objective_id);
    if (!objectiveMap.has(objectiveId)) {
      const objective = {
        id: objectiveId,
        code: String(row.objective_code),
        name: String(row.objective_name),
        goals: [] as PlanAxis["objectives"][number]["goals"],
      };
      axis.objectives.push(objective);
      objectiveMap.set(objectiveId, objective);
    }
    const objective = objectiveMap.get(objectiveId)!;
    const goalId = Number(row.goal_id);
    if (!goalMap.has(goalId)) {
      const goal = {
        id: goalId,
        code: String(row.goal_code),
        title: String(row.title),
        description: String(row.description),
        target: num(row.target_value, 0) ?? 0,
        unit: String(row.unit),
        baseline: num(row.baseline, 0) ?? 0,
        deadline: String(row.deadline),
        responsible: String(row.responsible),
        weight: num(row.weight, 1) ?? 1,
        execution: num(row.execution),
        actions: [] as PlanAxis["objectives"][number]["goals"][number]["actions"],
      };
      objective.goals.push(goal);
      goalMap.set(goalId, goal);
    }
    if (row.action_id) {
      const actionId = Number(row.action_id);
      if (!actionMap.has(actionId)) {
        const action = {
          id: actionId,
          code: String(row.action_code),
          name: String(row.action_name),
          responsible: String(row.action_responsible),
          indicators: [] as { id: number; code: string; name: string; unit: string; target: number; source: string; frequency: string }[],
        };
        goalMap.get(goalId)!.actions.push(action);
        actionMap.set(actionId, action);
      }
      if (row.indicator_id) {
        actionMap.get(actionId)!.indicators.push({
          id: Number(row.indicator_id),
          code: String(row.indicator_code),
          name: String(row.indicator_name),
          unit: String(row.indicator_unit),
          target: num(row.indicator_target, 0) ?? 0,
          source: String(row.source),
          frequency: String(row.frequency),
        });
      }
    }
  }
  return [...axisMap.values()];
}

// ------------------------------------------------------------- review flow --
export type ReviewItem = {
  id: number;
  municipality: string;
  municipalityId: number;
  region: string;
  indicator: string;
  indicatorCode: string;
  axis: string;
  axisColor: string;
  goal: string;
  period: string;
  value: number;
  unit: string;
  target: number;
  status: string;
  note: string;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string;
  execution: number | null;
};

export async function getResultsQueue(options: { status?: string; municipalityId?: number; limit?: number; search?: string } = {}): Promise<ReviewItem[]> {
  const { status = "enviado", municipalityId, limit = 60, search } = options;
  const rows = await query<Record<string, unknown>>(sql`
    SELECT r.id, r.period, r.value, r.status::text AS status, r.note, r.review_note, r.submitted_at, r.reviewed_at,
      m.name AS municipality, m.id AS municipality_id, m.region,
      i.name AS indicator, i.code AS indicator_code, i.unit, i.target_value,
      a.name AS axis, a.color AS axis_color, g.title AS goal,
      su.name AS submitted_by, ru.name AS reviewed_by
    FROM results r
    JOIN municipalities m ON m.id = r.municipality_id
    JOIN indicators i ON i.id = r.indicator_id
    JOIN actions ac ON ac.id = i.action_id
    JOIN goals g ON g.id = ac.goal_id
    JOIN objectives o ON o.id = g.objective_id
    JOIN axes a ON a.id = o.axis_id
    LEFT JOIN users su ON su.id = r.submitted_by_id
    LEFT JOIN users ru ON ru.id = r.reviewed_by_id
    WHERE r.status = ${status}::result_status
      ${municipalityId ? sql`AND r.municipality_id = ${municipalityId}` : sql``}
      ${search ? sql`AND (m.name ILIKE '%' || ${search} || '%' OR i.name ILIKE '%' || ${search} || '%')` : sql``}
    ORDER BY r.submitted_at DESC NULLS LAST, r.id DESC
    LIMIT ${limit}
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    municipality: String(row.municipality),
    municipalityId: Number(row.municipality_id),
    region: String(row.region),
    indicator: String(row.indicator),
    indicatorCode: String(row.indicator_code),
    axis: String(row.axis),
    axisColor: String(row.axis_color),
    goal: String(row.goal),
    period: String(row.period),
    value: num(row.value, 0) ?? 0,
    unit: String(row.unit),
    target: num(row.target_value, 0) ?? 0,
    status: String(row.status),
    note: String(row.note),
    submittedBy: row.submitted_by ? String(row.submitted_by) : null,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewNote: String(row.review_note),
    execution: null,
  }));
}

export async function getQueueCounts() {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT status::text AS status, COUNT(*) AS total FROM results GROUP BY status
  `);
  const counts: Record<string, number> = { enviado: 0, aprovado: 0, corrigir: 0, rascunho: 0 };
  for (const row of rows) counts[String(row.status)] = num(row.total, 0) ?? 0;
  return counts;
}

// -------------------------------------------------------------- policy net --
export async function getPolicyNetwork() {
  const plans = await query<Record<string, unknown>>(sql`
    SELECT p.id, p.name, p.sphere, p.description, p.color,
      COUNT(l.id) AS links
    FROM policy_plans p
    LEFT JOIN policy_links l ON l.policy_plan_id = p.id
    GROUP BY p.id ORDER BY links DESC, p.name
  `);
  const links = await query<Record<string, unknown>>(sql`
    SELECT l.id, l.rationale, l.strength, p.name AS plan, p.color AS plan_color,
      g.code, g.title, a.name AS axis, a.color AS axis_color, a.code AS axis_code
    FROM policy_links l
    JOIN policy_plans p ON p.id = l.policy_plan_id
    JOIN goals g ON g.id = l.goal_id
    JOIN objectives o ON o.id = g.objective_id
    JOIN axes a ON a.id = o.axis_id
    ORDER BY a.position, p.name
  `);
  return {
    plans: plans.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      sphere: String(row.sphere),
      description: String(row.description),
      color: String(row.color),
      links: num(row.links, 0) ?? 0,
    })),
    links: links.map((row) => ({
      id: Number(row.id),
      rationale: String(row.rationale),
      strength: num(row.strength, 2) ?? 2,
      plan: String(row.plan),
      planColor: String(row.plan_color),
      code: String(row.code),
      title: String(row.title),
      axis: String(row.axis),
      axisCode: String(row.axis_code),
      axisColor: String(row.axis_color),
    })),
  };
}

// ------------------------------------------------------------------- audit --
export async function getAuditLogs(limit = 40) {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT id, user_name, role, action, entity, entity_id, detail, created_at
    FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ${limit}
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    userName: String(row.user_name),
    role: String(row.role),
    action: String(row.action),
    entity: String(row.entity),
    entityId: String(row.entity_id),
    detail: String(row.detail),
    createdAt: String(row.created_at),
  }));
}

// -------------------------------------------------------------- municipal ---
export async function getMunicipalContext(municipalityId: number, period = "2025") {
  const performance = await getMunicipalityPerformance({ period });
  const position = performance.findIndex((row) => row.id === municipalityId);
  const mine = position >= 0 ? performance[position] : null;
  const [rankRow] = await query<Record<string, unknown>>(sql`
    SELECT COUNT(*) AS total FROM municipalities
  `);
  return {
    performance: mine,
    rank: position >= 0 && mine?.execution !== null ? position + 1 : null,
    totalWithData: performance.filter((row) => row.execution !== null).length,
    regionRank:
      mine?.execution !== null && mine
        ? performance.filter((row) => row.region === mine.region && (row.execution ?? -1) > (mine.execution ?? -1)).length + 1
        : null,
    total: num(rankRow?.total, 0) ?? 0,
  };
}

export async function getTeam(municipalityId: number) {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT id, name, email, role::text AS role, active, last_login_at, created_at
    FROM users WHERE municipality_id = ${municipalityId} ORDER BY id
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role),
    active: Boolean(row.active),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
    createdAt: String(row.created_at),
  }));
}

// ------------------------------------------------------------------ export --
export type ExportRow = {
  municipality: string;
  region: string;
  axis: string;
  goal: string;
  indicator: string;
  unit: string;
  target: number;
  value: number | null;
  execution: number | null;
  status: string;
  period: string;
  updatedAt: string | null;
};

export async function getExportRows(options: { region?: string; axis?: string; period?: string } = {}): Promise<ExportRow[]> {
  const { region, axis, period = "2025" } = options;
  const rows = await query<Record<string, unknown>>(sql`
    SELECT m.name AS municipality, m.region, a.name AS axis, g.title AS goal, i.name AS indicator, i.unit, i.target_value,
      r.value, r.status::text AS status, r.period, r.updated_at,
      LEAST(1.0, ${ratio}) * 100 AS execution
    FROM results r
    JOIN municipalities m ON m.id = r.municipality_id
    JOIN indicators i ON i.id = r.indicator_id
    JOIN actions ac ON ac.id = i.action_id
    JOIN goals g ON g.id = ac.goal_id
    JOIN objectives o ON o.id = g.objective_id
    JOIN axes a ON a.id = o.axis_id
    WHERE r.period = ${period}
      ${region ? sql`AND m.region = ${region}` : sql``}
      ${axis ? sql`AND a.code = ${axis}` : sql``}
    ORDER BY m.name, a.position, g.id, i.id
  `);
  return rows.map((row) => ({
    municipality: String(row.municipality),
    region: String(row.region),
    axis: String(row.axis),
    goal: String(row.goal),
    indicator: String(row.indicator),
    unit: String(row.unit),
    target: num(row.target_value, 0) ?? 0,
    value: num(row.value),
    execution: num(row.execution),
    status: String(row.status),
    period: String(row.period),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }));
}

export async function getAxisOptions() {
  const rows = await query<{ code: string; name: string; color: string }>(sql`
    SELECT code, name, color FROM axes ORDER BY position
  `);
  return rows;
}

export async function getIndicatorCatalog() {
  const rows = await query<Record<string, unknown>>(sql`
    SELECT i.id, i.name, i.unit, i.target_value, i.polarity, i.frequency, i.source,
      a.name AS axis, a.code AS axis_code, a.color, g.title AS goal, ac.name AS action
    FROM indicators i
    JOIN actions ac ON ac.id = i.action_id
    JOIN goals g ON g.id = ac.goal_id
    JOIN objectives o ON o.id = g.objective_id
    JOIN axes a ON a.id = o.axis_id
    ORDER BY a.position, g.id, i.id
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    unit: String(row.unit),
    target: num(row.target_value, 0) ?? 0,
    polarity: String(row.polarity),
    frequency: String(row.frequency),
    source: String(row.source),
    axis: String(row.axis),
    axisCode: String(row.axis_code),
    color: String(row.color),
    goal: String(row.goal),
    action: String(row.action),
  }));
}
