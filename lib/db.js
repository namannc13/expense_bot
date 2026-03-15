import Database from "better-sqlite3";

const db = new Database("expenses.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount INTEGER,
  item TEXT,
  category TEXT,
  payment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

export default db;