<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { walletSchema } from '$lib/schemas.js';
	import { createForm } from '@tanstack/svelte-form';
	import { client } from '$lib/eden';
	import { useQueryClient } from '@tanstack/svelte-query';

	const queryClient = useQueryClient();

	const walletsForm = createForm(() => ({
		defaultValues: {
			name: '',
			type: 'cash',
			balance: 2000
		},
		validator: {
			onsubmit: walletSchema
		},
		onSubmit: async ({ value }) => {
			const res = await client.wallets.create.post(value);
			await queryClient.invalidateQueries({ queryKey: ['wallets'] });

			if (res.data?.message) toast.message(res.data.message);
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
			{/snippet}
		</walletsForm.Field>
	</div>

	<walletsForm.Subscribe selector={(state) => state.isSubmitting}>
		{#snippet children(isSubmitting)}
			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Dompet'}
			</Button>
		{/snippet}
	</walletsForm.Subscribe>
</form>
