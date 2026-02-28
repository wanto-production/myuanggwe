<script lang="ts">
	import CategoriesForm from '$lib/components/forms/categories/create-form.svelte';
	import CategoriesList from '$lib/components/tables/categories/categories-list.svelte';

	let open_dialog = $state(false);
</script>

<svelte:head>
	<title>Kategori - MyUangGwe | Atur Jenis Transaksi Keuangan</title>
	<meta
		name="description"
		content="Atur kategori transaksi keuangan Anda - pemasukan dan pengeluaran - untuk pengelompokan yang lebih rapi dan pelacakan anggaran yang lebih baik."
	/>
	<meta
		name="keywords"
		content="kategori keuangan, jenis transaksi, pengelompokan keuangan, manajemen anggaran, aplikasi keuangan"
	/>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Kategori</h1>
			<p class="text-sm text-muted-foreground">Pisahkan transaksi berdasarkan jenisnya.</p>
		</div>

		<Dialog.Root bind:open={open_dialog}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} class="gap-2">
						<Lucide name="Plus" class="h-4 w-4" /> Tambah Kategori
					</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Tambah Kategori</Dialog.Title>
				</Dialog.Header>

				<CategoriesForm bind:open={open_dialog} />
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<CategoriesList />
</div>
