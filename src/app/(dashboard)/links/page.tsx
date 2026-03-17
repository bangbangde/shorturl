"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Upload, Search, Copy, Edit2, Trash2, Eye } from "lucide-react";
import type { Link as LinkType, PaginatedResponse, Group } from "@/types";

export default function LinksPage() {
  const [data, setData] = useState<PaginatedResponse<LinkType> | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (groupId) params.set("groupId", groupId);
    if (status) params.set("status", status);

    fetch(`/api/admin/links?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [page, search, groupId, status]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setGroups(res.data);
      });
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此短链吗？")) return;
    const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      toast.success("删除成功");
      fetchLinks();
    } else {
      toast.error(result.error || "删除失败");
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("短码已复制: " + code);
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      paused: "bg-yellow-100 text-yellow-700",
      expired: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = { active: "活跃", paused: "暂停", expired: "过期" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[s] || "bg-gray-100 text-gray-700"}`}>
        {labels[s] || s}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">短链管理</h2>
        <div className="flex gap-2">
          <Link
            href="/links/import"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Upload className="w-4 h-4" />
            批量导入
          </Link>
          <Link
            href="/links/new"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            创建短链
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card rounded-lg border border-border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索短码、标题或目标URL..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={groupId}
          onChange={(e) => { setGroupId(e.target.value); setPage(1); }}
          className="text-sm border border-border rounded-md px-3 py-2"
        >
          <option value="">全部分组</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-border rounded-md px-3 py-2"
        >
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="paused">暂停</option>
          <option value="expired">过期</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">短码</th>
                <th className="text-left px-4 py-3 font-medium">标题</th>
                <th className="text-left px-4 py-3 font-medium">目标URL</th>
                <th className="text-left px-4 py-3 font-medium">分组</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">PV</th>
                <th className="text-right px-4 py-3 font-medium">UV</th>
                <th className="text-left px-4 py-3 font-medium">创建时间</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">暂无数据</td></tr>
              ) : (
                data.items.map((link) => (
                  <tr key={link.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-primary">{link.short_code}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{link.title || "-"}</td>
                    <td className="px-4 py-3 max-w-[240px] truncate text-muted-foreground">{link.target_url}</td>
                    <td className="px-4 py-3">{link.group_name || "-"}</td>
                    <td className="px-4 py-3">{statusBadge(link.status)}</td>
                    <td className="px-4 py-3 text-right">{link.pv_count}</td>
                    <td className="px-4 py-3 text-right">{link.uv_count}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {link.created_at?.replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleCopy(link.short_code)} className="p-1.5 hover:bg-muted rounded" title="复制短码">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/links/${link.id}`} className="p-1.5 hover:bg-muted rounded" title="详情">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/links/${link.id}/edit`} className="p-1.5 hover:bg-muted rounded" title="编辑">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(link.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              共 {data.total} 条，第 {data.page}/{data.totalPages} 页
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
