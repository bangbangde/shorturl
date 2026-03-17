import { NextResponse } from "next/server";
import { listLinks, createLink } from "@/services/link.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = listLinks({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 20,
      search: searchParams.get("search") || undefined,
      groupId: searchParams.get("groupId") ? Number(searchParams.get("groupId")) : undefined,
      status: searchParams.get("status") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.target_url) {
      return NextResponse.json({ success: false, error: "目标URL不能为空" }, { status: 400 });
    }
    const link = createLink(body);
    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE constraint")) {
      return NextResponse.json({ success: false, error: "短码已存在" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
