<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import * as Select from '$lib/components/ui/select';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { categorySchema } from '$lib/schemas.js';
	import { client } from '$lib/eden.js';
	import { toast } from 'svelte-sonner';
	import { invalidate } from '$app/navigation';

	let { open = $bindable() } = $props();

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			type: 'expense' as 'income' | 'expense'
		},
		validators: {
			onSubmit: categorySchema
		},
		onSubmit: async ({ value }) => {
			const res = await client.categories.create.post(value);
			invalidate('categories:data');

			if (res.data?.message) toast.message(res.data.message);

			open = false;
			form.reset();
		}
	}));

	const typeOptions = [
		{ value: 'income', label: 'Pemasukan' },
		{ value: 'expense', label: 'Pengeluaran' }
	];

	let selectedLabel = $derived.by(() => {
		const type = form.useStore((state) => state.values.type);
		return typeOptions.find((t) => t.value === String(type))?.label;
	});
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
			<p class="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
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
						{selectedLabel}
					</Select.Trigger>
					<Select.Content>
						{#each typeOptions as opt (opt.value)}
							<Select.Item value={opt.value} label={opt.label} />
						{/each}
					</Select.Content>
				</Select.Root>
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
