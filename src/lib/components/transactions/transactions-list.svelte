<script lang="ts">
	import { ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	type Transaction = {
		id: string;
		type: 'income' | 'expense' | 'transfer';
		amount: number;
		description?: string | null;
		date: Date | number;
		wallet: { name: string };
		category?: { name: string } | null;
		toWalletId?: string | null;
	};

	type Wallet = {
		id: string;
		name: string;
	};

	let {
		transactions,
		wallets
	}: {
		transactions: Transaction[];
		wallets: Wallet[];
	} = $props();

	const formatRupiah = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (date: Date | number) => {
		const d = typeof date === 'number' ? new Date(date * 1000) : date;
		return d.toLocaleDateString('id-ID');
	};
</script>

<div class="rounded-md border bg-card">
	{#each transactions as tx (tx.id)}
		<div
			class="flex items-center justify-between border-b p-4 transition-colors last:border-0 hover:bg-muted/50"
		>
			<div class="flex items-center gap-3">
				<div
					class={cn(
						'rounded-full p-2',
						tx.type === 'income'
							? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
							: tx.type === 'expense'
								? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
								: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
					)}
				>
					{#if tx.type === 'income'}
						<ArrowDownLeft class="h-4 w-4" />
					{:else if tx.type === 'expense'}
						<ArrowUpRight class="h-4 w-4" />
					{:else}
						💰
					{/if}
				</div>
				<div>
					<p class="font-medium">{tx.description || tx.category?.name || 'Transfer'}</p>
					<p class="text-xs text-muted-foreground">
						{tx.wallet.name}
						{#if tx.type === 'transfer' && tx.toWalletId}
							→ {wallets.find((w) => w.id === tx.toWalletId)?.name}
						{/if}
					</p>
				</div>
			</div>
			<div class="text-right">
				<p
					class={cn(
						'font-bold',
						tx.type === 'income'
							? 'text-green-600 dark:text-green-400'
							: tx.type === 'expense'
								? 'text-red-600 dark:text-red-400'
								: ''
					)}
				>
					{tx.type === 'income' ? '+' : '-'}
					{formatRupiah(tx.amount)}
				</p>
				<p class="text-[10px] text-muted-foreground">
					{formatDate(tx.date)}
				</p>
			</div>
		</div>
	{:else}
		<div class="p-8 text-center text-muted-foreground">Belum ada transaksi.</div>
	{/each}
</div>
