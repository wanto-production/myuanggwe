import { z } from 'zod';

// auth validator
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

export const registerSchema = z
  .object({
    name: z.string().min(3),
    email: z.email(),
    password: z.string().min(8),
    passwordConfirm: z.string().min(8)
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm']
  });

// transactions
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  walletId: z.string().min(1, 'Pilih dompet'),
  toWalletId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  date: z.string().min(1, 'Tanggal harus diisi')
}).refine((data) => {
  // Jika transfer, toWalletId harus diisi
  if (data.type === 'transfer') {
    return !!data.toWalletId;
  }
  return true;
}, {
  message: 'Dompet tujuan harus diisi untuk transfer',
  path: ['toWalletId']
}).refine((data) => {
  // Jika bukan transfer, categoryId harus diisi
  if (data.type !== 'transfer') {
    return !!data.categoryId;
  }
  return true;
}, {
  message: 'Kategori harus diisi',
  path: ['categoryId']
});

// wallets
export const walletSchema = z.object({
  name: z.string().min(3, 'Nama dompet minimal 3 karakter'),
  type: z.enum(['cash', 'bank', 'credit_card']).default('cash'),
  balance: z.number().min(0, 'Saldo awal tidak boleh negatif')
});

// categories
export const categorySchema = z.object({
  name: z.string().min(2, 'Minimal 2 karakter'),
  type: z.enum(['income', 'expense']),
  icon: z.string().default('Tag').optional() // Nama icon Lucide
});
