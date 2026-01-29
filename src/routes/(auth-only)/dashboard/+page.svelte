<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-svelte';
	import { cn, formatIDR, formatDate } from '$lib/utils';

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-sm text-muted-foreground">
				Overview keuangan {data.activeOrg ? `Grup ${data.activeOrg.name}` : 'Personal'}
			</p>
		</div>
		<Button href="/transactions" class="gap-2">
			<Plus class="h-4 w-4" /> Transaksi
		</Button>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Title class="text-sm font-medium">Total Saldo</Card.Title>
				<Wallet class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatIDR(data.totalBalance)}</div>
				<p class="text-xs text-muted-foreground">Dari {data.walletCount} dompet</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Title class="text-sm font-medium">Pemasukan</Card.Title>
				<ArrowUpRight class="h-4 w-4 text-green-500" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-green-600">
					{formatIDR(data.monthlyIncome)}
				</div>
				<p class="text-xs text-muted-foreground">Bulan ini</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Title class="text-sm font-medium">Pengeluaran</Card.Title>
				<ArrowDownLeft class="h-4 w-4 text-red-500" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-red-600">
					{formatIDR(data.monthlyExpense)}
				</div>
				<p class="text-xs text-muted-foreground">Bulan ini</p>
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<div>
				<Card.Title>Transaksi Terakhir</Card.Title>
				<Card.Description>Aktivitas terbaru dari akun ini.</Card.Description>
			</div>
			<History class="h-4 w-4 text-muted-foreground" />
		</Card.Header>
		<Card.Content>
			<div class="space-y-6">
				{#each data.recentTransactions as tx (tx.id)}
					<div class="flex items-center gap-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
							<span class="text-lg">💰</span>
						</div>
						<div class="flex-1 space-y-1">
							<p class="text-sm leading-none font-medium">{tx.description || tx.category.name}</p>
							<p class="text-xs text-muted-foreground">
								{tx.wallet.name} • {formatDate(tx.date)}
							</p>
						</div>
						<div
							class={cn(
								'text-sm font-bold',
								tx.category.type === 'expense' ? 'text-red-500' : 'text-green-500'
							)}
						>
							{tx.category.type === 'expense' ? '-' : '+'}
							{formatIDR(tx.amount)}
						</div>
					</div>
				{:else}
					<div class="py-10 text-center text-muted-foreground">
						Belum ada transaksi di {data.activeOrg ? 'grup' : 'akun'} ini.
					</div>
				{/each}
			</div>
		</Card.Content>
		<Card.Footer>
			<Button variant="ghost" class="w-full text-muted-foreground" href="/transactions">
				Lihat semua riwayat
			</Button>
		</Card.Footer>
	</Card.Root>
</div>
