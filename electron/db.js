const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function init() {
  db = new Database(path.join(app.getPath('userData'), 'kitabi.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_loans_active ON loans(return_date);
  `);
  return db;
}

const today = () => new Date().toISOString().slice(0, 10);

function booksList(q = '') {
  const like = `%${q}%`;
  return db
    .prepare(
      `SELECT b.*, b.copies - (SELECT COUNT(*) FROM loans l WHERE l.book_id = b.id AND l.return_date IS NULL) AS available
       FROM books b WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? ORDER BY b.id DESC`
    )
    .all(like, like, like);
}

function booksSave(b) {
  if (b.id) {
    db.prepare('UPDATE books SET title=?, author=?, isbn=?, category=?, copies=? WHERE id=?').run(
      b.title, b.author, b.isbn, b.category, Number(b.copies) || 1, b.id
    );
  } else {
    db.prepare('INSERT INTO books (title, author, isbn, category, copies) VALUES (?,?,?,?,?)').run(
      b.title, b.author, b.isbn, b.category, Number(b.copies) || 1
    );
  }
  return true;
}

function membersList(q = '') {
  const like = `%${q}%`;
  return db
    .prepare('SELECT * FROM members WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY id DESC')
    .all(like, like, like);
}

function membersSave(m) {
  if (m.id) {
    db.prepare('UPDATE members SET name=?, phone=?, email=? WHERE id=?').run(m.name, m.phone, m.email, m.id);
  } else {
    db.prepare('INSERT INTO members (name, phone, email) VALUES (?,?,?)').run(m.name, m.phone, m.email);
  }
  return true;
}

function loansList() {
  return db
    .prepare(
      `SELECT l.*, b.title AS book_title, m.name AS member_name
       FROM loans l JOIN books b ON b.id = l.book_id JOIN members m ON m.id = l.member_id
       ORDER BY (l.return_date IS NULL) DESC, l.id DESC`
    )
    .all();
}

function loansCreate({ book_id, member_id, due_date }) {
  const book = booksList('').find((b) => b.id === Number(book_id));
  if (!book) throw new Error('الكتاب غير موجود');
  if (book.available <= 0) throw new Error('لا توجد نسخ متاحة من هذا الكتاب');
  db.prepare('INSERT INTO loans (book_id, member_id, loan_date, due_date) VALUES (?,?,?,?)').run(
    book_id, member_id, today(), due_date
  );
  return true;
}

function loansReturn(id) {
  db.prepare('UPDATE loans SET return_date = ? WHERE id = ? AND return_date IS NULL').run(today(), id);
  return true;
}

function stats() {
  const one = (sql, ...p) => db.prepare(sql).get(...p).n;
  return {
    books: one('SELECT COALESCE(SUM(copies),0) AS n FROM books'),
    titles: one('SELECT COUNT(*) AS n FROM books'),
    members: one('SELECT COUNT(*) AS n FROM members'),
    active: one('SELECT COUNT(*) AS n FROM loans WHERE return_date IS NULL'),
    overdue: one('SELECT COUNT(*) AS n FROM loans WHERE return_date IS NULL AND due_date < ?', today()),
  };
}

function remove(table, id) {
  const allowed = ['books', 'members'];
  if (!allowed.includes(table)) throw new Error('invalid table');
  try {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  } catch (e) {
    throw new Error('لا يمكن الحذف: السجل مرتبط بعمليات إعارة');
  }
  return true;
}

module.exports = {
  init, booksList, booksSave, membersList, membersSave,
  loansList, loansCreate, loansReturn, stats, remove,
};
