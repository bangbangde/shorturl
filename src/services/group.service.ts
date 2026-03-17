import { query, queryOne, run } from "@/lib/db";
import type { Group } from "@/types";

export function listGroups(): Group[] {
  return query<Group>(
    `SELECT g.*, COUNT(l.id) as link_count
     FROM groups g LEFT JOIN links l ON l.group_id = g.id
     GROUP BY g.id ORDER BY g.created_at DESC`
  );
}

export function getGroupById(id: number): Group | undefined {
  return queryOne<Group>(
    `SELECT g.*, COUNT(l.id) as link_count
     FROM groups g LEFT JOIN links l ON l.group_id = g.id
     WHERE g.id = ? GROUP BY g.id`,
    [id]
  );
}

export function createGroup(name: string, description?: string): Group {
  const result = run(
    "INSERT INTO groups (name, description) VALUES (?, ?)",
    [name, description || null]
  );
  return getGroupById(Number(result.lastInsertRowid))!;
}

export function updateGroup(id: number, name: string, description?: string): Group | undefined {
  run(
    "UPDATE groups SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
    [name, description || null, id]
  );
  return getGroupById(id);
}

export function deleteGroup(id: number): boolean {
  const result = run("DELETE FROM groups WHERE id = ?", [id]);
  return result.changes > 0;
}
