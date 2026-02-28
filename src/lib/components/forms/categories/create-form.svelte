<script lang="ts">
	import { categorySchema } from '$lib/schemas.js';
	import { toast } from 'svelte-sonner';
  
	const queryClient = useQueryClient();

	let { open = $bindable() } = $props();

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			type: 'expense' as 'income' | 'expense',
			icon: '🍔'
		},
		validators: {
			onSubmit: categorySchema,
			onChange: categorySchema
		},
		onSubmit: async ({ value }) => {
			const res = await client.categories.create.post(value);
			queryClient.invalidateQueries({ queryKey: ['category'] });
			if (res.data?.message) toast.message(res.data.message);
			open = false;
			form.reset();
		}
	}));

	const typeOptions = [
		{ value: 'income', label: 'Pemasukan' },
		{ value: 'expense', label: 'Pengeluaran' }
	];

	const iconOptions = [
		{ value: '🍔', label: '🍔 Makanan' },
		{ value: '🚗', label: '🚗 Transportasi' },
		{ value: '🏠', label: '🏠 Rumah' },
		{ value: '💼', label: '💼 Kerja' },
		{ value: '🎮', label: '🎮 Hiburan' },
		{ value: '🏥', label: '🏥 Kesehatan' },
		{ value: '📚', label: '📚 Pendidikan' },
		{ value: '👕', label: '👕 Pakaian' },
		{ value: '✈️', label: '✈️ Perjalanan' },
		{ value: '🛒', label: '🛒 Belanja' },
		{ value: '💰', label: '💰 Gaji' },
		{ value: '🎁', label: '🎁 Hadiah' },
		{ value: '💳', label: '💳 Tagihan' },
		{ value: '🔧', label: '🔧 Perbaikan' },
		{ value: '📱', label: '📱 Teknologi' }
	];
</script>

{#snippet fieldInput(field: any, label: string, placeholder: string)}
	<div class="space-y-2">
		<Label for={field.name}>{label}</Label>
		<Input
			id={field.name}
			name={field.name}
			value={field.state.value}
			oninput={(e) => field.handleChange(e.currentTarget.value)}
			onblur={field.handleBlur}
			{placeholder}
		/>
		{#if field.state.meta.errors.length}
			<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
		{/if}
	</div>
{/snippet}

<form
	onsubmit={(e) => {
		e.preventDefault();
		e.stopPropagation();
		form.handleSubmit();
	}}
	class="space-y-4 pt-2"
>
	<form.Field name="name">
		{#snippet children(field)}
			{@render fieldInput(field, 'Nama Kategori', 'Misal: Makan, Gaji')}
		{/snippet}
	</form.Field>

	<form.Field name="type">
		{#snippet children(field)}
			<div class="space-y-2">
				<Label>Jenis</Label>
				<Select.Root
					type="single"
					value={field.state.value}
					onValueChange={(v) => field.handleChange(v as any)}
				>
					<Select.Trigger
						class={buttonVariants({
							variant: 'outline',
							class: 'w-full justify-between font-normal'
						})}
					>
						{typeOptions.find((t) => t.value === String(field.state.value))?.label}
					</Select.Trigger>
					<Select.Content>
						{#each typeOptions as opt (opt.value)}
							<Select.Item value={opt.value} label={opt.label} />
						{/each}
					</Select.Content>
				</Select.Root>
				{#if field.state.meta.errors.length}
					<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
				{/if}
			</div>
		{/snippet}
	</form.Field>

	<form.Field name="icon">
		{#snippet children(field)}
			<div class="space-y-2">
				<Label>Icon</Label>
				<Select.Root
					type="single"
					value={field.state.value}
					onValueChange={(v) => field.handleChange(v as any)}
				>
					<Select.Trigger
						class={buttonVariants({
							variant: 'outline',
							class: 'w-full justify-between font-normal'
						})}
					>
						{iconOptions.find((i) => i.value === String(field.state.value))?.label || 'Pilih Icon'}
					</Select.Trigger>
					<Select.Content class="max-h-75">
						{#each iconOptions as opt (opt.value)}
							<Select.Item value={opt.value} label={opt.label} />
						{/each}
					</Select.Content>
				</Select.Root>
				{#if field.state.meta.errors.length}
					<p class="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
				{/if}
			</div>
		{/snippet}
	</form.Field>

	<form.Subscribe selector={(state) => state.isSubmitting}>
		{#snippet children(isSubmitting)}
			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
			</Button>
		{/snippet}
	</form.Subscribe>
</form>
