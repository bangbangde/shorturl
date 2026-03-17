import { NextResponse } from "next/server";
import { listAccessLogs } from "@/services/stats.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = listAccessLogs({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 20,
      linkId: searchParams.get("linkId") ? Number(searchParams.get("linkId")) : undefined,
      platform: searchParams.get("platform") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
