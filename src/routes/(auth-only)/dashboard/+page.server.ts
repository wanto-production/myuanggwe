// src/routes/(auth-only)/dashboard/+page.server.ts
import { db } from '$lib/server/db';
import { transactions, wallets } from '$lib/server/db/schema';
import { eq, and, isNull, gte, sql, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, depends }) => {
  depends('dashboard:data')
  const { activeOrg, user } = await parent();

  // Tentukan awal bulan berjalan
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Context query untuk org vs personal
  const contextQuery = activeOrg
    ? eq(transactions.organizationId, activeOrg.id)
    : and(eq(transactions.userId, user.id), isNull(transactions.organizationId));

  const walletContextQuery = activeOrg
    ? eq(wallets.organizationId, activeOrg.id)
    : and(eq(wallets.userId, user.id), isNull(wallets.organizationId));

  try {
    // Parallel queries
    const [userWallets, stats, recentTransactions] = await Promise.all([
      // 1. Ambil semua wallet
      db.query.wallets.findMany({
        where: walletContextQuery,
        orderBy: [desc(wallets.createdAt)]
      }),

      // 2. Stats bulan ini
      db
        .select({
          type: transactions.type,
          total: sql<number>`cast(sum(${transactions.amount}) as integer)`
        })
        .from(transactions)
        .where(and(contextQuery, gte(transactions.date, startOfMonth)))
        .groupBy(transactions.type),

      // 3. Recent transactions
      db.query.transactions.findMany({
        where: contextQuery,
        with: {
          category: true,
          wallet: true,
          user: true
        },
        orderBy: [desc(transactions.date)],
        limit: 5
      })
    ]);

    const totalBalance = userWallets.reduce((acc, curr) => acc + curr.balance, 0);
    const monthlyIncome = stats.find((s) => s.type === 'income')?.total || 0;
    const monthlyExpense = stats.find((s) => s.type === 'expense')?.total || 0;

    return {
      walletList: userWallets,
      totalBalance,
      walletCount: userWallets.length,
      monthlyIncome,
      monthlyExpense,
      recentTransactions
    };
  } catch (error) {
    console.error('Dashboard load error:', error);
    return {
      walletList: [],
      totalBalance: 0,
      walletCount: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      recentTransactions: []
    };
  }
};
