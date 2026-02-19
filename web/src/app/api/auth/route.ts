import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CURIO_PIN = process.env.CURIO_PIN || "1234";
const COOKIE_NAME = "curio-auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (pin !== CURIO_PIN) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
