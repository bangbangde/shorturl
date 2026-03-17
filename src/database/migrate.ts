import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

interface MigrationFile {
  version: number;
  name: string;
  sql: string;
}

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "database", "migrations");

/**
 * Run all pending database migrations.
 * Automatically detects existing (pre-migration) databases and marks
 * already-applied migrations to avoid re-execution.
 */
export function runMigrations(db: Database.Database): void {
  // 1. Ensure migration tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 2. Transition detection for pre-migration databases
  detectExistingDatabase(db);

  // 3. Load migration files
  const migrations = loadMigrationFiles();
  if (migrations.length === 0) return;

  // 4. Get current version
  const row = db.prepare("SELECT MAX(version) as v FROM _migrations").get() as { v: number | null } | undefined;
  const currentVersion = row?.v ?? 0;

  // 5. Filter pending migrations
  const pending = migrations.filter((m) => m.version > currentVersion);
  if (pending.length === 0) return;

  // 6. Execute each pending migration in its own transaction
  const insertMigration = db.prepare(
    "INSERT INTO _migrations (version, name) VALUES (?, ?)"
  );

  for (const migration of pending) {
    const runOne = db.transaction(() => {
      db.exec(migration.sql);
      insertMigration.run(migration.version, migration.name);
    });

    try {
      runOne();
      console.log(`[migrate] Applied: ${migration.name}`);
    } catch (err) {
      console.error(`[migrate] Failed: ${migration.name}`, err);
      throw err;
    }
  }
}

/**
 * Detect pre-migration databases and mark already-applied migrations.
 * Only runs once: when _migrations table is empty.
 */
function detectExistingDatabase(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as c FROM _migrations").get() as { c: number };
  if (count.c > 0) return; // Already has migration records, skip detection

  // Check if this is an existing database (users table exists)
  const usersTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
  ).get();

  if (!usersTable) return; // Brand new database, let all migrations run

  // Existing database detected — determine which migrations are already applied
  const insertMigration = db.prepare(
    "INSERT INTO _migrations (version, name) VALUES (?, ?)"
  );

  // 001_initial.sql: tables already exist
  insertMigration.run(1, "001_initial.sql");
  console.log("[migrate] Detected existing database, marked 001_initial.sql as applied");

  // Check if antiban columns still exist (to determine if 002 is needed)
  const columns = db.prepare("PRAGMA table_info(links)").all() as { name: string }[];
  const hasAntiban = columns.some((col) => col.name === "enable_intermediate");

  if (!hasAntiban) {
    // Antiban columns already removed
    insertMigration.run(2, "002_remove_antiban.sql");
    console.log("[migrate] Antiban columns already removed, marked 002_remove_antiban.sql as applied");
  }
}

/**
 * Load and sort SQL migration files from the migrations directory.
 */
function loadMigrationFiles(): MigrationFile[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn(`[migrate] Migrations directory not found: ${MIGRATIONS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  return files.map((name) => {
    const version = parseInt(name.substring(0, 3), 10);
    if (isNaN(version)) {
      throw new Error(`[migrate] Invalid migration filename: ${name} (must start with 3-digit version)`);
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf-8");
    return { version, name, sql };
  });
}
