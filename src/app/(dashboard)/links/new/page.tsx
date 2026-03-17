"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Group } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewLinkPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    target_url: "",
    title: "",
    short_code: "",
    group_id: "",
    expire_at: "",
  });

  useEffect(() => {
    fetch("/api/admin/groups").then((r) => r.json()).then((res) => {
      if (res.success) setGroups(res.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.target_url) { toast.error("目标URL不能为空"); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          group_id: form.group_id ? Number(form.group_id) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("短链创建成功");
        router.push("/links");
      } else {
        toast.error(data.error || "创建失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/links" className="p-1.5 hover:bg-muted rounded-md">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold">创建短链</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">基本信息</h3>
          <div>
            <label className="block text-sm font-medium mb-1">目标URL <span className="text-red-500">*</span></label>
            <input
              type="url"
              value={form.target_url}
              onChange={(e) => setForm({ ...form, target_url: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/product/123"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">标题/备注</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="可选"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">自定义短码</label>
              <input
                type="text"
                value={form.short_code}
                onChange={(e) => setForm({ ...form, short_code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="留空自动生成"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">所属分组</label>
              <select
                value={form.group_id}
                onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-md"
              >
                <option value="">不分组</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">过期时间</label>
              <input
                type="datetime-local"
                value={form.expire_at}
                onChange={(e) => setForm({ ...form, expire_at: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "创建中..." : "创建短链"}
          </button>
          <Link href="/links" className="px-6 py-2 border border-border rounded-md text-sm hover:bg-muted">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
