"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // HMAC secret visibility
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSettings(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSavePassword = async () => {
    if (!newPassword) { toast.error("请输入新密码"); return; }
    if (newPassword !== confirmPassword) { toast.error("两次密码不一致"); return; }
    if (newPassword.length < 6) { toast.error("密码至少6位"); return; }

    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast.success("密码已更新");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(data.error || "更新失败");
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast.success("设置已保存");
    } else {
      toast.error(data.error || "保存失败");
    }
  };

  const regenerateSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "";
    for (let i = 0; i < 32; i++) secret += chars.charAt(Math.floor(Math.random() * chars.length));
    setSettings({ ...settings, hmac_secret: secret });
  };

  if (loading) return <div className="text-muted-foreground">加载中...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold">系统设置</h2>

      {/* Password */}
      <div className="bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium">修改密码</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">新密码</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="至少6位" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">确认密码</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="再次输入" />
          </div>
        </div>
        <button onClick={handleSavePassword} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">
          更新密码
        </button>
      </div>

      {/* HMAC Secret */}
      <div className="bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium">API 密钥 (HMAC Secret)</h3>
        <p className="text-sm text-muted-foreground">外部跳转服务调用 API 时使用此密钥进行签名验证</p>
        <div className="flex items-center gap-2">
          <input
            type={showSecret ? "text" : "password"}
            value={settings.hmac_secret || ""}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-border rounded-md font-mono bg-muted"
          />
          <button onClick={() => setShowSecret(!showSecret)} className="p-2 border border-border rounded-md hover:bg-muted" title={showSecret ? "隐藏" : "显示"}>
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(settings.hmac_secret || ""); toast.success("已复制"); }} className="px-3 py-2 border border-border rounded-md text-sm hover:bg-muted">
            复制
          </button>
          <button onClick={regenerateSecret} className="p-2 border border-border rounded-md hover:bg-muted" title="重新生成">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Short Code Length */}
      <div className="bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium">短码设置</h3>
        <div>
          <label className="block text-sm font-medium mb-1">短码长度</label>
          <input
            type="number"
            min={4}
            max={12}
            value={settings.short_code_length || "6"}
            onChange={(e) => setSettings({ ...settings, short_code_length: e.target.value })}
            className="w-32 px-3 py-2 text-sm border border-border rounded-md"
          />
          <p className="text-xs text-muted-foreground mt-1">推荐 6 位，取值范围 4-12</p>
        </div>
      </div>

      <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">
        <Save className="w-4 h-4" /> {saving ? "保存中..." : "保存所有设置"}
      </button>
    </div>
  );
}
