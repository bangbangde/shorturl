import { corsOptionsResponse, corsJsonResponse } from "@/lib/cors";
import { verifyHmacSignature } from "@/lib/hmac";
import { getLinkByCode } from "@/services/link.service";
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

    // Get HMAC secret from settings
    const secretSetting = queryOne<Setting>("SELECT value FROM settings WHERE key = 'hmac_secret'");
    if (!secretSetting) {
      return corsJsonResponse({ success: false, error: "Server not configured" }, 500);
    }

    if (!verifyHmacSignature(origin, timestamp, bodyText, signature, secretSetting.value)) {
      return corsJsonResponse({ success: false, error: "Invalid signature" }, 401);
    }

    const body = JSON.parse(bodyText);
    const { shortCode } = body;
    if (!shortCode) {
      return corsJsonResponse({ success: false, error: "shortCode is required" }, 400);
    }

    const link = getLinkByCode(shortCode);
    if (!link) {
      return corsJsonResponse({ success: false, error: "Short link not found" }, 404);
    }

    if (link.status !== "active") {
      return corsJsonResponse({ success: false, error: "Short link is not active" }, 410);
    }

    // Check expiration
    if (link.expire_at && new Date(link.expire_at) < new Date()) {
      return corsJsonResponse({ success: false, error: "Short link has expired" }, 410);
    }

    return corsJsonResponse({
      success: true,
      data: {
        targetUrl: link.target_url,
        shortCode: link.short_code,
        status: link.status,
      },
    });
  } catch (e) {
    return corsJsonResponse({ success: false, error: String(e) }, 500);
  }
}
