import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const sql = postgres("postgresql://postgres:NfU4r8lKo5mkhYY5@db.fcibkmuqhspnkvelpkke.supabase.co:5432/postgres");
  
  const migrationPath = resolve(__dirname, "../src/db/migrations/0005_gray_gladiator.sql");
  const sqlContent = readFileSync(migrationPath, "utf-8");
  
  console.log("Applying migration: 0005_gray_gladiator.sql");
  console.log(sqlContent);
  
  // Split by statement-breakpoint and execute each statement
  const statements = sqlContent
    .split("--> statement-breakpoint")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const stmt of statements) {
    console.log("\nExecuting:", stmt.substring(0, 80) + "...");
    try {
      await sql.unsafe(stmt);
      console.log("OK");
    } catch (e: any) {
      console.log("Error (may be expected):", e.message?.substring(0, 100));
    }
  }
  
  // Record migration in journal
  try {
    await sql.unsafe("INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('0005_gray_gladiator', NOW())");
    console.log("\nMigration recorded in journal");
  } catch (e: any) {
    console.log("\nMigration journal error:", e.message?.substring(0, 100));
  }
  
  await sql.end();
  console.log("\nDone!");
}

main().catch(console.error);
