import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/paths";
import { getAllItems } from "@/lib/db";

export async function GET() {
  const items = getAllItems();
  const item = items[0];
  if (!item) return NextResponse.json({ error: "No items" });

  const filename = item.image_path.replace(/^\/api\/uploads\//, "");
  const filePath = path.join(UPLOAD_DIR, filename);

  const checks: Record<string, unknown> = {
    uploadDir: UPLOAD_DIR,
    filename,
    filePath,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 8) ?? "NOT SET",
  };

  try {
    const buffer = await readFile(filePath);
    checks.fileSize = buffer.length;
    checks.fileReadable = true;
  } catch (err) {
    checks.fileReadable = false;
    checks.fileError = String(err);
  }

  // Try the actual OpenAI call
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI();
    const buffer = await readFile(filePath);
    const base64 = buffer.toString("base64");
    const ext = filename.split(".").pop()?.toLowerCase() || "png";
    const mime = ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Reply with ONLY a hex color code like #e8c547 for the dominant color." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}`, detail: "low" } },
          ],
        },
      ],
    });

    checks.gptResponse = response.choices[0]?.message?.content;
    checks.gptSuccess = true;
  } catch (err) {
    checks.gptSuccess = false;
    checks.gptError = String(err);
  }

  return NextResponse.json(checks);
}
