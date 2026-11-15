
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession, type UserRole } from "@/lib/auth";

type LoginInput = {
  identifier?: string;
  password?: string;
  role?: UserRole;
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  let body: LoginInput;

  try {
    body = (await request.json()) as LoginInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const identifier = String(body.identifier || "").trim();
  const password = String(body.password || "");
  const role = body.role;

  if (
    !identifier ||
    !password ||
    !["FARMER", "BANK", "GOVERNMENT"].includes(
      String(role)
    )
  ) {
    return NextResponse.json(
      { error: "Enter valid login credentials." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query<{
      user_id: string;
      role: UserRole;
      login_identifier: string;
      password_hash: string | null;
    }>(
      `
      SELECT
        user_id,
        role,
        login_identifier,
        password_hash
      FROM user_accounts
      WHERE login_identifier = $1
        AND role = $2
        AND is_active = TRUE
      LIMIT 1
      `,
      [identifier, role]
    );

    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.user_id,
      role: user.role,
      loginIdentifier: user.login_identifier,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        userId: user.user_id,
        role: user.role,
        loginIdentifier: user.login_identifier,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Login could not be completed." },
      { status: 500 }
    );
  }
}
