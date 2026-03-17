"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import type { Group } from "@/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const fetchGroups = () => {
    setLoading(true);
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((res) => { if (res.success) setGroups(res.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { toast.error("分组名称不能为空"); return; }

    const url = editingId ? `/api/admin/groups/${editingId}` : "/api/admin/groups";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, description: formDesc }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(editingId ? "更新成功" : "创建成功");
      resetForm();
      fetchGroups();
    } else {
      toast.error(data.error || "操作失败");
    }
  };

  const handleEdit = (group: Group) => {
    setEditingId(group.id);
    setFormName(group.name);
    setFormDesc(group.description || "");
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("删除分组后，该分组下的短链将变为未分组。确定删除吗？")) return;
    const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("删除成功");
      fetchGroups();
    } else {
      toast.error(data.error || "删除失败");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormDesc("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">分组管理</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> 创建分组
        </button>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium mb-3">{editingId ? "编辑分组" : "创建分组"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">分组名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如: 双11活动、日常推广"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="可选"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
                {editingId ? "保存" : "创建"}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">描述</th>
              <th className="text-right px-4 py-3 font-medium">短链数量</th>
              <th className="text-left px-4 py-3 font-medium">创建时间</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">暂无分组</td></tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{group.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{group.description || "-"}</td>
                  <td className="px-4 py-3 text-right">{group.link_count || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{group.created_at?.replace("T", " ").slice(0, 16)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(group)} className="p-1.5 hover:bg-muted rounded" title="编辑">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(group.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="删除">
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
    </div>
  );
}
