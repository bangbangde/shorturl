import { NextResponse } from "next/server";
import { getGroupById, updateGroup, deleteGroup } from "@/services/group.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = getGroupById(Number(id));
    if (!group) {
      return NextResponse.json({ success: false, error: "分组不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: group });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ success: false, error: "分组名称不能为空" }, { status: 400 });
    }
    const group = updateGroup(Number(id), name, description);
    if (!group) {
      return NextResponse.json({ success: false, error: "分组不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: group });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteGroup(Number(id));
    if (!deleted) {
      return NextResponse.json({ success: false, error: "分组不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
