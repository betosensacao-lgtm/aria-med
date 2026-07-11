import postgres from "postgres";

async function main() {
  const sql = postgres("postgresql://postgres:NfU4r8lKo5mkhYY5@db.fcibkmuqhspnkvelpkke.supabase.co:5432/postgres");
  
  // Check migration journal structure
  const cols = await sql.unsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'");
  console.log("Journal columns:", JSON.stringify(cols, null, 2));
  
  // Insert with bigint timestamp (milliseconds since epoch)
  const now = Date.now();
  try {
    await sql.unsafe(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('0005_gray_gladiator', ${now})`);
    console.log("Migration recorded with timestamp:", now);
  } catch (e: any) {
    console.log("Error:", e.message?.substring(0, 200));
  }
  
  // Verify
  const rows = await sql.unsafe("SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at");
  console.log("All migrations:", JSON.stringify(rows, null, 2));
  
  await sql.end();
}

main().catch(console.error);
