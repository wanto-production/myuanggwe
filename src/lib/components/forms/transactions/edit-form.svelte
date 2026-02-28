<script lang="ts">
	import { transactionSchema } from '$lib/schemas';
	import { toast } from 'svelte-sonner';

  const queryClient = useQueryClient()

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

	type Transaction = {
		id: string;
		amount: number;
		type: TransactionType;
		walletId: string;
		toWalletId: string | null;
		categoryId: string | null;
		description: string | null;
		date: Date;
	};

	let {
		transaction,
		wallets,
		categories,
		open = $bindable(false)
	}: {
		transaction: Transaction;
		wallets: Wallet[];
		categories: Category[];
		open: boolean;
	} = $props();

	//@ts-ignore
	const transactionForm = createForm(() => ({
		defaultValues: {
			type: transaction.type as TransactionType,
			amount: transaction.amount,
			walletId: transaction.walletId,
			toWalletId: transaction.toWalletId || '',
			categoryId: transaction.categoryId || '',
			description: transaction.description || '',
			date: new Date(transaction.date).toISOString().split('T')[0]
		},
		validators: {
			onSubmit: transactionSchema,
			onChange: transactionSchema
		},
		onSubmit: async ({ value }) => {
			try {
				// Transform payload: only include relevant fields
				const payload: any = {
					type: value.type,
					amount: value.amount,
					walletId: value.walletId,
					description: value.description || null,
					date: value.date
				};

				if (value.type === 'transfer') {
					payload.toWalletId = value.toWalletId;
				} else {
					payload.categoryId = value.categoryId;
				}

				const res = await client.transactions.edit({ id: transaction.id }).put(payload);

				if (res.data?.message) {
					toast.success(res.data.message);
					
					await queryClient.invalidateQueries({ queryKey: ['transactions'] });
					await queryClient.invalidateQueries({ queryKey: ['wallets'] });
					
          open = false;
				} else if (res.error) {
					toast.error('Terjadi kesalahan');
				}
			} catch (error) {
				console.error(error);
				toast.error('Terjadi kesalahan');
			}
		}
	}));

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('id-ID');
	};

	let stores = transactionForm.useStore();

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

<SheetLayoutForm
	bind:open
	label={`Edit Transaksi ${formatDate(transaction.date)}`}
	descriptions={`Ubah informasi transaksi tanggal ${formatDate(transaction.date)}`}
>
	{#snippet form()}
		<form
			class="space-y-4 p-4"
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
								{stores.current.values.type === 'transfer' ? 'Dari Dompet' : 'Dompet'}
							</Label>
							<Select.Root
								type="single"
								value={field.state.value}
								onValueChange={field.handleChange}
							>
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

				{#if stores.current.values.type === 'transfer'}
					<!-- To Wallet (for transfer) -->
					<transactionForm.Field name="toWalletId">
						{#snippet children(field)}
							<div class="space-y-2">
								<Label>Ke Dompet</Label>
								<Select.Root
									type="single"
									value={field.state.value}
									onValueChange={field.handleChange}
								>
									<Select.Trigger class="w-full border-dashed border-primary">
										{selectedToWallet}
									</Select.Trigger>
									<Select.Content>
										{#each wallets.filter((w) => w.id !== stores.current.values.walletId) as wallet (wallet.id)}
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
				{:else}
					<!-- Category (for income/expense) -->
					<transactionForm.Field name="categoryId">
						{#snippet children(field)}
							<div class="space-y-2">
								<Label>Kategori</Label>
								<Select.Root
									type="single"
									value={field.state.value}
									onValueChange={field.handleChange}
								>
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
						{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
					</Button>
				{/snippet}
			</transactionForm.Subscribe>
		</form>
	{/snippet}
</SheetLayoutForm>
