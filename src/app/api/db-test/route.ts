
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  // Local database connection test only.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const result = await pool.query<{
      database_name: string;
      total_tables: number;
    }>(`
      SELECT
        current_database() AS database_name,
        COUNT(*)::integer AS total_tables
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    return NextResponse.json({
      success: true,
      message: "PostgreSQL connected successfully",
      database: result.rows[0].database_name,
      totalTables: result.rows[0].total_tables,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed. Check the VS Code terminal.",
      },
      { status: 500 }
    );
  }
}
