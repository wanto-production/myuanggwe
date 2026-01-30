<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical } from 'lucide-svelte';
	import DropdownAction from '$lib/components/DropdownAction.svelte';
	import CategoriesForm from '$lib/components/categories/categories-form.svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import { client } from '$lib/eden.js';
	import { toast } from 'svelte-sonner';
	import { invalidate } from '$app/navigation';
	import EditForm from '$lib/components/categories/edit-form.svelte';

	let { data } = $props();

	let open_dialog = $state(false);
	let open_sheet = $state(false);

	const deleteCategoryMutation = createMutation(() => ({
		mutationKey: ['delete-category'],
		mutationFn: async ({ id }: { id: string }) => {
			const res = await client.categories.remove({ id }).delete();
			await invalidate('categories:data');

			if (res.data?.message) toast.message(res.data.message);
		}
	}));
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
						<Plus class="h-4 w-4" /> Tambah Kategori
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

	<div class="grid gap-4 md:grid-cols-4">
		{#each data.categoryList as cat (cat.id)}
			<EditForm category={cat} bind:open={open_sheet} />
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{cat.icon} {cat.name}</Card.Title>
					<div class="flex items-center gap-2">
						{#if cat.type === 'income'}
							<ArrowUpCircle class="h-4 w-4 text-green-500" />
						{:else}
							<ArrowDownCircle class="h-4 w-4 text-red-500" />
						{/if}
						<DropdownAction
							onDelete={() => deleteCategoryMutation.mutate({ id: cat.id })}
							onUpdate={() => (open_sheet = !open_sheet)}
						>
							{#snippet trigger({ props })}
								<Button {...props} variant="outline">
									<MoreVertical />
								</Button>
							{/snippet}
						</DropdownAction>
					</div>
				</Card.Header>
			</Card.Root>
		{/each}
	</div>
</div>
