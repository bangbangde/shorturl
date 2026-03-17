import { NextResponse } from "next/server";
import { authenticateUser } from "@/services/user.service";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    const token = await createToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      success: true,
      data: { token, username: user.username },
    });

    const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.slice(0, -1);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: proto === "https",
      sameSite: "lax",
      maxAge: 86400, // 24h
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
