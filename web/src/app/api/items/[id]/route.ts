import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { deleteItem, getItem } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/paths";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const item = getItem(numId);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  deleteItem(numId);

  try {
    const filename = item.image_path.split("/").pop()!;
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // File may already be gone
  }

  return NextResponse.json({ ok: true });
}
