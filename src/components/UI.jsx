import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PageHeader({ title, children }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function Table({ columns, rows, empty = 'لا توجد بيانات' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium">{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.tr
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-t border-slate-800 hover:bg-slate-900/60"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">{c.render ? c.render(r) : r[c.key]}</td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
