import path from "path";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "public");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const DB_PATH = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, "curio.db")
  : path.join(process.cwd(), "curio.db");
