// ===== Database Models =====

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  link_count?: number;
}

export interface Link {
  id: number;
  short_code: string;
  target_url: string;
  title: string | null;
  group_id: number | null;
  status: "active" | "paused" | "expired";
  expire_at: string | null;
  pv_count: number;
  uv_count: number;
  created_at: string;
  updated_at: string;
  group_name?: string;
}

export interface AccessLog {
  id: number;
  link_id: number;
  short_code: string;
  ip: string | null;
  user_agent: string | null;
  referer: string | null;
  platform: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// ===== API Types =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LinkCreateInput {
  target_url: string;
  title?: string;
  short_code?: string;
  group_id?: number;
  status?: string;
  expire_at?: string;
}

export interface LinkUpdateInput extends Partial<LinkCreateInput> {}

export interface StatsOverview {
  todayPv: number;
  todayUv: number;
  totalLinks: number;
  activeLinks: number;
  totalPv: number;
  totalUv: number;
}

export interface DailyStats {
  day: string;
  pv: number;
  uv: number;
}

export interface PlatformStats {
  platform: string;
  count: number;
}

export interface DeviceStats {
  device_type: string;
  count: number;
}

export interface LinkStats {
  overview: {
    pv: number;
    uv: number;
  };
  daily: DailyStats[];
  platforms: PlatformStats[];
  devices: DeviceStats[];
}

// ===== External API =====

export interface ResolveRequest {
  shortCode: string;
}

export interface ResolveResponse {
  targetUrl: string;
  shortCode: string;
  status: string;
}

export interface LogReportRequest {
  shortCode: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  actionTaken?: string;
  timestamp?: number;
}
