import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";
import { DB_PATH, UPLOAD_DIR } from "./paths";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    // Ensure data directories exist before opening DB
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    mkdirSync(UPLOAD_DIR, { recursive: true });

    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");

    _db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path      TEXT    NOT NULL,
        caption         TEXT,
        dominant_color   TEXT,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        status          TEXT    NOT NULL DEFAULT 'ready'
      )
    `);

    // Migrate: add dominant_color if missing (existing DBs)
    const cols = _db.prepare("PRAGMA table_info(items)").all() as { name: string }[];
    if (!cols.some((c) => c.name === "dominant_color")) {
      _db.exec("ALTER TABLE items ADD COLUMN dominant_color TEXT");
    }

    _db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }
  return _db;
}

export interface DbItem {
  id: number;
  image_path: string;
  caption: string | null;
  dominant_color: string | null;
  created_at: string;
  status: string;
}

export function getAllItems(): DbItem[] {
  return getDb()
    .prepare("SELECT * FROM items ORDER BY created_at DESC")
    .all() as DbItem[];
}

export function insertItem(
  imagePath: string,
  caption: string | null,
  dominantColor: string | null = null,
): DbItem {
  const stmt = getDb().prepare(
    "INSERT INTO items (image_path, caption, dominant_color) VALUES (?, ?, ?) RETURNING *",
  );
  return stmt.get(imagePath, caption, dominantColor) as DbItem;
}

export function updateItemColor(id: number, color: string): void {
  getDb().prepare("UPDATE items SET dominant_color = ? WHERE id = ?").run(color, id);
}

export function deleteItem(id: number): boolean {
  const result = getDb().prepare("DELETE FROM items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getItem(id: number): DbItem | undefined {
  return getDb()
    .prepare("SELECT * FROM items WHERE id = ?")
    .get(id) as DbItem | undefined;
}

// ── Settings ──────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

export function getPin(): string {
  return getSetting("pin") ?? process.env.CURIO_PIN ?? "1234";
}

export function setPin(newPin: string): void {
  setSetting("pin", newPin);
}
