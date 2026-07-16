import { config } from "dotenv";
config({ path: ".env.local" });

interface CheckResult {
  name: string;
  status: "ok" | "warning" | "error" | "critical";
  message: string;
  fix?: () => Promise<boolean>;
}

const results: CheckResult[] = [];

function ok(name: string, message: string) {
  results.push({ name, status: "ok", message });
}

function warn(name: string, message: string, fix?: () => Promise<boolean>) {
  results.push({ name, status: "warning", message, fix });
}

function error(name: string, message: string, fix?: () => Promise<boolean>) {
  results.push({ name, status: "error", message, fix });
}

function critical(name: string, message: string) {
  results.push({ name, status: "critical", message });
}

async function main() {
  console.log(`\n  MedBook Health Check — ${new Date().toISOString()}\n`);

  // ── 1. Environment variables ─────────────────────────────────────────────
  const requiredEnvVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "GROQ_API_KEY",
  ];
  const stripeEnvVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ];
  const googleEnvVars = [
    "GOOGLE_CALENDAR_CLIENT_EMAIL",
    "GOOGLE_CALENDAR_PRIVATE_KEY",
    "GOOGLE_CALENDAR_ID",
  ];

  const sentryEnvVars = [
    "SENTRY_DSN",
    "NEXT_PUBLIC_SENTRY_DSN",
  ];

  const missingRequired = requiredEnvVars.filter((v) => !process.env[v]);
  const missingStripe = stripeEnvVars.filter((v) => !process.env[v]);
  const missingGoogle = googleEnvVars.filter((v) => !process.env[v]);
  const missingSentry = sentryEnvVars.filter((v) => !process.env[v]);

  if (missingRequired.length === 0) {
    ok("Env vars (required)", "All required vars are set");
  } else {
    critical(`Env vars (required): ${missingRequired.join(", ")}`, `Missing: ${missingRequired.join(", ")}`);
  }

  if (missingStripe.length === 0) {
    ok("Env vars (Stripe)", "All Stripe vars are set");
  } else {
    warn(`Env vars (Stripe): ${missingStripe.join(", ")}`, `Missing: ${missingStripe.join(", ")}`);
  }

  if (missingGoogle.length === 0) {
    ok("Env vars (Google)", "All Google vars are set");
  } else {
    warn(`Env vars (Google): ${missingGoogle.join(", ")}`, `Missing: ${missingGoogle.join(", ")}`);
  }

  if (missingSentry.length === 0) {
    ok("Env vars (Sentry)", "All Sentry vars are set");
  } else {
    warn(`Env vars (Sentry): ${missingSentry.join(", ")}`, `Missing: ${missingSentry.join(", ")}`);
  }

  // ── 2. Database connection ───────────────────────────────────────────────
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    ok("Database", "Connection OK");
  } catch (e: any) {
    error("Database", `Connection failed: ${e.message}`);
  }

  // ── 3. DB Migrations ─────────────────────────────────────────────────────
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(
      sql`SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at`
    );
    const applied = (result as any[]).length;
    const { readdirSync } = await import("fs");
    const { resolve } = await import("path");
    const migrationFiles = readdirSync(resolve(__dirname, "../src/db/migrations"))
      .filter((f) => f.endsWith(".sql"));
    if (applied === migrationFiles.length) {
      ok("Migrations", `${applied}/${migrationFiles.length} applied`);
    } else {
      warn(
        "Migrations",
        `${applied}/${migrationFiles.length} applied — run pnpm db:migrate`,
        async () => {
          const { execSync } = await import("child_process");
          execSync("pnpm db:migrate", { stdio: "inherit", cwd: resolve(__dirname, "..") });
          return true;
        }
      );
    }
  } catch (e: any) {
    error("Migrations", `Cannot check: ${e.message}`);
  }

  // ── 4. Expected tables ───────────────────────────────────────────────────
  const expectedTables = [
    "users", "clinics", "professionals", "appointments",
    "admin_users", "pricing_plans", "chat_sessions", "chat_messages",
  ];
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const found = (result as any[]).map((r: any) => r.table_name);
    const missing = expectedTables.filter((t) => !found.includes(t));
    if (missing.length === 0) {
      ok("Tables", `${found.length} tables present`);
    } else {
      critical(`Tables: missing ${missing.join(", ")}`, `Tables not found: ${missing.join(", ")}`);
    }
  } catch (e: any) {
    error("Tables", `Cannot check: ${e.message}`);
  }

  // ── 5. Pricing plans ─────────────────────────────────────────────────────
  try {
    const { db } = await import("@/db");
    const { pricingPlans } = await import("@/db/schema");
    const { sql } = await import("drizzle-orm");
    const plans = await db.select().from(pricingPlans);
    if (plans.length >= 3) {
      const hasStripeIds = plans.every(
        (p) => p.stripeProductId && p.stripePriceIdMonthly
      );
      if (hasStripeIds) {
        ok("Pricing plans", `${plans.length} plans with Stripe IDs`);
      } else {
        warn(
          "Pricing plans",
          `${plans.length} plans found, but some missing Stripe IDs — run pnpm seed-stripe-products`,
          async () => {
            const { execSync } = await import("child_process");
            execSync("pnpm seed-stripe-products", { stdio: "inherit", cwd: resolve(__dirname, "..") });
            return true;
          }
        );
      }
    } else {
      warn(
        "Pricing plans",
        `Only ${plans.length} plans found — run pnpm seed-plans`,
        async () => {
          const { execSync } = await import("child_process");
          execSync("pnpm seed-plans", { stdio: "inherit", cwd: resolve(__dirname, "..") });
          return true;
        }
      );
    }
  } catch (e: any) {
    error("Pricing plans", `Cannot check: ${e.message}`);
  }

  // ── 6. Admin user ────────────────────────────────────────────────────────
  try {
    const { db } = await import("@/db");
    const { adminUsers } = await import("@/db/schema");
    const admins = await db.select().from(adminUsers);
    if (admins.length > 0) {
      ok("Admin users", `${admins.length} admin(s) registered`);
    } else {
      warn(
        "Admin users",
        "No admin found — run pnpm seed-admin",
        async () => {
          const { execSync } = await import("child_process");
          execSync("pnpm seed-admin", { stdio: "inherit", cwd: resolve(__dirname, "..") });
          return true;
        }
      );
    }
  } catch (e: any) {
    error("Admin users", `Cannot check: ${e.message}`);
  }

  // ── 7. Vercel deploy status ──────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medbook-amber.vercel.app";
  try {
    const resp = await fetch(`${appUrl}/api/health`);
    const data = await resp.json();
    if (data.status === "healthy") {
      ok("Deploy", `${appUrl} — healthy`);
    } else {
      warn("Deploy", `${appUrl} — degraded: ${JSON.stringify(data.checks)}`);
    }
  } catch (e: any) {
    error("Deploy", `Cannot reach ${appUrl}: ${e.message}`);
  }

  // ── 8. Stripe connectivity ───────────────────────────────────────────────
  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    const hasFunds = balance.available.some((b: any) => b.amount > 0);
    ok("Stripe", `Connected (balance: ${hasFunds ? "funded" : "empty test mode"})`);
  } catch (e: any) {
    error("Stripe", `Cannot connect: ${e.message}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n  Results:\n");
  for (const r of results) {
    const icon =
      r.status === "ok" ? "  ✓" :
      r.status === "warning" ? "  ⚠" :
      r.status === "error" ? "  ✗" :
      "  ✗✗";
    console.log(` ${icon} ${r.status.padEnd(8)} ${r.message}`);
    if (r.fix) {
      console.log(`     └ Fix available: ${r.name}`);
    }
  }

  const errors = results.filter((r) => r.status === "error" || r.status === "critical");
  const warnings = results.filter((r) => r.status === "warning");

  console.log(`\n  ${results.length} checks · ${errors.length} errors · ${warnings.length} warnings\n`);

  // Auto-fix mode: apply all available fixes
  const shouldFix = process.argv.includes("--fix");
  if (shouldFix && (errors.length > 0 || warnings.length > 0)) {
    console.log("  Auto-fix mode enabled — applying fixes...\n");
    for (const r of results) {
      if (r.fix && (r.status === "error" || r.status === "warning")) {
        process.stdout.write(`  Fixing: ${r.name}... `);
        try {
          await r.fix();
          console.log("OK");
        } catch (e: any) {
          console.log(`FAILED: ${e.message}`);
        }
      }
    }
    console.log("\n  Fixes applied. Re-run without --fix to verify.\n");
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Health check crashed:", e);
  process.exit(1);
});
