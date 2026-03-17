import { query, queryOne, run, transaction } from "@/lib/db";
import { generateShortCode } from "@/lib/shortcode";
import type { Link, LinkCreateInput, PaginatedResponse } from "@/types";

export function getLinkById(id: number): Link | undefined {
  return queryOne<Link>(
    `SELECT l.*, g.name as group_name FROM links l LEFT JOIN groups g ON l.group_id = g.id WHERE l.id = ?`,
    [id]
  );
}

export function getLinkByCode(code: string): Link | undefined {
  return queryOne<Link>(
    `SELECT l.*, g.name as group_name FROM links l LEFT JOIN groups g ON l.group_id = g.id WHERE l.short_code = ?`,
    [code]
  );
}

interface ListLinksParams {
  page?: number;
  pageSize?: number;
  search?: string;
  groupId?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function listLinks(params: ListLinksParams = {}): PaginatedResponse<Link> {
  const {
    page = 1,
    pageSize = 20,
    search,
    groupId,
    status,
    sortBy = "created_at",
    sortOrder = "desc",
  } = params;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (search) {
    conditions.push("(l.short_code LIKE ? OR l.title LIKE ? OR l.target_url LIKE ?)");
    const like = `%${search}%`;
    values.push(like, like, like);
  }
  if (groupId) {
    conditions.push("l.group_id = ?");
    values.push(groupId);
  }
  if (status) {
    conditions.push("l.status = ?");
    values.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const allowedSort = ["created_at", "pv_count", "uv_count", "short_code", "title"];
  const sortCol = allowedSort.includes(sortBy) ? sortBy : "created_at";
  const order = sortOrder === "asc" ? "ASC" : "DESC";

  const countResult = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM links l ${where}`,
    values
  );
  const total = countResult?.count || 0;

  const offset = (page - 1) * pageSize;
  const items = query<Link>(
    `SELECT l.*, g.name as group_name FROM links l LEFT JOIN groups g ON l.group_id = g.id ${where} ORDER BY l.${sortCol} ${order} LIMIT ? OFFSET ?`,
    [...values, pageSize, offset]
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function createLink(input: LinkCreateInput): Link {
  const shortCode = input.short_code || generateUniqueCode();

  const result = run(
    `INSERT INTO links (short_code, target_url, title, group_id, status, expire_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      shortCode,
      input.target_url,
      input.title || null,
      input.group_id || null,
      input.status || "active",
      input.expire_at || null,
    ]
  );

  return getLinkById(Number(result.lastInsertRowid))!;
}

export function updateLink(id: number, input: Partial<LinkCreateInput>): Link | undefined {
  const existing = getLinkById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.target_url !== undefined) { fields.push("target_url = ?"); values.push(input.target_url); }
  if (input.title !== undefined) { fields.push("title = ?"); values.push(input.title || null); }
  if (input.group_id !== undefined) { fields.push("group_id = ?"); values.push(input.group_id || null); }
  if (input.status !== undefined) { fields.push("status = ?"); values.push(input.status); }
  if (input.expire_at !== undefined) { fields.push("expire_at = ?"); values.push(input.expire_at || null); }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  run(`UPDATE links SET ${fields.join(", ")} WHERE id = ?`, values);
  return getLinkById(id);
}

export function deleteLink(id: number): boolean {
  const result = run("DELETE FROM links WHERE id = ?", [id]);
  return result.changes > 0;
}

export function bulkCreateLinks(inputs: LinkCreateInput[]): { success: number; failed: number; errors: { row: number; reason: string }[] } {
  let success = 0;
  const errors: { row: number; reason: string }[] = [];

  transaction(() => {
    for (let i = 0; i < inputs.length; i++) {
      try {
        createLink(inputs[i]);
        success++;
      } catch (e) {
        errors.push({ row: i + 1, reason: e instanceof Error ? e.message : "Unknown error" });
      }
    }
  });

  return { success, failed: errors.length, errors };
}

function generateUniqueCode(maxRetries = 3): string {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateShortCode();
    const existing = queryOne<{ id: number }>("SELECT id FROM links WHERE short_code = ?", [code]);
    if (!existing) return code;
  }
  // Fallback: use longer code
  return generateShortCode(8);
}
