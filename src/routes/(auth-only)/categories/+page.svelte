<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-svelte';

	let { data } = $props();
	let open = $state(false);

	const { form, enhance } = superForm(data.form, {
		onUpdated: ({ form }) => {
			if (form.valid) open = false;
		}
	});

	const typeOptions = [
		{ value: 'income', label: 'Pemasukan' },
		{ value: 'expense', label: 'Pengeluaran' }
	];

	let selectedLabel = $derived(
		typeOptions.find((t) => t.value === $form.type)?.label ?? 'Pilih Tipe'
	);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Kategori</h1>
			<p class="text-sm text-muted-foreground">Pisahkan transaksi berdasarkan jenisnya.</p>
		</div>

		<Dialog.Root bind:open>
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

				<form method="POST" use:enhance class="space-y-4 pt-2">
					<div class="space-y-2">
						<Label for="name">Nama Kategori</Label>
						<Input
							id="name"
							name="name"
							bind:value={$form.name}
							placeholder="Misal: Makan, Gaji, Transport"
						/>
					</div>

					<div class="space-y-2">
						<Label>Jenis</Label>
						<Select.Root type="single" bind:value={$form.type} name="type">
							<Select.Trigger
								class={buttonVariants({
									variant: 'outline',
									class: 'w-full justify-between font-normal'
								})}
							>
								{selectedLabel}
							</Select.Trigger>
							<Select.Content>
								{#each typeOptions as opt (opt.value)}
									<Select.Item value={opt.value} label={opt.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<Button type="submit" class="w-full">Simpan</Button>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="grid gap-4 md:grid-cols-4">
		{#each data.categoryList as cat (cat.id)}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{cat.name}</Card.Title>
					{#if cat.type === 'income'}
						<ArrowUpCircle class="h-4 w-4 text-green-500" />
					{:else}
						<ArrowDownCircle class="h-4 w-4 text-red-500" />
					{/if}
				</Card.Header>
			</Card.Root>
		{/each}
	</div>
</div>
