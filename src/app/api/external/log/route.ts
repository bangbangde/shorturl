import { corsOptionsResponse, corsJsonResponse } from "@/lib/cors";
import { verifyHmacSignature } from "@/lib/hmac";
import { getLinkByCode } from "@/services/link.service";
import { recordAccessLog } from "@/services/log.service";
import { queryOne } from "@/lib/db";
import type { Setting } from "@/types";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("x-origin") || "";
    const timestamp = request.headers.get("x-timestamp") || "";
    const signature = request.headers.get("x-signature") || "";

    const bodyText = await request.text();

    const secretSetting = queryOne<Setting>("SELECT value FROM settings WHERE key = 'hmac_secret'");
    if (!secretSetting) {
      return corsJsonResponse({ success: false, error: "Server not configured" }, 500);
    }

    if (!verifyHmacSignature(origin, timestamp, bodyText, signature, secretSetting.value)) {
      return corsJsonResponse({ success: false, error: "Invalid signature" }, 401);
    }

    const body = JSON.parse(bodyText);
    const { shortCode, ip, userAgent, referer, actionTaken } = body;

    if (!shortCode) {
      return corsJsonResponse({ success: false, error: "shortCode is required" }, 400);
    }

    const link = getLinkByCode(shortCode);
    if (!link) {
      return corsJsonResponse({ success: false, error: "Short link not found" }, 404);
    }

    recordAccessLog({
      linkId: link.id,
      shortCode: link.short_code,
      ip,
      userAgent,
      referer,
      actionTaken,
    });

    return corsJsonResponse({ success: true, message: "Log recorded" });
  } catch (e) {
    return corsJsonResponse({ success: false, error: String(e) }, 500);
  }
}
