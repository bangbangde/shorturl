import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { runMigrations } from "./migrate";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "shorturl.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run pending migrations (handles both new and existing databases)
  runMigrations(db);

  // Seed initial data (idempotent via INSERT OR IGNORE)
  seedData(db);

  return db;
}

function seedData(database: Database.Database) {
  // Default admin user (password: admin123)
  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("admin123", 10);
  database.prepare(
    "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)"
  ).run("admin", hash);

  // Default settings
  const defaultSettings = [
    ["hmac_secret", generateRandomSecret()],
    ["short_code_length", "6"],
  ];

  const insertSetting = database.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  for (const [key, value] of defaultSettings) {
    insertSetting.run(key, value);
  }
}

function generateRandomSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
