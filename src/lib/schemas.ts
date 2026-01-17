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
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  type: z.enum(['income', 'expense', 'transfer']),
  description: z.string().max(255).optional(),
  walletId: z.string().min(1, 'Pilih dompet'),
  toWalletId: z.string().min(1).optional(),
  categoryId: z.string().min(1, 'Pilih kategori'),
  date: z.string().default(new Date().toISOString())
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
  icon: z.string().default('Tag') // Nama icon Lucide
});
