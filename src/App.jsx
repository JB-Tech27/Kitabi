import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard.jsx';
import Books from './pages/Books.jsx';
import Members from './pages/Members.jsx';
import Loans from './pages/Loans.jsx';

const tabs = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: '📊', C: Dashboard },
  { id: 'books', label: 'الكتب', icon: '📚', C: Books },
  { id: 'members', label: 'الأعضاء', icon: '👥', C: Members },
  { id: 'loans', label: 'الإعارات', icon: '🔄', C: Loans },
];

export default function App() {
  const [active, setActive] = useState('dashboard');
  const Current = tabs.find((t) => t.id === active).C;

  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 border-l border-slate-800 bg-slate-900 p-4">
        <div className="mb-8 px-2 text-2xl font-extrabold text-brand-400">📖 Kitabi</div>
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm"
            >
              {active === t.id && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-brand-500/15 ring-1 ring-brand-500/40"
                />
              )}
              <span className="relative">{t.icon}</span>
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <Current />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
