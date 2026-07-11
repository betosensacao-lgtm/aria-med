import postgres from "postgres";

async function main() {
  const sql = postgres("postgresql://postgres:NfU4r8lKo5mkhYY5@db.fcibkmuqhspnkvelpkke.supabase.co:5432/postgres");
  
  const r = await sql.unsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users'");
  console.log("admin_users exists:", r.length > 0);
  
  await sql.end();
}

main().catch(console.error);
