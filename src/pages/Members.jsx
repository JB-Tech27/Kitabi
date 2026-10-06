import React, { useEffect, useState, useCallback } from 'react';
import { call } from '../api.js';
import { PageHeader, Modal, Field, Table } from '../components/UI.jsx';

const empty = { name: '', phone: '', email: '' };

export default function Members() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(() => call('members:list', q).then(setRows), [q]);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try { await call('members:save', form); setForm(null); load(); }
    catch (x) { alert(x.message); }
  };
  const del = async (id) => {
    if (!confirm('حذف هذا العضو؟')) return;
    try { await call('members:delete', id); load(); } catch (x) { alert(x.message); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="الأعضاء">
        <input className="input w-64" placeholder="بحث بالاسم أو الهاتف" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setForm(empty)}>+ عضو جديد</button>
      </PageHeader>
      <Table
        rows={rows}
        columns={[
          { key: 'name', title: 'الاسم' },
          { key: 'phone', title: 'الهاتف' },
          { key: 'email', title: 'البريد' },
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
      <Modal open={!!form} title={form?.id ? 'تعديل عضو' : 'عضو جديد'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save}>
            <Field label="الاسم"><input required className="input" value={form.name} onChange={set('name')} /></Field>
            <Field label="الهاتف"><input className="input" value={form.phone || ''} onChange={set('phone')} /></Field>
            <Field label="البريد الإلكتروني"><input type="email" className="input" value={form.email || ''} onChange={set('email')} /></Field>
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
