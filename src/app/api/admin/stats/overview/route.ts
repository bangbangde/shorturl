import { NextResponse } from "next/server";
import { getOverviewStats, getGlobalDailyStats, getGlobalPlatformStats, getGlobalDeviceStats } from "@/services/stats.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 7;

    const overview = getOverviewStats();
    const daily = getGlobalDailyStats(days);
    const platforms = getGlobalPlatformStats(days);
    const devices = getGlobalDeviceStats(days);

    return NextResponse.json({
      success: true,
      data: { overview, daily, platforms, devices },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
