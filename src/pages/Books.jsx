import React, { useEffect, useState, useCallback } from 'react';
import { call } from '../api.js';
import { PageHeader, Modal, Field, Table } from '../components/UI.jsx';

const empty = { title: '', author: '', isbn: '', category: '', copies: 1 };

export default function Books() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => call('books:list', q).then(setRows), [q]);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try { await call('books:save', form); setForm(null); setErr(''); load(); }
    catch (x) { setErr(x.message); }
  };
  const del = async (id) => {
    if (!confirm('حذف هذا الكتاب؟')) return;
    try { await call('books:delete', id); load(); } catch (x) { alert(x.message); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="الكتب">
        <input className="input w-64" placeholder="بحث بالعنوان أو المؤلف أو ISBN" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setForm(empty)}>+ كتاب جديد</button>
      </PageHeader>
      <Table
        rows={rows}
        columns={[
          { key: 'title', title: 'العنوان' },
          { key: 'author', title: 'المؤلف' },
          { key: 'category', title: 'التصنيف' },
          { key: 'isbn', title: 'ISBN' },
          { key: 'available', title: 'المتاح', render: (r) => `${r.available} / ${r.copies}` },
          {
            key: 'actions', title: '',
            render: (r) => (
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setForm(r)}>تعديل</button>
                <button className="btn-ghost text-rose-400" onClick={() => del(r.id)}>حذف</button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={!!form} title={form?.id ? 'تعديل كتاب' : 'كتاب جديد'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save}>
            <Field label="العنوان"><input required className="input" value={form.title} onChange={set('title')} /></Field>
            <Field label="المؤلف"><input required className="input" value={form.author} onChange={set('author')} /></Field>
            <Field label="التصنيف"><input className="input" value={form.category || ''} onChange={set('category')} /></Field>
            <Field label="ISBN"><input className="input" value={form.isbn || ''} onChange={set('isbn')} /></Field>
            <Field label="عدد النسخ"><input type="number" min="1" className="input" value={form.copies} onChange={set('copies')} /></Field>
            {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>إلغاء</button>
              <button className="btn">حفظ</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
