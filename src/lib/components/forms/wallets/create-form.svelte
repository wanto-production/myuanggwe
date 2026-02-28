<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { walletSchema } from '$lib/schemas.js';

	let { open = $bindable(false) } = $props();

	const queryClient = useQueryClient();

	const walletsForm = createForm(() => ({
		defaultValues: {
			name: '',
			type: 'cash' as 'cash' | 'bank' | 'credit_card' | null,
			balance: 2000
		},
		validators: {
			onChange: walletSchema,
			onSubmit: walletSchema
		},
		onSubmit: async ({ value }) => {
			const res = await client.wallets.create.post(value);
			await queryClient.invalidateQueries({ queryKey: ['wallets'] });
			if (res.data?.message) toast.message(res.data.message);
			open = false;
		}
	}));

	const typeOptions = [
		{ value: 'cash', label: 'Tunai (Cash)' },
		{ value: 'bank', label: 'Bank / E-Wallet' },
		{ value: 'credit_card', label: 'Kartu Kredit' }
	];
</script>

<form
	class="space-y-4 pt-4"
	onsubmit={(e) => {
		e.preventDefault();
		e.stopPropagation();
		walletsForm.handleSubmit();
	}}
>
	<div class="space-y-2">
		<walletsForm.Field name="name">
			{#snippet children(field)}
				<Label for={field.name}>Nama Dompet</Label>
				<Input
					id={field.name}
					type="text"
					value={field.state.value}
					onblur={() => field.handleBlur()}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement;
						field.handleChange(target.value);
					}}
					placeholder="BCA, Dana, dll"
				/>
				{#if field.state.meta.errors.length > 0}
					<p class="text-sm font-medium text-destructive">
						{field.state.meta.errors[0]?.message}
					</p>
				{/if}
			{/snippet}
		</walletsForm.Field>
	</div>

	<div class="space-y-2">
		<walletsForm.Field name="balance">
			{#snippet children(field)}
				<Label for={field.name}>Saldo Awal</Label>
				<Input
					id={field.name}
					type="number"
					value={field.state.value}
					onblur={() => field.handleBlur()}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement;
						field.handleChange(Number(target.value));
					}}
					placeholder="2000"
				/>
				{#if field.state.meta.errors.length > 0}
					<p class="text-sm font-medium text-destructive">
						{field.state.meta.errors[0]?.message}
					</p>
				{/if}
			{/snippet}
		</walletsForm.Field>
	</div>

	<div class="space-y-2">
		<walletsForm.Field name="type">
			{#snippet children(field)}
				<Label>Tipe</Label>
				<Select.Root type="single" name="type" onValueChange={field.handleChange}>
					<Select.Trigger
						class={buttonVariants({
							variant: 'outline',
							class: 'w-full justify-between text-left font-normal'
						})}
					>
						{typeOptions.find((t) => t.value === field.state.value)?.label}
					</Select.Trigger>
					<Select.Content>
						{#each typeOptions as option (option.value)}
							<Select.Item value={option.value} label={option.label}>
								{option.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				{#if field.state.meta.errors.length > 0}
					<p class="text-sm font-medium text-destructive">
						{field.state.meta.errors[0]?.message}
					</p>
				{/if}
			{/snippet}
		</walletsForm.Field>
	</div>

	<walletsForm.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
		{#snippet children([isSubmitting, canSubmit])}
			<Button type="submit" class="w-full" disabled={isSubmitting || !canSubmit}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Dompet'}
			</Button>
		{/snippet}
	</walletsForm.Subscribe>
</form>
