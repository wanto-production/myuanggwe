<!-- src/routes/(auth-only)/transactions/+page.svelte -->
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';
	import TransactionsList from '$lib/components/tables/transactions/transactions-list.svelte';
	import TransactionsForm from '$lib/components/forms/transactions/create-form.svelte';
</script>

<svelte:head>
	<title>Transaksi - MyUangGwe | Catat Pemasukan & Pengeluaran</title>
	<meta
		name="description"
		content="Catat dan kelola semua transaksi keuangan Anda - pemasukan, pengeluaran, dan transfer antar dompet di satu tempat."
	/>
	<meta
		name="keywords"
		content="transaksi keuangan, pencatatan keuangan, pemasukan pengeluaran, manajemen keuangan, aplikasi keuangan"
	/>
</svelte:head>

<div class="space-y-6 p-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Transaksi</h1>
			<p class="text-sm text-muted-foreground">Kelola transaksi.</p>
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

				<TransactionsForm />
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<TransactionsList />
</div>
