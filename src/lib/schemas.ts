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
  amount: z.number().int().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  walletId: z.string().min(1, 'Wallet is required'),
  toWalletId: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string() // ISO date string
}).refine(
  (data) => {
    // If transfer, toWalletId is required
    if (data.type === 'transfer' && !data.toWalletId) {
      return false;
    }
    return true;
  },
  {
    message: 'Destination wallet is required for transfers',
    path: ['toWalletId']
  }
);

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
