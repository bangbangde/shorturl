import { run, queryOne } from "@/lib/db";
import { detectUA } from "@/lib/ua-detector";

interface LogInput {
  linkId: number;
  shortCode: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  actionTaken?: string;
}

export function recordAccessLog(input: LogInput): void {
  const ua = input.userAgent || "";
  const detected = detectUA(ua);

  run(
    `INSERT INTO access_logs (link_id, short_code, ip, user_agent, referer, platform, device_type, os, browser, action_taken)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.linkId,
      input.shortCode,
      input.ip || null,
      input.userAgent || null,
      input.referer || null,
      detected.platform,
      detected.deviceType,
      detected.os,
      detected.browser,
      input.actionTaken || "redirect",
    ]
  );

  // Increment PV count
  run("UPDATE links SET pv_count = pv_count + 1 WHERE id = ?", [input.linkId]);

  // Check if this is a unique visitor today (for UV)
  if (input.ip) {
    const today = new Date().toISOString().split("T")[0];
    const existing = queryOne(
      `SELECT id FROM access_logs WHERE link_id = ? AND ip = ? AND date(created_at) = ? AND id != last_insert_rowid()`,
      [input.linkId, input.ip, today]
    );
    if (!existing) {
      run("UPDATE links SET uv_count = uv_count + 1 WHERE id = ?", [input.linkId]);
    }
  }
}
