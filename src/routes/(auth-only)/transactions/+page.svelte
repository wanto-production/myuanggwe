<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let open = $state(false);

	const { form, errors, enhance } = superForm(data.form, {
		onUpdated: ({ form }) => {
			console.log(form);
			if (form.valid) open = false;
		}
	});

	type TransactionType = 'income' | 'expense' | 'transfer';

	// Label helpers
	let selectedWallet = $derived(
		data.walletList.find((w) => w.id === $form.walletId)?.name ?? 'Pilih Dompet'
	);
	let selectedToWallet = $derived(
		data.walletList.find((w) => w.id === $form.toWalletId)?.name ?? 'Pilih Dompet Tujuan'
	);
	let selectedCategory = $derived(
		data.categoryList.find((c) => c.id === $form.categoryId)?.name ?? 'Pilih Kategori'
	);

	let filteredCategories = $derived(data.categoryList.filter((c) => c.type === $form.type));
</script>

<div class="space-y-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Transaksi</h1>
		<Dialog.Root bind:open>
			<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
				<Plus class="mr-2 h-4 w-4" /> Catat Transaksi
			</Dialog.Trigger>

			<Dialog.Content class="sm:max-w-106.25">
				<Dialog.Header><Dialog.Title>Tambah Transaksi</Dialog.Title></Dialog.Header>

				<form method="POST" use:enhance class="space-y-4">
					<Tabs.Root value={$form.type} onValueChange={(v) => ($form.type = v as TransactionType)}>
						<Tabs.List class="grid w-full grid-cols-3">
							<Tabs.Trigger value="expense">Keluar</Tabs.Trigger>
							<Tabs.Trigger value="income">Masuk</Tabs.Trigger>
							<Tabs.Trigger value="transfer">Transfer</Tabs.Trigger>
						</Tabs.List>
					</Tabs.Root>
					<input type="hidden" name="type" bind:value={$form.type} />

					<div class="space-y-2">
						<Label>Jumlah (Rp)</Label>
						<Input type="number" name="amount" bind:value={$form.amount} placeholder="0" />
						{#if $errors.amount}<p class="text-xs text-red-500">{$errors.amount}</p>{/if}
					</div>

					<div class="grid grid-cols-1 gap-4">
						<div class="space-y-2">
							<Label>{$form.type === 'transfer' ? 'Dari Dompet' : 'Dompet'}</Label>
							<Select.Root type="single" name="walletId" bind:value={$form.walletId}>
								<Select.Trigger
									class={buttonVariants({
										variant: 'outline',
										class: 'w-full justify-between font-normal'
									})}
								>
									{selectedWallet}
								</Select.Trigger>
								<Select.Content>
									{#each data.walletList as w (w.id)}
										<Select.Item value={w.id} label={w.name} />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						{#if $form.type === 'transfer'}
							<div class="space-y-2">
								<Label>Ke Dompet</Label>
								<Select.Root type="single" name="toWalletId" bind:value={$form.toWalletId}>
									<Select.Trigger
										class={buttonVariants({
											variant: 'outline',
											class: 'w-full justify-between border-dashed border-primary font-normal'
										})}
									>
										{selectedToWallet}
									</Select.Trigger>
									<Select.Content>
										{#each data.walletList.filter((w) => w.id !== $form.walletId) as w (w.id)}
											<Select.Item value={w.id} label={w.name} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{/if}

						{#if $form.type !== 'transfer'}
							<div class="space-y-2">
								<Label>Kategori</Label>
								<Select.Root type="single" name="categoryId" bind:value={$form.categoryId}>
									<Select.Trigger
										class={buttonVariants({
											variant: 'outline',
											class: 'w-full justify-between font-normal'
										})}
									>
										{selectedCategory}
									</Select.Trigger>
									<Select.Content>
										{#each filteredCategories as c (c.id)}
											<Select.Item value={c.id} label={c.name} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{/if}
					</div>

					<div class="space-y-2">
						<Label>Keterangan (Opsional)</Label>
						<Input
							name="description"
							bind:value={$form.description}
							placeholder="Makan siang, dsb"
						/>
					</div>

					<Button type="submit" class="w-full">Simpan Transaksi</Button>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="rounded-md border bg-card">
		{#each data.transactionList as tx (tx.id)}
			<div
				class="flex items-center justify-between border-b p-4 transition-colors last:border-0 hover:bg-muted/50"
			>
				<div class="flex items-center gap-3">
					<div
						class={cn(
							'rounded-full p-2',
							tx.type === 'income'
								? 'bg-green-100 text-green-600'
								: tx.type === 'expense'
									? 'bg-red-100 text-red-600'
									: 'bg-blue-100 text-blue-600'
						)}
					>
						{#if tx.type === 'income'}<ArrowDownLeft class="h-4 w-4" />
						{:else if tx.type === 'expense'}<ArrowUpRight class="h-4 w-4" />
						{:else}💰{/if}
					</div>
					<div>
						<p class="font-medium">{tx.description || tx.category?.name || 'Transfer'}</p>
						<p class="text-xs text-muted-foreground">
							{tx.wallet.name}
							{#if tx.type === 'transfer' && tx.toWalletId}
								→ {data.walletList.find((w) => w.id === tx.toWalletId)?.name}
							{/if}
						</p>
					</div>
				</div>
				<div class="text-right">
					<p
						class={cn(
							'font-bold',
							tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-600' : ''
						)}
					>
						{tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
					</p>
					<p class="text-[10px] text-muted-foreground">
						{new Date(tx.date).toLocaleDateString('id-ID')}
					</p>
				</div>
			</div>
		{:else}
			<div class="p-8 text-center text-muted-foreground">Belum ada transaksi.</div>
		{/each}
	</div>
</div>
