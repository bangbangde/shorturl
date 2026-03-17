import { NextResponse } from "next/server";
import { queryOne, run, query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { Setting } from "@/types";

export async function GET() {
  try {
    const settings = query<Setting>("SELECT * FROM settings");
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Handle password change
    if (body.new_password) {
      const userId = request.headers.get("x-user-id");
      const newHash = await hashPassword(body.new_password);
      run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [newHash, Number(userId)]);
    }

    // Handle settings update
    if (body.settings) {
      for (const [key, value] of Object.entries(body.settings)) {
        const existing = queryOne<Setting>("SELECT key FROM settings WHERE key = ?", [key]);
        if (existing) {
          run("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?", [String(value), key]);
        } else {
          run("INSERT INTO settings (key, value) VALUES (?, ?)", [key, String(value)]);
        }
      }
    }

    return NextResponse.json({ success: true, message: "设置已更新" });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
