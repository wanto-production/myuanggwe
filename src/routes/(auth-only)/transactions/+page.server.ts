import { db } from '$lib/server/db';
import { transactions, wallets, categories } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq, and, desc, isNull } from 'drizzle-orm';


export const load = async ({ parent, depends }) => {
  depends('transactions:data')
  const { activeOrg, user } = await parent();

  // Query filters
  const walletFilter = activeOrg
    ? eq(wallets.organizationId, activeOrg.id)
    : and(eq(wallets.userId, user.id), isNull(wallets.organizationId));

  const categoryFilter = activeOrg
    ? eq(categories.organizationId, activeOrg.id)
    : and(eq(categories.userId, user.id), isNull(categories.organizationId));

  const transactionFilter = activeOrg
    ? eq(transactions.organizationId, activeOrg.id)
    : and(eq(transactions.userId, user.id), isNull(transactions.organizationId));

  try {
    const [walletList, categoryList, transactionList] = await Promise.all([
      db.query.wallets.findMany({
        where: walletFilter,
        orderBy: [desc(wallets.createdAt)]
      }),
      db.query.categories.findMany({
        where: categoryFilter
      }),
      db.query.transactions.findMany({
        where: transactionFilter,
        with: {
          category: true,
          wallet: true,
          user: true
        },
        orderBy: [desc(transactions.date)],
        limit: 50
      })
    ]);


    return {
      transactionList,
      walletList,
      categoryList,
    };
  } catch (err) {
    console.error('Transactions load error:', err);
    throw error(500, 'Failed to load transactions');
  }
};
