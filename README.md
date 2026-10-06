# Kitabi 📖

تطبيق سطح مكتب لتسيير المكتبة: الكتب، الأعضاء، والإعارات.

**Stack:** Electron · React · Vite · Tailwind CSS v4 · Framer Motion · SQLite (better-sqlite3)

## التشغيل

```bash
npm install
npm run dev      # وضع التطوير
npm start        # بناء وتشغيل
npm run dist     # إنشاء ملف التثبيت (Windows NSIS / Linux AppImage)
```

> `postinstall` يعيد بناء `better-sqlite3` ليتوافق مع إصدار Electron.

## الميزات

- لوحة تحكم بإحصائيات مباشرة (نسخ، أعضاء، إعارات جارية ومتأخرة)
- إدارة الكتب مع البحث وعدد النسخ والمتاح
- إدارة الأعضاء
- إعارة وإرجاع مع منع إعارة كتاب غير متاح
- قاعدة بيانات SQLite محلية في مجلد userData
- أمان: contextIsolation مفعّل، وقنوات IPC محددة في whitelist
