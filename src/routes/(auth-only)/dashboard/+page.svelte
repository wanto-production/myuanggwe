<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { cn } from '$lib/utils';
	import { formatIDR, formatDate } from '$lib/composables/currency.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/eden';

	let { data } = $props();

	// Query dashboard data
	const dashboardQuery = createQuery(() => ({
		queryKey: ['dashboard'],
		queryFn: async () => {
			const { data } = await client.dashboard.get();
			return data;
		}
	}));

	// Derived state
	let dashboardData = $derived(
		dashboardQuery.data || {
			walletList: [],
			totalBalance: 0,
			walletCount: 0,
			monthlyIncome: 0,
			monthlyExpense: 0,
			recentTransactions: []
		}
	);
	let isLoading = $derived(dashboardQuery.isLoading);

	// Helper to get transaction display
	function getTransactionDisplay(tx: any) {
		if (tx.type === 'transfer') {
			return {
				label: 'Transfer',
				subtitle: `${tx.wallet?.name} → ${tx.toWallet?.name}`,
				isExpense: true
			};
		}
		return {
			label: tx.description || tx.category?.name || 'Transaksi',
			subtitle: `${tx.wallet?.name} • ${formatDate(tx.date)}`,
			isExpense: tx.type === 'expense'
		};
	}
</script>

<svelte:head>
	<title>Dashboard - MyUangGwe | Financial Management</title>
	<meta
		name="description"
		content="MyUangGwe Dashboard - Monitor your personal and business finances in real-time. View balance, income, expenses, and recent transactions."
	/>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-sm text-muted-foreground">
				Financial overview for {data.activeOrg ? data.activeOrg.name : 'Personal'}
			</p>
		</div>
		<Button href="/transactions" class="gap-2">
			<Plus class="h-4 w-4" /> New Transaction
		</Button>
	</div>

	<!-- Stats Cards -->
	{#if isLoading}
		<div class="grid gap-4 md:grid-cols-3">
			{#each [1, 2, 3] as _}
				<Card.Root>
					<Card.Header class="flex flex-row items-center justify-between pb-2">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-4 w-4 rounded-full" />
					</Card.Header>
					<Card.Content>
						<Skeleton class="mb-2 h-8 w-32" />
						<Skeleton class="h-3 w-20" />
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-3">
			<!-- Total Balance -->
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Total Balance</Card.Title>
					<Wallet class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{formatIDR(dashboardData.totalBalance)}</div>
					<p class="text-xs text-muted-foreground">
						From {dashboardData.walletCount} wallet{dashboardData.walletCount !== 1 ? 's' : ''}
					</p>
				</Card.Content>
			</Card.Root>

			<!-- Income -->
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Income</Card.Title>
					<ArrowDownLeft class="h-4 w-4 text-green-500" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold text-green-600">
						+{formatIDR(dashboardData.monthlyIncome)}
					</div>
					<p class="text-xs text-muted-foreground">This month</p>
				</Card.Content>
			</Card.Root>

			<!-- Expense -->
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Expenses</Card.Title>
					<ArrowUpRight class="h-4 w-4 text-red-500" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold text-red-600">
						-{formatIDR(dashboardData.monthlyExpense)}
					</div>
					<p class="text-xs text-muted-foreground">This month</p>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}

	<!-- Recent Transactions -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<div>
				<Card.Title>Recent Transactions</Card.Title>
				<Card.Description>Latest activity from this account.</Card.Description>
			</div>
			<History class="h-4 w-4 text-muted-foreground" />
		</Card.Header>
		<Card.Content>
			{#if isLoading}
				<div class="space-y-6">
					{#each [1, 2, 3, 4, 5] as _}
						<div class="flex items-center gap-4">
							<Skeleton class="h-10 w-10 rounded-full" />
							<div class="flex-1 space-y-2">
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-3 w-24" />
							</div>
							<Skeleton class="h-5 w-20" />
						</div>
					{/each}
				</div>
			{:else}
				<div class="space-y-6">
					{#each dashboardData.recentTransactions as tx (tx.id)}
						{@const display = getTransactionDisplay(tx)}
						<div class="flex items-center gap-4">
							<div
								class={cn(
									'flex h-10 w-10 items-center justify-center rounded-full',
									tx.type === 'income'
										? 'bg-green-100 text-green-600 dark:bg-green-900/30'
										: tx.type === 'expense'
											? 'bg-red-100 text-red-600 dark:bg-red-900/30'
											: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
								)}
							>
								{#if tx.type === 'income'}
									<ArrowDownLeft class="h-4 w-4" />
								{:else if tx.type === 'expense'}
									<ArrowUpRight class="h-4 w-4" />
								{:else}
									<span class="text-sm">💰</span>
								{/if}
							</div>
							<div class="flex-1 space-y-1">
								<p class="text-sm leading-none font-medium">
									{#if tx.category?.icon}
										{tx.category.icon}
									{/if}
									{display.label}
								</p>
								<p class="text-xs text-muted-foreground">
									{display.subtitle}
								</p>
							</div>
							<div
								class={cn(
									'text-sm font-bold',
									display.isExpense ? 'text-red-600' : 'text-green-600'
								)}
							>
								{display.isExpense ? '-' : '+'}
								{formatIDR(tx.amount)}
							</div>
						</div>
					{:else}
						<div class="py-10 text-center text-muted-foreground">
							No transactions yet in this {data.activeOrg ? 'organization' : 'account'}.
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
		{#if dashboardData.recentTransactions.length > 0}
			<Card.Footer>
				<Button variant="ghost" class="w-full text-muted-foreground" href="/transactions">
					View all transactions
				</Button>
			</Card.Footer>
		{/if}
	</Card.Root>
</div>
