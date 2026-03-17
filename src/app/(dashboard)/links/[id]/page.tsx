"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Link as LinkType, LinkStats } from "@/types";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const PLATFORM_LABELS: Record<string, string> = {
  wechat: "微信", qq: "QQ", weibo: "微博", alipay: "支付宝",
  douyin: "抖音", browser: "浏览器", other: "其他",
};
const DEVICE_LABELS: Record<string, string> = { mobile: "手机", desktop: "电脑", tablet: "平板" };

export default function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [link, setLink] = useState<LinkType | null>(null);
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetch(`/api/admin/links/${id}`).then((r) => r.json()).then((res) => {
      if (res.success) setLink(res.data);
    });
  }, [id]);

  useEffect(() => {
    fetch(`/api/admin/stats/${id}?days=${days}`).then((r) => r.json()).then((res) => {
      if (res.success) setStats(res.data);
    });
  }, [id, days]);

  if (!link) return <div className="text-muted-foreground">加载中...</div>;

  const statusLabels: Record<string, string> = { active: "活跃", paused: "暂停", expired: "过期" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/links" className="p-1.5 hover:bg-muted rounded-md">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold">短链详情</h2>
      </div>

      {/* Basic Info */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">短码</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-primary font-medium">{link.short_code}</span>
              <button onClick={() => { navigator.clipboard.writeText(link.short_code); toast.success("已复制"); }} className="p-1 hover:bg-muted rounded">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">状态</span>
            <p className="mt-1 font-medium">{statusLabels[link.status] || link.status}</p>
          </div>
          <div>
            <span className="text-muted-foreground">分组</span>
            <p className="mt-1">{link.group_name || "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">创建时间</span>
            <p className="mt-1">{link.created_at?.replace("T", " ").slice(0, 16)}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <span className="text-muted-foreground">目标URL</span>
            <p className="mt-1 break-all">{link.target_url}</p>
          </div>
          {link.title && (
            <div className="col-span-2">
              <span className="text-muted-foreground">标题</span>
              <p className="mt-1">{link.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold">访问统计</h3>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="text-sm border border-border rounded-md px-3 py-1.5">
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
          <option value={90}>近 90 天</option>
        </select>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">PV</p>
              <p className="text-3xl font-bold text-primary">{stats.overview.pv}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">UV</p>
              <p className="text-3xl font-bold text-green-600">{stats.overview.uv}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <h4 className="font-medium mb-4 text-sm">访问趋势</h4>
              <div className="h-48">
                {stats.daily.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pv" stroke="#2563eb" name="PV" strokeWidth={2} />
                      <Line type="monotone" dataKey="uv" stroke="#10b981" name="UV" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>}
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <h4 className="font-medium mb-4 text-sm">来源平台</h4>
              <div className="h-48">
                {stats.platforms.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.platforms.map((p) => ({ ...p, name: PLATFORM_LABELS[p.platform] || p.platform }))}
                        dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {stats.platforms.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>}
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 lg:col-span-2">
              <h4 className="font-medium mb-4 text-sm">设备分布</h4>
              <div className="h-40">
                {stats.devices.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.devices.map((d) => ({ ...d, name: DEVICE_LABELS[d.device_type] || d.device_type }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" name="次数" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
