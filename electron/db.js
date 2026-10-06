const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { runMigrations } = require('./migrations');

let db;

class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppError';
  }
}

function init() {
  db = new Database(path.join(app.getPath('userData'), 'kitabi.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

function close() {
  if (db) db.close();
}

const today = () => new Date().toLocaleDateString('en-CA');

function booksList(q = '') {
  const like = `%${q}%`;
  return db
    .prepare(
      `SELECT b.*, b.copies - (SELECT COUNT(*) FROM loans l WHERE l.book_id = b.id AND l.return_date IS NULL) AS available
       FROM books b WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? ORDER BY b.id DESC`
    )
    .all(like, like, like);
}

const activeLoansOf = (bookId) =>
  db.prepare('SELECT COUNT(*) AS n FROM loans WHERE book_id = ? AND return_date IS NULL').get(bookId).n;

function booksSave(b) {
  try {
    if (b.id) {
      const active = activeLoansOf(b.id);
      if (b.copies < active) {
        throw new AppError(`لا يمكن تقليل النسخ إلى أقل من النسخ المعارة حاليًا (${active})`);
      }
      const info = db
        .prepare('UPDATE books SET title=?, author=?, isbn=?, category=?, copies=? WHERE id=?')
        .run(b.title, b.author, b.isbn, b.category, b.copies, b.id);
      if (info.changes === 0) throw new AppError('الكتاب غير موجود');
    } else {
      db.prepare('INSERT INTO books (title, author, isbn, category, copies) VALUES (?,?,?,?,?)').run(
        b.title, b.author, b.isbn, b.category, b.copies
      );
    }
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new AppError('رقم ISBN مستخدم مسبقًا لكتاب آخر');
    throw e;
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
    const info = db
      .prepare('UPDATE members SET name=?, phone=?, email=? WHERE id=?')
      .run(m.name, m.phone, m.email, m.id);
    if (info.changes === 0) throw new AppError('العضو غير موجود');
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

const createLoanTx = (data) =>
  db.transaction(({ book_id, member_id, due_date }) => {
    const book = db.prepare('SELECT copies FROM books WHERE id = ?').get(book_id);
    if (!book) throw new AppError('الكتاب غير موجود');
    const member = db.prepare('SELECT id FROM members WHERE id = ?').get(member_id);
    if (!member) throw new AppError('العضو غير موجود');
    if (due_date < today()) throw new AppError('تاريخ الإرجاع يجب أن يكون من اليوم فما بعد');
    if (book.copies - activeLoansOf(book_id) <= 0) {
      throw new AppError('لا توجد نسخ متاحة من هذا الكتاب');
    }
    db.prepare('INSERT INTO loans (book_id, member_id, loan_date, due_date) VALUES (?,?,?,?)').run(
      book_id, member_id, today(), due_date
    );
  }).immediate(data);

function loansCreate(data) {
  createLoanTx(data);
  return true;
}

function loansReturn(id) {
  const info = db
    .prepare('UPDATE loans SET return_date = ? WHERE id = ? AND return_date IS NULL')
    .run(today(), id);
  if (info.changes === 0) throw new AppError('الإعارة غير موجودة أو أُرجعت مسبقًا');
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
  if (!['books', 'members'].includes(table)) throw new AppError('invalid table');
  try {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  } catch (e) {
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) {
      throw new AppError('لا يمكن الحذف: السجل مرتبط بعمليات إعارة');
    }
    throw e;
  }
  return true;
}

module.exports = {
  AppError, init, close, booksList, booksSave, membersList, membersSave,
  loansList, loansCreate, loansReturn, stats, remove,
};
