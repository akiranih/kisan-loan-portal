
import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import pool from "@/lib/db";

export type UserRole = "FARMER" | "BANK" | "GOVERNMENT";

export type AuthUser = {
  userId: string;
  role: UserRole;
  loginIdentifier: string;
};

const COOKIE_NAME = "kisan_session";
const SESSION_SECONDS = 60 * 60 * 8;

function getSecret(): Uint8Array {
  const value = process.env.SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters."
    );
  }

  return new TextEncoder().encode(value);
}

export async function createSession(user: AuthUser) {
  const token = await new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    const userId = verified.payload.sub;

    if (!userId) return null;

    const result = await pool.query<{
      user_id: string;
      role: UserRole;
      login_identifier: string;
    }>(
      `
      SELECT user_id, role, login_identifier
      FROM user_accounts
      WHERE user_id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [userId]
    );

    if (result.rowCount === 0) return null;

    const user = result.rows[0];

    if (user.role !== verified.payload.role) {
      return null;
    }

    return {
      userId: user.user_id,
      role: user.role,
      loginIdentifier: user.login_identifier,
    };
  } catch {
    return null;
  }
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthUser | null> {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}
