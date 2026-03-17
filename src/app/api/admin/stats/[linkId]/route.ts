import { NextResponse } from "next/server";
import { getLinkStats } from "@/services/stats.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 7;

    const stats = getLinkStats(Number(linkId), days);
    return NextResponse.json({ success: true, data: stats });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
