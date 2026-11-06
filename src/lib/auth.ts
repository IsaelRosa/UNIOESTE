import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { municipalities, users } from "@/db/schema";
import { ROLE_LABELS, STATE_ROLES, isStateRole, type Role } from "@/lib/roles";

const COOKIE_NAME = "sisprom_session";
const SECRET = process.env.SESSION_SECRET ?? "cronos-sisprom-prototype-session-secret";
const MAX_AGE = 60 * 60 * 12;

export { ROLE_LABELS, STATE_ROLES, isStateRole };
export type { Role };

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  municipalityId: number | null;
  municipalityName: string | null;
  municipalityRegion: string | null;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

function encodeSession(userId: number): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): number | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId: number; exp: number };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.userId;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = decodeSession(token);
  if (!userId) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      municipalityId: users.municipalityId,
      municipalityName: municipalities.name,
      municipalityRegion: municipalities.region,
    })
    .from(users)
    .leftJoin(municipalities, eq(users.municipalityId, municipalities.id))
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row || !row.active) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    municipalityId: row.municipalityId,
    municipalityName: row.municipalityName,
    municipalityRegion: row.municipalityRegion,
  };
}

export async function authenticate(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "Credenciais inválidas. Verifique o e-mail e a senha." };
  }
  if (!user.active) return { ok: false, error: "Usuário inativo. Procure a gestão estadual." };
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  return { ok: true };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(isStateRole(user.role) ? "/painel?negado=1" : "/municipal?negado=1");
  }
  return user;
}

export async function requireState(): Promise<SessionUser> {
  return requireUser(STATE_ROLES);
}

export async function requireMunicipal(): Promise<SessionUser> {
  const user = await requireUser(["municipal_gestor", "municipal_tecnico"]);
  if (!user.municipalityId) redirect("/painel?negado=1");
  return user;
}
