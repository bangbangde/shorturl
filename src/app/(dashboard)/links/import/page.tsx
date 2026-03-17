"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Upload, Download } from "lucide-react";
import Link from "next/link";
import type { Group } from "@/types";

export default function ImportLinksPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; reason: string }[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/groups").then((r) => r.json()).then((res) => {
      if (res.success) setGroups(res.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("请选择CSV文件"); return; }
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (groupId) formData.append("group_id", groupId);

      const res = await fetch("/api/admin/links/import", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        toast.success(`导入完成: 成功 ${data.data.success} 条`);
      } else {
        toast.error(data.error || "导入失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "target_url,title\nhttps://example.com/product/1,商品1\nhttps://example.com/product/2,商品2\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/links" className="p-1.5 hover:bg-muted rounded-md">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold">批量导入</h2>
      </div>

      <div className="bg-card rounded-lg border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">上传CSV文件批量创建短链，CSV文件需包含 target_url 列</p>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
            <Download className="w-4 h-4" /> 下载模板
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            {file && <p className="text-sm text-muted-foreground mt-2">已选择: {file.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">统一分组（可选）</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md">
              <option value="">不分组</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <button type="submit" disabled={loading || !file} className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">
            {loading ? "导入中..." : "开始导入"}
          </button>
        </form>

        {result && (
          <div className="border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">导入结果</p>
            <p className="text-sm text-green-600">成功: {result.success} 条</p>
            {result.failed > 0 && (
              <>
                <p className="text-sm text-red-500">失败: {result.failed} 条</p>
                <div className="max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">第 {err.row} 行: {err.reason}</p>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => router.push("/links")} className="text-sm text-primary hover:underline">查看短链列表</button>
          </div>
        )}
      </div>
    </div>
  );
}
