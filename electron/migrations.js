const migrations = [
  `
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    category TEXT,
    copies INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    loan_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT
  );
  `,
  `
  UPDATE books SET isbn = NULL WHERE isbn IS NOT NULL AND TRIM(isbn) = '';
  DROP INDEX IF EXISTS idx_loans_active;
  CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_loans_book_active ON loans(book_id, return_date);
  CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
  `,
];

function runMigrations(db) {
  const current = db.pragma('user_version', { simple: true });
  for (let i = current; i < migrations.length; i++) {
    db.transaction(() => {
      db.exec(migrations[i]);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
  return migrations.length;
}

module.exports = { runMigrations };
