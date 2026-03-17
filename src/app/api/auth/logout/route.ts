import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.slice(0, -1);

  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
