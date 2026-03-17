import { query, queryOne } from "@/lib/db";
import type { StatsOverview, DailyStats, PlatformStats, DeviceStats, LinkStats, AccessLog, PaginatedResponse } from "@/types";

export function getOverviewStats(): StatsOverview {
  const today = new Date().toISOString().split("T")[0];

  const todayPv = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM access_logs WHERE date(created_at) = ?",
    [today]
  )?.count || 0;

  const todayUv = queryOne<{ count: number }>(
    "SELECT COUNT(DISTINCT ip) as count FROM access_logs WHERE date(created_at) = ?",
    [today]
  )?.count || 0;

  const totalLinks = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM links"
  )?.count || 0;

  const activeLinks = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM links WHERE status = 'active'"
  )?.count || 0;

  const totalPv = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM access_logs"
  )?.count || 0;

  const totalUv = queryOne<{ count: number }>(
    "SELECT COUNT(DISTINCT ip) as count FROM access_logs"
  )?.count || 0;

  return { todayPv, todayUv, totalLinks, activeLinks, totalPv, totalUv };
}

export function getLinkStats(linkId: number, days: number = 7): LinkStats {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split("T")[0];

  const pv = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM access_logs WHERE link_id = ? AND date(created_at) >= ?",
    [linkId, start]
  )?.count || 0;

  const uv = queryOne<{ count: number }>(
    "SELECT COUNT(DISTINCT ip) as count FROM access_logs WHERE link_id = ? AND date(created_at) >= ?",
    [linkId, start]
  )?.count || 0;

  const daily = query<DailyStats>(
    `SELECT date(created_at) as day, COUNT(*) as pv, COUNT(DISTINCT ip) as uv
     FROM access_logs WHERE link_id = ? AND date(created_at) >= ?
     GROUP BY date(created_at) ORDER BY day`,
    [linkId, start]
  );

  const platforms = query<PlatformStats>(
    `SELECT platform, COUNT(*) as count FROM access_logs
     WHERE link_id = ? AND date(created_at) >= ?
     GROUP BY platform ORDER BY count DESC`,
    [linkId, start]
  );

  const devices = query<DeviceStats>(
    `SELECT device_type, COUNT(*) as count FROM access_logs
     WHERE link_id = ? AND date(created_at) >= ?
     GROUP BY device_type ORDER BY count DESC`,
    [linkId, start]
  );

  return {
    overview: { pv, uv },
    daily,
    platforms,
    devices,
  };
}

export function getGlobalDailyStats(days: number = 7): DailyStats[] {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split("T")[0];

  return query<DailyStats>(
    `SELECT date(created_at) as day, COUNT(*) as pv, COUNT(DISTINCT ip) as uv
     FROM access_logs WHERE date(created_at) >= ?
     GROUP BY date(created_at) ORDER BY day`,
    [start]
  );
}

export function getGlobalPlatformStats(days: number = 7): PlatformStats[] {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split("T")[0];

  return query<PlatformStats>(
    `SELECT platform, COUNT(*) as count FROM access_logs
     WHERE date(created_at) >= ?
     GROUP BY platform ORDER BY count DESC`,
    [start]
  );
}

export function getGlobalDeviceStats(days: number = 7): DeviceStats[] {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split("T")[0];

  return query<DeviceStats>(
    `SELECT device_type, COUNT(*) as count FROM access_logs
     WHERE date(created_at) >= ?
     GROUP BY device_type ORDER BY count DESC`,
    [start]
  );
}

interface ListLogsParams {
  page?: number;
  pageSize?: number;
  linkId?: number;
  platform?: string;
  startDate?: string;
  endDate?: string;
}

export function listAccessLogs(params: ListLogsParams = {}): PaginatedResponse<AccessLog> {
  const { page = 1, pageSize = 20, linkId, platform, startDate, endDate } = params;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (linkId) { conditions.push("link_id = ?"); values.push(linkId); }
  if (platform) { conditions.push("platform = ?"); values.push(platform); }
  if (startDate) { conditions.push("date(created_at) >= ?"); values.push(startDate); }
  if (endDate) { conditions.push("date(created_at) <= ?"); values.push(endDate); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM access_logs ${where}`,
    values
  )?.count || 0;

  const offset = (page - 1) * pageSize;
  const items = query<AccessLog>(
    `SELECT * FROM access_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, pageSize, offset]
  );

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
