import { NextResponse } from "next/server";
import { bulkCreateLinks } from "@/services/link.service";
import Papa from "papaparse";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!Array.isArray(body.links)) {
        return NextResponse.json({ success: false, error: "links 字段必须为数组" }, { status: 400 });
      }
      const result = bulkCreateLinks(body.links);
      return NextResponse.json({ success: true, data: result });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "请上传CSV文件" }, { status: 400 });
      }

      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0) {
        return NextResponse.json(
          { success: false, error: "CSV解析错误", details: parsed.errors },
          { status: 400 }
        );
      }

      const groupId = formData.get("group_id") ? Number(formData.get("group_id")) : undefined;
      const links = (parsed.data as Record<string, string>[]).map((row) => ({
        target_url: row.target_url || row.url || row.URL || "",
        title: row.title || row.Title || undefined,
        group_id: groupId,
      })).filter((l) => l.target_url);

      const result = bulkCreateLinks(links);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "不支持的Content-Type" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
