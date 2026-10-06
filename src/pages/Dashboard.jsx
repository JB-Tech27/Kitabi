import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { call } from '../api.js';
import { PageHeader, Table } from '../components/UI.jsx';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    call('stats:get').then(setS);
    call('loans:list').then((l) => setLoans(l.filter((x) => !x.return_date).slice(0, 8)));
  }, []);

  const cards = s && [
    { label: 'عناوين الكتب', value: s.titles, color: 'text-sky-400' },
    { label: 'إجمالي النسخ', value: s.books, color: 'text-brand-400' },
    { label: 'الأعضاء', value: s.members, color: 'text-violet-400' },
    { label: 'إعارات جارية', value: s.active, color: 'text-amber-400' },
    { label: 'متأخرة', value: s.overdue, color: 'text-rose-400' },
  ];

  return (
    <>
      <PageHeader title="لوحة التحكم" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {(cards || []).map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="text-sm text-slate-400">{c.label}</div>
            <div className={`mt-2 text-3xl font-bold ${c.color}`}>{c.value}</div>
          </motion.div>
        ))}
      </div>
      <h2 className="mb-3 font-semibold">الإعارات الجارية</h2>
      <Table
        rows={loans}
        columns={[
          { key: 'book_title', title: 'الكتاب' },
          { key: 'member_name', title: 'العضو' },
          { key: 'due_date', title: 'تاريخ الإرجاع' },
        ]}
      />
    </>
  );
}
