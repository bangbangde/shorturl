"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Group, UaRule } from "@/types";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const DEFAULT_UA_RULES: UaRule[] = [
  { name: "微信", pattern: "MicroMessenger", action: "show_tip", tipContent: "请点击右上角，选择在浏览器中打开" },
  { name: "QQ", pattern: "QQ/", action: "show_tip", tipContent: "请点击右上角，选择在浏览器中打开" },
];

export default function NewLinkPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    target_url: "",
    title: "",
    short_code: "",
    group_id: "",
    enable_intermediate: false,
    intermediate_type: "browser_tip",
    intermediate_content: "",
    enable_ua_detection: true,
    expire_at: "",
  });
  const [uaRules, setUaRules] = useState<UaRule[]>(DEFAULT_UA_RULES);

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
          ua_rules: form.enable_ua_detection ? uaRules : [],
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

  const addUaRule = () => {
    setUaRules([...uaRules, { name: "", pattern: "", action: "show_tip", tipContent: "" }]);
  };

  const removeUaRule = (index: number) => {
    setUaRules(uaRules.filter((_, i) => i !== index));
  };

  const updateUaRule = (index: number, field: keyof UaRule, value: string) => {
    setUaRules(uaRules.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)));
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

        {/* Anti-ban Config */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">防封策略</h3>

          {/* Intermediate Page */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.enable_intermediate}
                onChange={(e) => setForm({ ...form, enable_intermediate: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">启用中间页</span>
            </label>
            {form.enable_intermediate && (
              <div className="pl-6 space-y-3">
                <div>
                  <label className="block text-sm mb-1">中间页类型</label>
                  <select
                    value={form.intermediate_type}
                    onChange={(e) => setForm({ ...form, intermediate_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md"
                  >
                    <option value="browser_tip">浏览器提示页（提示用户在浏览器中打开）</option>
                    <option value="custom_html">自定义HTML</option>
                  </select>
                </div>
                {form.intermediate_type === "custom_html" && (
                  <div>
                    <label className="block text-sm mb-1">自定义HTML内容</label>
                    <textarea
                      value={form.intermediate_content}
                      onChange={(e) => setForm({ ...form, intermediate_content: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md font-mono h-32"
                      placeholder="<html><body>...</body></html>"
                    />
                    <p className="text-xs text-muted-foreground mt-1">支持占位符 {"{{TARGET_URL}}"} 用于替换目标链接</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* UA Detection */}
          <div className="space-y-3 pt-2 border-t border-border">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.enable_ua_detection}
                onChange={(e) => setForm({ ...form, enable_ua_detection: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">启用UA检测</span>
            </label>
            {form.enable_ua_detection && (
              <div className="pl-6 space-y-2">
                {uaRules.map((rule, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => updateUaRule(i, "name", e.target.value)}
                      className="w-20 px-2 py-1.5 text-sm border border-border rounded-md"
                      placeholder="名称"
                    />
                    <input
                      type="text"
                      value={rule.pattern}
                      onChange={(e) => updateUaRule(i, "pattern", e.target.value)}
                      className="w-40 px-2 py-1.5 text-sm border border-border rounded-md font-mono"
                      placeholder="UA匹配模式"
                    />
                    <select
                      value={rule.action}
                      onChange={(e) => updateUaRule(i, "action", e.target.value)}
                      className="px-2 py-1.5 text-sm border border-border rounded-md"
                    >
                      <option value="show_tip">显示提示</option>
                      <option value="redirect_other">跳转其他URL</option>
                      <option value="block">阻止访问</option>
                    </select>
                    <input
                      type="text"
                      value={rule.tipContent || ""}
                      onChange={(e) => updateUaRule(i, "tipContent", e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-border rounded-md"
                      placeholder={rule.action === "redirect_other" ? "跳转URL" : "提示内容"}
                    />
                    <button type="button" onClick={() => removeUaRule(i)} className="p-1.5 hover:bg-red-50 text-red-500 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addUaRule} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Plus className="w-3.5 h-3.5" /> 添加规则
                </button>
              </div>
            )}
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
