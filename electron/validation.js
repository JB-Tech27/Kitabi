const { z } = require('zod');

const id = z.coerce.number({ invalid_type_error: 'معرّف غير صالح' }).int().positive('معرّف غير صالح');

const optText = (max) =>
  z
    .string()
    .trim()
    .max(max, 'النص طويل جدًا')
    .nullish()
    .transform((v) => (v ? v : null));

const optEmail = z
  .union([z.literal(''), z.null(), z.undefined(), z.string().trim().max(120).email('بريد إلكتروني غير صالح')])
  .transform((v) => v || null);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صالح')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'تاريخ غير صالح');

const schemas = {
  none: z.any().transform(() => undefined),
  id,
  query: z.string().max(100, 'نص البحث طويل جدًا').default(''),
  book: z.object({
    id: id.optional(),
    title: z.string().trim().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جدًا'),
    author: z.string().trim().min(1, 'اسم المؤلف مطلوب').max(120, 'اسم المؤلف طويل جدًا'),
    isbn: optText(32),
    category: optText(80),
    copies: z.coerce.number({ invalid_type_error: 'عدد النسخ غير صالح' }).int().min(1, 'عدد النسخ يجب أن يكون 1 على الأقل').max(10000),
  }),
  member: z.object({
    id: id.optional(),
    name: z.string().trim().min(1, 'الاسم مطلوب').max(120, 'الاسم طويل جدًا'),
    phone: optText(30),
    email: optEmail,
  }),
  loan: z.object({
    book_id: id,
    member_id: id,
    due_date: isoDate,
  }),
};

module.exports = { schemas };
