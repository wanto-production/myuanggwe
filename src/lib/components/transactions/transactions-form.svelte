<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { transactionSchema } from '$lib/schemas';
	import { toast } from 'svelte-sonner';
	import { client } from '$lib/eden';
	import { invalidate } from '$app/navigation';

	type TransactionType = 'income' | 'expense' | 'transfer';

	type Wallet = {
		id: string;
		name: string;
		type: string;
		balance: number;
	};

	type Category = {
		id: string;
		name: string;
		type: string;
		icon?: string | null;
	};

	let {
		wallets,
		categories
	}: {
		wallets: Wallet[];
		categories: Category[];
	} = $props();

	//@ts-ignore
	const transactionForm = createForm(() => ({
		defaultValues: {
			type: 'expense' as TransactionType,
			amount: 0,
			walletId: '',
			toWalletId: '',
			categoryId: '',
			description: '',
			date: new Date().toISOString().split('T')[0]
		},
		validators: {
			onSubmit: transactionSchema,
			onChange: transactionSchema
		},
		onSubmit: async ({ value }) => {
			try {
				const res = await client.transactions.create.post(value);
				await invalidate('transactions:data');

				if (res.data?.message) toast.message(res.data.message);
			} catch (error) {
				toast.error('Terjadi kesalahan');
			}
		}
	}));

	let stores = transactionForm.useStore();

	// Derived values
	let selectedWallet = $derived(
		wallets.find((w) => w.id === stores.current.values.walletId)?.name || 'Pilih Dompet'
	);

	let selectedToWallet = $derived(
		wallets.find((w) => w.id === stores.current.values.toWalletId)?.name || 'Pilih Dompet Tujuan'
	);

	let selectedCategory = $derived(
		categories.find((c) => c.id === stores.current.values.categoryId)?.name || 'Pilih Kategori'
	);

	let filteredCategories = $derived(
		categories.filter((c) => c.type === stores.current.values.type)
	);
</script>

<form
	class="space-y-4"
	onsubmit={(e) => {
		e.preventDefault();
		e.stopPropagation();
		transactionForm.handleSubmit();
	}}
>
	<!-- Transaction Type Tabs -->
	<transactionForm.Field name="type">
		{#snippet children(field)}
			<Tabs.Root
				value={field.state.value}
				onValueChange={(v) => {
					if (v) field.handleChange(v as TransactionType);
				}}
			>
				<Tabs.List class="grid w-full grid-cols-3">
					<Tabs.Trigger value="expense">Keluar</Tabs.Trigger>
					<Tabs.Trigger value="income">Masuk</Tabs.Trigger>
					<Tabs.Trigger value="transfer">Transfer</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		{/snippet}
	</transactionForm.Field>

	<!-- Amount -->
	<transactionForm.Field name="amount">
		{#snippet children(field)}
			<div class="space-y-2">
				<Label for="amount">Jumlah (Rp)</Label>
				<Input
					id="amount"
					type="number"
					value={field.state.value}
					onblur={field.handleBlur}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement;
						field.handleChange(Number(target.value));
					}}
					placeholder="0"
					min="0"
					required
				/>
				{#if field.state.meta.errors.length > 0}
					<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
				{/if}
			</div>
		{/snippet}
	</transactionForm.Field>

	<!-- Wallet Selection -->
	<div class="grid grid-cols-1 gap-4">
		<transactionForm.Field name="walletId">
			{#snippet children(field)}
				<div class="space-y-2">
					<Label>
						{transactionForm.state.values.type === 'transfer' ? 'Dari Dompet' : 'Dompet'}
					</Label>
					<Select.Root type="single" value={field.state.value} onValueChange={field.handleChange}>
						<Select.Trigger class="w-full">
							{selectedWallet}
						</Select.Trigger>
						<Select.Content>
							{#each wallets as wallet (wallet.id)}
								<Select.Item value={wallet.id} label={wallet.name}>
									{wallet.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if field.state.meta.errors.length > 0}
						<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
					{/if}
				</div>
			{/snippet}
		</transactionForm.Field>

		<!-- To Wallet (for transfer) -->
		{#if transactionForm.state.values.type === 'transfer'}
			<transactionForm.Field name="toWalletId">
				{#snippet children(field)}
					<div class="space-y-2">
						<Label>Ke Dompet</Label>
						<Select.Root type="single" value={field.state.value} onValueChange={field.handleChange}>
							<Select.Trigger class="w-full border-dashed border-primary">
								{selectedToWallet}
							</Select.Trigger>
							<Select.Content>
								{#each wallets.filter((w) => w.id !== transactionForm.state.values.walletId) as wallet (wallet.id)}
									<Select.Item value={wallet.id} label={wallet.name}>
										{wallet.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors.length > 0}
							<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
						{/if}
					</div>
				{/snippet}
			</transactionForm.Field>
		{/if}

		<!-- Category (for income/expense) -->
		{#if transactionForm.state.values.type !== 'transfer'}
			<transactionForm.Field name="categoryId">
				{#snippet children(field)}
					<div class="space-y-2">
						<Label>Kategori</Label>
						<Select.Root type="single" value={field.state.value} onValueChange={field.handleChange}>
							<Select.Trigger class="w-full">
								{selectedCategory}
							</Select.Trigger>
							<Select.Content>
								{#each filteredCategories as category (category.id)}
									<Select.Item value={category.id} label={category.name}>
										{category.icon || ''}
										{category.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors.length > 0}
							<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
						{/if}
					</div>
				{/snippet}
			</transactionForm.Field>
		{/if}
	</div>

	<!-- Description -->
	<transactionForm.Field name="description">
		{#snippet children(field)}
			<div class="space-y-2">
				<Label for="description">Keterangan (Opsional)</Label>
				<Input
					id="description"
					value={field.state.value}
					onblur={field.handleBlur}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement;
						field.handleChange(target.value);
					}}
					placeholder="Makan siang, dsb"
				/>
			</div>
		{/snippet}
	</transactionForm.Field>

	<!-- Date -->
	<transactionForm.Field name="date">
		{#snippet children(field)}
			<div class="space-y-2">
				<Label for="date">Tanggal</Label>
				<Input
					id="date"
					type="date"
					value={field.state.value}
					onblur={field.handleBlur}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement;
						field.handleChange(target.value);
					}}
				/>
			</div>
		{/snippet}
	</transactionForm.Field>

	<!-- Submit Button -->
	<transactionForm.Subscribe selector={(state) => state.isSubmitting}>
		{#snippet children(isSubmitting)}
			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
			</Button>
		{/snippet}
	</transactionForm.Subscribe>
</form>
