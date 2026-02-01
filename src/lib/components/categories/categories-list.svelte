<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpCircle, ArrowDownCircle, MoreVertical } from 'lucide-svelte';
	import DropdownAction from '$lib/components/DropdownAction.svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import { client } from '$lib/eden.js';
	import { toast } from 'svelte-sonner';
	import { invalidate } from '$app/navigation';
	import EditForm from '$lib/components/categories/edit-form.svelte';

	let { data } = $props();

	let open_sheet = $state(false);

	const deleteCategoryMutation = createMutation(() => ({
		mutationKey: ['delete-category'],
		mutationFn: async ({ id }: { id: string }) => {
			const res = await client.categories.remove({ id }).delete();
			await invalidate('categories:data');

			if (res.data?.message) toast.message(res.data.message);
		}
	}));
</script>

<div class="grid gap-4 md:grid-cols-4">
	{#each data.categoryList as cat (cat.id)}
		<EditForm category={cat} bind:open={open_sheet} />
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{cat.icon} {cat.name}</Card.Title>
				<div class="flex items-center gap-2">
					{#if cat.type === 'income'}
						<ArrowUpCircle class="h-4 w-4 text-green-500" />
					{:else}
						<ArrowDownCircle class="h-4 w-4 text-red-500" />
					{/if}
					<DropdownAction
						onDelete={() => deleteCategoryMutation.mutate({ id: cat.id })}
						onUpdate={() => (open_sheet = !open_sheet)}
					>
						{#snippet trigger({ props })}
							<Button {...props} variant="outline">
								<MoreVertical />
							</Button>
						{/snippet}
					</DropdownAction>
				</div>
			</Card.Header>
		</Card.Root>
	{/each}
</div>
