<!-- src/routes/(auth-only)/transactions/+page.svelte -->
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';
	import TransactionsList from '$lib/components/transactions/transactions-list.svelte';
	import TransactionsForm from '$lib/components/transactions/transactions-form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Transaksi - MyUangGwe | Catat Pemasukan & Pengeluaran</title>
	<meta name="description" content="Catat dan kelola semua transaksi keuangan Anda - pemasukan, pengeluaran, dan transfer antar dompet di satu tempat." />
	<meta name="keywords" content="transaksi keuangan, pencatatan keuangan, pemasukan pengeluaran, manajemen keuangan, aplikasi keuangan" />
</svelte:head>

<div class="space-y-6 p-6">
	<div class="flex flex-wrap gap-2 items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Transaksi</h1>
			<p class="text-sm text-muted-foreground">
				Kelola transaksi untuk {data.activeOrg?.name ?? 'Personal'}.
			</p>
		</div>

		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
				<Plus class="mr-2 h-4 w-4" /> Catat Transaksi
			</Dialog.Trigger>

			<Dialog.Content class="sm:max-w-106.25">
				<Dialog.Header>
					<Dialog.Title>Tambah Transaksi</Dialog.Title>
					<Dialog.Description>
						Catat pemasukan, pengeluaran, atau transfer antar dompet.
					</Dialog.Description>
				</Dialog.Header>

				<TransactionsForm wallets={data.walletList} categories={data.categoryList} />
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<TransactionsList transactions={data.transactionList} wallets={data.walletList} />
</div>
