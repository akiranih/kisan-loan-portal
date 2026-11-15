
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/auth";

type RegistrationInput = {
  name?: string;
  mobile?: string;
  password?: string;
  dob?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

function validDateOfBirth(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(value + "T00:00:00Z");

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (date.toISOString().slice(0, 10) !== value) {
    return false;
  }

  const today = new Date();
  const cutoff = new Date(
    Date.UTC(
      today.getUTCFullYear() - 18,
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );

  return date <= cutoff;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  let body: RegistrationInput;

  try {
    body = (await request.json()) as RegistrationInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = String(body.name || "").trim();
  const mobile = String(body.mobile || "").trim();
  const password = String(body.password || "");
  const dob = String(body.dob || "");
  const village = String(body.village || "").trim();
  const district = String(body.district || "").trim();
  const state = String(body.state || "").trim();
  const pincode = String(body.pincode || "").trim();

  if (name.length < 2 || name.length > 150) {
    return NextResponse.json(
      { error: "Enter a valid full name." },
      { status: 400 }
    );
  }

  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  }

  if (password.length < 12 || password.length > 72) {
    return NextResponse.json(
      { error: "Password must contain 12–72 characters." },
      { status: 400 }
    );
  }

  if (!validDateOfBirth(dob)) {
    return NextResponse.json(
      { error: "Applicant must be at least 18 years old." },
      { status: 400 }
    );
  }

  if (
    village.length > 150 ||
    district.length > 100 ||
    state.length > 100 ||
    (pincode && !/^\d{6}$/.test(pincode))
  ) {
    return NextResponse.json(
      { error: "Invalid location information." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await client.query("BEGIN");

    const userResult = await client.query<{
      user_id: string;
    }>(
      `
      INSERT INTO user_accounts
        (role, login_identifier, password_hash)
      VALUES
        ('FARMER', $1, $2)
      RETURNING user_id
      `,
      [mobile, passwordHash]
    );

    const userId = userResult.rows[0].user_id;

    await client.query(
      `
      INSERT INTO farmers (
        user_id,
        full_name,
        mobile,
        date_of_birth,
        village_text,
        district_text,
        state_text,
        pincode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        userId,
        name,
        mobile,
        dob,
        village || null,
        district || null,
        state || null,
        pincode || null,
      ]
    );

    await client.query("COMMIT");

    await createSession({
      userId,
      role: "FARMER",
      loginIdentifier: mobile,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Farmer account created successfully.",
        user: {
          userId,
          role: "FARMER",
          loginIdentifier: mobile,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists." },
        { status: 409 }
      );
    }

    console.error("Registration failed:", error);

    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
