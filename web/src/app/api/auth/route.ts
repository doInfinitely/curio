import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPin, setPin } from "@/lib/db";

const COOKIE_NAME = "curio-auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (pin !== getPin()) {
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

export async function PUT(request: NextRequest) {
  const { currentPin, newPin } = await request.json();

  if (!currentPin || !newPin) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (currentPin !== getPin()) {
    return NextResponse.json({ error: "Wrong current PIN" }, { status: 401 });
  }

  if (newPin.length < 4) {
    return NextResponse.json({ error: "PIN must be at least 4 characters" }, { status: 400 });
  }

  setPin(newPin);
  return NextResponse.json({ ok: true });
}
