import React, { useEffect, useState, useCallback } from 'react';
import { call } from '../api.js';
import { PageHeader, Modal, Field, Table } from '../components/UI.jsx';

const plusDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Loans() {
  const [rows, setRows] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => call('loans:list').then(setRows), []);
  useEffect(() => { load(); }, [load]);

  const openForm = async () => {
    const [b, m] = await Promise.all([call('books:list', ''), call('members:list', '')]);
    setBooks(b.filter((x) => x.available > 0));
    setMembers(m);
    setErr('');
    setForm({ book_id: '', member_id: '', due_date: plusDays(14) });
  };

  const save = async (e) => {
    e.preventDefault();
    try { await call('loans:create', form); setForm(null); load(); }
    catch (x) { setErr(x.message); }
  };

  const status = (r) => {
    if (r.return_date) return <span className="text-slate-500">تم الإرجاع ({r.return_date})</span>;
    if (r.due_date < todayStr()) return <span className="text-rose-400">متأخر</span>;
    return <span className="text-amber-400">جارية</span>;
  };

  return (
    <>
      <PageHeader title="الإعارات">
        <button className="btn" onClick={openForm}>+ إعارة جديدة</button>
      </PageHeader>
      <Table
        rows={rows}
        columns={[
          { key: 'book_title', title: 'الكتاب' },
          { key: 'member_name', title: 'العضو' },
          { key: 'loan_date', title: 'تاريخ الإعارة' },
          { key: 'due_date', title: 'تاريخ الإرجاع' },
          { key: 'status', title: 'الحالة', render: status },
          {
            key: 'actions', title: '',
            render: (r) => !r.return_date && (
              <button className="btn-ghost" onClick={async () => { await call('loans:return', r.id); load(); }}>
                تسجيل الإرجاع
              </button>
            ),
          },
        ]}
      />
      <Modal open={!!form} title="إعارة جديدة" onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save}>
            <Field label="الكتاب">
              <select required className="input" value={form.book_id} onChange={(e) => setForm({ ...form, book_id: e.target.value })}>
                <option value="">اختر كتابًا</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available})</option>)}
              </select>
            </Field>
            <Field label="العضو">
              <select required className="input" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
                <option value="">اختر عضوًا</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="تاريخ الإرجاع">
              <input type="date" required className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>إلغاء</button>
              <button className="btn">تأكيد</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
