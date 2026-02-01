<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { categorySchema } from '$lib/schemas.js';
	import { createForm } from '@tanstack/svelte-form';
	import { client } from '$lib/eden';
	import { useQueryClient } from '@tanstack/svelte-query';
	import SheetLayoutForm from '$lib/components/SheetLayoutForm.svelte';

	let { category, open = $bindable(false) } = $props();

	const queryClient = useQueryClient();

	const categoryForm = createForm(() => ({
		defaultValues: {
			name: category.name as string,
			type: category.type as string,
			icon: category.icon as string
		},
		validators: {
			onChange: categorySchema,
			onSubmit: categorySchema
		},
		onSubmit: async ({ value }) => {
			const res = await client.categories.edit({ id: category.id }).put(value);
			await queryClient.invalidateQueries({ queryKey: ['categories'] });
			if (res.data?.message) {
				toast.success(res.data.message);
				open = false;
			}
		}
	}));

	const typeOptions = [
		{ value: 'income', label: 'Pemasukan' },
		{ value: 'expense', label: 'Pengeluaran' }
	] as const;

	// Daftar icon yang tersedia (sesuaikan dengan kebutuhan)
	const iconOptions = [
		{ value: '🍔', label: '🍔 Makanan' },
		{ value: '🚗', label: '🚗 Transportasi' },
		{ value: '🏠', label: '🏠 Rumah' },
		{ value: '💼', label: '💼 Kerja' },
		{ value: '🎮', label: '🎮 Hiburan' },
		{ value: '🏥', label: '🏥 Kesehatan' },
		{ value: '📚', label: '📚 Pendidikan' },
		{ value: '👕', label: '👕 Pakaian' },
		{ value: '💰', label: '💰 Gaji' },
		{ value: '🎁', label: '🎁 Hadiah' }
	];
</script>

<SheetLayoutForm
	bind:open
	label={`Edit ${category.name}`}
	descriptions={`Ubah informasi kategori ${category.name}`}
>
	{#snippet form()}
		<form
			class="space-y-4 p-4"
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				categoryForm.handleSubmit();
			}}
		>
			<div class="space-y-2">
				<categoryForm.Field name="name">
					{#snippet children(field)}
						<Label for={field.name}>Nama Kategori</Label>
						<Input
							id={field.name}
							type="text"
							value={field.state.value}
							onblur={() => field.handleBlur()}
							oninput={(e: Event) => {
								const target = e.target as HTMLInputElement;
								field.handleChange(target.value);
							}}
							placeholder="Makanan, Transportasi, dll"
						/>
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">{field.state.meta.errors[0]}</p>
						{/if}
					{/snippet}
				</categoryForm.Field>
			</div>

			<div class="space-y-2">
				<categoryForm.Field name="type">
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
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">{field.state.meta.errors[0]}</p>
						{/if}
					{/snippet}
				</categoryForm.Field>
			</div>

			<div class="space-y-2">
				<categoryForm.Field name="icon">
					{#snippet children(field)}
						<Label>Icon</Label>
						<Select.Root
							type="single"
							name="icon"
							value={field.state.value}
							onValueChange={field.handleChange}
						>
							<Select.Trigger
								class={buttonVariants({
									variant: 'outline',
									class: 'w-full justify-between text-left font-normal'
								})}
							>
								{iconOptions.find((i) => i.value === field.state.value)?.label || 'Pilih Icon'}
							</Select.Trigger>
							<Select.Content>
								{#each iconOptions as option (option.value)}
									<Select.Item value={option.value} label={option.label}>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">{field.state.meta.errors[0]}</p>
						{/if}
					{/snippet}
				</categoryForm.Field>
			</div>

			<categoryForm.Subscribe selector={(state) => state.isSubmitting}>
				{#snippet children(isSubmitting)}
					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
					</Button>
				{/snippet}
			</categoryForm.Subscribe>
		</form>
	{/snippet}
</SheetLayoutForm>
