import Database from "better-sqlite3";
import { DB_PATH } from "./paths";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");

    _db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path TEXT    NOT NULL,
        caption    TEXT,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        status     TEXT    NOT NULL DEFAULT 'ready'
      )
    `);
  }
  return _db;
}

export interface DbItem {
  id: number;
  image_path: string;
  caption: string | null;
  created_at: string;
  status: string;
}

export function getAllItems(): DbItem[] {
  return getDb()
    .prepare("SELECT * FROM items ORDER BY created_at DESC")
    .all() as DbItem[];
}

export function insertItem(imagePath: string, caption: string | null): DbItem {
  const stmt = getDb().prepare(
    "INSERT INTO items (image_path, caption) VALUES (?, ?) RETURNING *",
  );
  return stmt.get(imagePath, caption) as DbItem;
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
