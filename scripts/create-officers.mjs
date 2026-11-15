import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
import pg from "pg";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";

loadEnvConfig(process.cwd());

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "kisan_loan_portal",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

const officers = [
  {
    role: "BANK",
    login: "bank-demo-001",
    name: "Sample Bank Officer",
    branchId: 1,
  },
  {
    role: "GOVERNMENT",
    login: "government-demo-001",
    name: "Sample Government Officer",
    stateId: 1,
    department: "Agricultural Credit Monitoring",
  },
];

async function createOfficer(officer) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT user_id
       FROM user_accounts
       WHERE login_identifier = $1`,
      [officer.login]
    );

    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");

      console.log(
        `${officer.role} account already exists: ${officer.login}`
      );

      return;
    }

    const password = randomBytes(18).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);

    const userId = randomUUID();
    const officerId = randomUUID();

    await client.query(
      `
      INSERT INTO user_accounts (
        user_id,
        role,
        login_identifier,
        password_hash,
        is_active,
        created_at
      )
      VALUES ($1, $2, $3, $4, TRUE, NOW())
      `,
      [
        userId,
        officer.role,
        officer.login,
        passwordHash,
      ]
    );

    if (officer.role === "BANK") {
      await client.query(
        `
        INSERT INTO bank_officers (
          officer_id,
          user_id,
          branch_id,
          officer_name
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          officerId,
          userId,
          officer.branchId,
          officer.name,
        ]
      );
    } else {
      await client.query(
        `
        INSERT INTO government_officers (
          officer_id,
          user_id,
          state_id,
          officer_name,
          department
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          officerId,
          userId,
          officer.stateId,
          officer.name,
          officer.department,
        ]
      );
    }

    await client.query("COMMIT");

    console.log("\nAccount created successfully");
    console.log("Role:", officer.role);
    console.log("Login:", officer.login);
    console.log("Password:", password);
    console.log("Save this password privately.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  for (const officer of officers) {
    await createOfficer(officer);
  }

  console.log("\nOfficer account setup completed.");
}

try {
  await main();
} catch (error) {
  console.error("Officer account setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
