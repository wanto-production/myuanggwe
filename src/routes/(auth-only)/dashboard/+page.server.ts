import { db } from '$lib/server/db';
import { transactions, wallets } from '$lib/server/db/schema';
import { eq, and, isNull, gte, sql } from 'drizzle-orm';

export const load = async ({ parent }) => {
	const { activeOrg, user } = await parent();

	// Tentukan awal bulan berjalan
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const contextQuery = activeOrg
		? eq(transactions.organizationId, activeOrg.id)
		: and(eq(transactions.userId, user.id), isNull(transactions.organizationId));

	const walletContextQuery = activeOrg
		? eq(wallets.organizationId, activeOrg.id)
		: and(eq(wallets.userId, user.id), isNull(wallets.organizationId));

	// 1. Ambil data dompet & total saldo
	const userWallets = await db.query.wallets.findMany({
		where: walletContextQuery
	});
	const totalBalance = userWallets.reduce((acc, curr) => acc + curr.balance, 0);

	// 2. Ambil statistik Pemasukan & Pengeluaran bulan ini
	// Kita gunakan db.select untuk agregasi sum
	const stats = await db
		.select({
			type: transactions.type,
			total: sql<number>`sum(${transactions.amount})`
		})
		.from(transactions)
		.where(and(contextQuery, gte(transactions.date, startOfMonth)))
		.groupBy(transactions.type);

	// Mapping stats ke variabel yang mudah dibaca
	const monthlyIncome = stats.find((s) => s.type === 'income')?.total || 0;
	const monthlyExpense = stats.find((s) => s.type === 'expense')?.total || 0;

	// 3. Ambil 5 transaksi terakhir
	const recentTransactions = await db.query.transactions.findMany({
		where: contextQuery,
		with: {
			category: true,
			wallet: true
		},
		orderBy: (transactions, { desc }) => [desc(transactions.date)],
		limit: 5
	});

	return {
		totalBalance,
		recentTransactions,
		walletCount: userWallets.length,
		monthlyIncome,
		monthlyExpense,
		activeOrg
	};
};
