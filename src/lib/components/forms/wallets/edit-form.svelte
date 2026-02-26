<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { walletSchema } from '$lib/schemas.js';
	import { client } from '$lib/eden';
	import SheetLayoutForm from '$lib/components/utils/SheetLayoutForm.svelte';

	let { wallet, open = $bindable(false) } = $props();

	const queryClient = useQueryClient();

	//@ts-ignore
	const walletsForm = createForm(() => ({
		defaultValues: {
			name: wallet.name!,
			type: wallet.type!,
			balance: wallet.balance!
		},
		validators: {
			onChange: walletSchema,
			onSubmit: walletSchema
		},
		onSubmit: async ({ value }) => {
			const res = await client.wallets.edit({ id: wallet.id }).put(value);
			await queryClient.invalidateQueries({ queryKey: ['wallets'] });

			if (res.data?.message) {
				toast.success(res.data.message);
				open = false;
			}
		}
	}));

	const typeOptions = [
		{ value: 'cash', label: 'Tunai (Cash)' },
		{ value: 'bank', label: 'Bank / E-Wallet' },
		{ value: 'credit_card', label: 'Kartu Kredit' }
	] as const;
</script>

<SheetLayoutForm
	bind:open
	label={`Edit ${wallet.name}`}
	descriptions={`Ubah informasi dompet ${wallet.name}`}
>
	{#snippet form()}
		<form
			class="space-y-4 p-4"
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
							<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
						{/if}
					{/snippet}
				</walletsForm.Field>
			</div>

			<div class="space-y-2">
				<walletsForm.Field name="balance">
					{#snippet children(field)}
						<Label for={field.name}>Saldo</Label>
						<Input
							id={field.name}
							type="number"
							value={field.state.value}
							onblur={() => field.handleBlur()}
							oninput={(e: Event) => {
								const target = e.target as HTMLInputElement;
								field.handleChange(Number(target.value));
							}}
							placeholder="0"
							min="0"
						/>
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
						{/if}
					{/snippet}
				</walletsForm.Field>
			</div>

			<div class="space-y-2">
				<walletsForm.Field name="type">
					{#snippet children(field)}
						<Label>Tipe</Label>
						<Select.Root
							type="single"
							name="type"
							value={field.state.value}
							onValueChange={field.handleChange}
						>
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
						{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
					</Button>
				{/snippet}
			</walletsForm.Subscribe>
		</form>
	{/snippet}
</SheetLayoutForm>
