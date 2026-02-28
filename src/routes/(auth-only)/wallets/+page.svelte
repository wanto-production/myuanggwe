<script lang="ts">
	import WalletsForm from '$lib/components/forms/wallets/create-form.svelte';
	import WalletsList from '$lib/components/tables/wallets/wallets-list.svelte';

	let { data } = $props();

	let dialog_open = $state(false);
</script>

<svelte:head>
	<title>Dompet - MyUangGwe | Kelola Rekening & Saldo Keuangan</title>
	<meta
		name="description"
		content="Kelola semua rekening dan dompet keuangan Anda - bank, kartu kredit, dan tunai - dalam satu tempat."
	/>
	<meta
		name="keywords"
		content="dompet digital, rekening bank, manajemen saldo, pengelolaan keuangan, aplikasi keuangan"
	/>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dompet Saya</h1>
			<p class="text-sm text-muted-foreground">
				Kelola rekening untuk {data.activeOrg?.name ?? 'Personal'}.
			</p>
		</div>

		<Dialog.Root bind:open={dialog_open}>
			<Dialog.Trigger class={buttonVariants({ class: 'gap-2' })}>
				<Lucide name="Plus" class="h-4 w-4" /> Tambah Dompet
			</Dialog.Trigger>

			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Buat Dompet Baru</Dialog.Title>
				</Dialog.Header>

				<WalletsForm bind:open={dialog_open} />
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<WalletsList {data} />
</div>
