import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAllItems, insertItem, updateItemColor } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/paths";
import { extractColorWithGPT } from "@/lib/extract-color-gpt";

export async function GET() {
  const items = getAllItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const imagePath = `/api/uploads/${filename}`;
  const item = insertItem(imagePath, caption?.trim() || null);

  // Extract dominant color via GPT Vision in the background —
  // don't block the upload response
  extractColorWithGPT(imagePath).then((color) => {
    if (color) {
      updateItemColor(item.id, color);
    }
  });

  return NextResponse.json(item, { status: 201 });
}
