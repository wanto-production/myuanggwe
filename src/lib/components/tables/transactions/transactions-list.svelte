<script lang="ts">
	import { toast } from 'svelte-sonner';

	type Transaction = {
		id: string;
		type: 'income' | 'expense' | 'transfer';
		amount: number;
		description?: string | null;
		date: Date | number;
		wallet: { id: string; name: string };
		category?: { name: string; icon?: string | null } | null;
		toWallet?: { id: string; name: string } | null;
		toWalletId?: string | null;
	};

	let editingTransaction = $state<Transaction | null>(null);
	let isEditSheetOpen = $state(false);

	$effect(() => {
		if (!isEditSheetOpen) {
			editingTransaction = null;
		}
	});

	// Query transactions
	const queryTransactions = createQuery(() => ({
		queryKey: ['transactions'],
		queryFn: async () => {
			const { data } = await client.transactions.get();
			return data;
		}
	}));

	// Query wallets
	const queryWallets = createQuery(() => ({
		queryKey: ['wallets'],
		queryFn: async () => {
			const { data } = await client.wallets.get();
			return data;
		}
	}));

	// Query categories
	const queryCategories = createQuery(() => ({
		queryKey: ['categories'],
		queryFn: async () => {
			const { data } = await client.categories.get();
			return data;
		}
	}));

	// Delete mutation
	const deleteTransactionsMutation = createMutation(() => ({
		mutationKey: ['delete-transactions'],
		mutationFn: async ({ id }: { id: string }) => {
			const res = await client.transactions.erase({ id }).delete();
			if (res.data?.message) toast.success(res.data.message);
		},
		onSuccess() {
			queryTransactions.refetch();
			queryWallets.refetch(); // Refresh wallets karena balance berubah
		}
	}));

	const handleUpdateClick = (tx: Transaction) => {
		editingTransaction = tx;
		isEditSheetOpen = true;
	};

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

	// Derived state
	let transactions = $derived(queryTransactions.data?.transactionList || []);
	let wallets = $derived(queryWallets.data?.walletList || []);
	let categories = $derived(queryCategories.data?.categoryList || []);
	let isLoading = $derived(
		queryTransactions.isLoading || queryWallets.isLoading || queryCategories.isLoading
	);
</script>

{#snippet skeleton()}
	<div class="rounded-md border bg-card">
		{#each Array(5) as _, i (i)}
			<div class="flex items-center justify-between border-b p-4 last:border-0">
				<div class="flex items-center gap-3">
					<Skeleton class="h-10 w-10 rounded-full" />
					<div class="space-y-2">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-3 w-24" />
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="space-y-2 text-right">
						<Skeleton class="h-5 w-24" />
						<Skeleton class="h-3 w-16" />
					</div>
					<Skeleton class="h-9 w-9 rounded-md" />
				</div>
			</div>
		{/each}
	</div>
{/snippet}

{#if editingTransaction}
	{#await import('$lib/components/forms/transactions/edit-form.svelte') then { default: EditForm }}
		<EditForm bind:open={isEditSheetOpen} transaction={editingTransaction} {wallets} {categories} />
	{/await}
{/if}

{#if isLoading}
	{@render skeleton()}
{:else}
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
							<Lucide name="ArrowDownLeft" class="h-4 w-4" />
						{:else if tx.type === 'expense'}
							<Lucide name="ArrowUpRight" class="h-4 w-4" />
						{:else}
							💰
						{/if}
					</div>
					<div>
						<p class="font-medium">
							{#if tx.category?.icon}
								{tx.category.icon}
							{/if}
							{tx.description || tx.category?.name || 'Transfer'}
						</p>
						<p class="text-xs text-muted-foreground">
							{tx.wallet.name}
							{#if tx.type === 'transfer' && tx.toWallet}
								→ {tx.toWallet.name}
							{/if}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-4 text-right">
					<div>
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
					<DropdownAction
						onUpdate={() => handleUpdateClick(tx)}
						onDelete={() => deleteTransactionsMutation.mutate({ id: tx.id })}
					>
						{#snippet trigger({ props })}
							<Button variant="outline" size="icon" {...props}>
								<Lucide name="MoreVertical" class="h-4 w-4" />
							</Button>
						{/snippet}
					</DropdownAction>
				</div>
			</div>
		{:else}
			<div class="p-8 text-center text-muted-foreground">Belum ada transaksi.</div>
		{/each}
	</div>
{/if}
