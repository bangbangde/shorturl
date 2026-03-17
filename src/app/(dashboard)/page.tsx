"use client";

import { useEffect, useState } from "react";
import { BarChart3, Link2, MousePointerClick, Users, TrendingUp, Smartphone } from "lucide-react";
import type { StatsOverview, DailyStats, PlatformStats, DeviceStats } from "@/types";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const PLATFORM_LABELS: Record<string, string> = {
  wechat: "微信", qq: "QQ", weibo: "微博", alipay: "支付宝",
  douyin: "抖音", dingtalk: "钉钉", browser: "浏览器", other: "其他",
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: "手机", desktop: "电脑", tablet: "平板",
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [platforms, setPlatforms] = useState<PlatformStats[]>([]);
  const [devices, setDevices] = useState<DeviceStats[]>([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetch(`/api/admin/stats/overview?days=${days}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setOverview(res.data.overview);
          setDaily(res.data.daily);
          setPlatforms(res.data.platforms);
          setDevices(res.data.devices);
        }
      });
  }, [days]);

  const statCards = overview
    ? [
        { label: "今日 PV", value: overview.todayPv, icon: MousePointerClick, color: "text-blue-600" },
        { label: "今日 UV", value: overview.todayUv, icon: Users, color: "text-green-600" },
        { label: "总短链数", value: overview.totalLinks, icon: Link2, color: "text-purple-600" },
        { label: "活跃短链", value: overview.activeLinks, icon: TrendingUp, color: "text-orange-600" },
        { label: "总 PV", value: overview.totalPv, icon: BarChart3, color: "text-pink-600" },
        { label: "总 UV", value: overview.totalUv, icon: Smartphone, color: "text-cyan-600" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">数据总览</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border border-border rounded-md px-3 py-1.5"
        >
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
          <option value={90}>近 90 天</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-medium mb-4">访问趋势</h3>
          <div className="h-64">
            {daily.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pv" stroke="#2563eb" name="PV" strokeWidth={2} />
                  <Line type="monotone" dataKey="uv" stroke="#10b981" name="UV" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>
            )}
          </div>
        </div>

        {/* Platform Pie */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-medium mb-4">来源平台分布</h3>
          <div className="h-64">
            {platforms.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platforms.map((p) => ({ ...p, name: PLATFORM_LABELS[p.platform] || p.platform }))}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {platforms.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>
            )}
          </div>
        </div>

        {/* Device Bar */}
        <div className="bg-card rounded-lg border border-border p-4 lg:col-span-2">
          <h3 className="font-medium mb-4">设备类型分布</h3>
          <div className="h-48">
            {devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devices.map((d) => ({ ...d, name: DEVICE_LABELS[d.device_type] || d.device_type }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" name="访问次数" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
