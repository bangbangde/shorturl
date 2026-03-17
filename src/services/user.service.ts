import { queryOne } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import type { User } from "@/types";

export function getUserByUsername(username: string): User | undefined {
  return queryOne<User>("SELECT * FROM users WHERE username = ?", [username]);
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = getUserByUsername(username);
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  return valid ? user : null;
}

export function updatePassword(userId: number, newHash: string): void {
  const { run } = require("@/lib/db");
  run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [newHash, userId]);
}
