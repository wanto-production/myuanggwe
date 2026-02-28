<script lang="ts">
	import { transactionSchema } from '$lib/schemas';
	import { toast } from 'svelte-sonner';

	type TransactionType = 'income' | 'expense' | 'transfer';

	let { open = $bindable(false) } = $props();

	const queryClient = useQueryClient();
  
	// Query wallets
	const walletsQuery = createQuery(() => ({
		queryKey: ['wallets'],
		queryFn: async () => {
			const { data } = await client.wallets.get();
			return data;
		}
	}));

	// Query categories
	const categoriesQuery = createQuery(() => ({
		queryKey: ['categories'],
		queryFn: async () => {
			const { data } = await client.categories.get();
			return data;
		}
	}));

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

				const res = await client.transactions.create.post(payload);

				if (res.data?.message) {
					toast.success(res.data.message);

					// Invalidate queries untuk refresh data
					await queryClient.invalidateQueries({ queryKey: ['transactions'] });
					await queryClient.invalidateQueries({ queryKey: ['wallets'] });

					open = false;
					transactionForm.reset();
				} else if (res.error) {
					toast.error('Terjadi kesalahan');
				}
			} catch (error) {
				console.error(error);
				toast.error('Terjadi kesalahan');
			}
		}
	}));

	let stores = transactionForm.useStore();

	// Derived data from queries
	let wallets = $derived(walletsQuery.data?.walletList || []);
	let categories = $derived(categoriesQuery.data?.categoryList || []);
	let isLoadingData = $derived(walletsQuery.isLoading || categoriesQuery.isLoading);

	// Derived values for selects
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

{#if isLoadingData}
	<div class="p-4 text-center text-muted-foreground">Memuat data...</div>
{:else}
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
							disabled={walletsQuery.isPending}
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
              disabled={categoriesQuery.isPending}
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
					{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
				</Button>
			{/snippet}
		</transactionForm.Subscribe>
	</form>
{/if}
