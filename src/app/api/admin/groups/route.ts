import { NextResponse } from "next/server";
import { listGroups, createGroup } from "@/services/group.service";

export async function GET() {
  try {
    const groups = listGroups();
    return NextResponse.json({ success: true, data: groups });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ success: false, error: "分组名称不能为空" }, { status: 400 });
    }
    const group = createGroup(name, description);
    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
