import postgres from "postgres";

async function main() {
  const sql = postgres("postgresql://postgres:NfU4r8lKo5mkhYY5@db.fcibkmuqhspnkvelpkke.supabase.co:5432/postgres");
  
  // Check existing migrations
  const rows = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at`;
  console.log("Existing migrations:", JSON.stringify(rows, null, 2));
  
  // Check if admin_users table exists
  const tableCheck = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  `;
  console.log("admin_users exists:", tableCheck.length > 0);
  
  await sql.end();
}

main().catch(console.error);
