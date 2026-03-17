import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "shorturl.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isNew = !fs.existsSync(DB_PATH);
  db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  if (isNew) {
    initializeDatabase(db);
  } else {
    // Ensure tables exist even if DB file exists but is empty
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get();
    if (!tableCheck) {
      initializeDatabase(db);
    }
  }

  return db;
}

function initializeDatabase(database: Database.Database) {
  const schemaPath = path.join(process.cwd(), "src", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  database.exec(schema);

  // Seed default admin user (password: admin123)
  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("admin123", 10);
  database.prepare(
    "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)"
  ).run("admin", hash);

  // Seed default settings
  const defaultSettings = [
    ["hmac_secret", generateRandomSecret()],
    ["short_code_length", "6"],
    ["default_ua_rules", JSON.stringify([
      { name: "微信", pattern: "MicroMessenger", action: "show_tip", tipContent: "请点击右上角，选择在浏览器中打开" },
      { name: "QQ", pattern: "QQ/", action: "show_tip", tipContent: "请点击右上角，选择在浏览器中打开" },
    ])],
    ["default_intermediate_enabled", "0"],
    ["default_intermediate_html", "<html><body><h2>请在浏览器中打开此链接</h2></body></html>"],
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
