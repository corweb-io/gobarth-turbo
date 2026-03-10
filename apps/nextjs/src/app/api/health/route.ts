import { db } from "@my-app/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Verify DB is reachable
    await db.execute(sql`SELECT 1`);
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: "error", message: "Database unreachable" },
      { status: 503 },
    );
  }
}
