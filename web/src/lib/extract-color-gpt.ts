import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "./paths";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

/**
 * Uses GPT-4o vision to analyze an uploaded product image and return
 * a hex color that best represents the item for site theming.
 *
 * Falls back to null on any failure so uploads are never blocked.
 */
export async function extractColorWithGPT(
  imagePath: string,
): Promise<string | null> {
  try {
    // imagePath is like "/api/uploads/1234-abc.png" — resolve to disk
    const filename = imagePath.replace(/^\/api\/uploads\//, "");
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = await readFile(filePath);
    const base64 = buffer.toString("base64");
    const ext = filename.split(".").pop()?.toLowerCase() || "png";
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : "image/png";

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'What is the single most visually prominent and vibrant color of this product? Reply with ONLY a hex color code like #e8c547. Pick a saturated, vivid color suitable as a UI accent — avoid white, black, or gray.',
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${base64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    const match = text.match(/#[0-9a-fA-F]{6}/);
    return match ? match[0] : null;
  } catch (err) {
    console.error("GPT color extraction failed:", err);
    return null;
  }
}
