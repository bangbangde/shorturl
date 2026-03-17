import { NextResponse } from "next/server";
import { getLinkById, updateLink, deleteLink } from "@/services/link.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = getLinkById(Number(id));
    if (!link) {
      return NextResponse.json({ success: false, error: "短链不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: link });
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
    const body = await request.json();
    const link = updateLink(Number(id), body);
    if (!link) {
      return NextResponse.json({ success: false, error: "短链不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: link });
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
    const deleted = deleteLink(Number(id));
    if (!deleted) {
      return NextResponse.json({ success: false, error: "短链不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
