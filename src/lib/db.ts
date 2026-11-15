
import "server-only";
import { Pool } from "pg";

declare global {
  var kisanDbPool: Pool | undefined;
}

function createPool(): Pool {
  const password = process.env.DB_PASSWORD;

  if (!password) {
    throw new Error(
      "DB_PASSWORD is missing from .env.local"
    );
  }

  return new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "kisan_loan_portal",
    user: process.env.DB_USER || "postgres",
    password,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}

const pool =
  globalThis.kisanDbPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.kisanDbPool = pool;
}

export default pool;
