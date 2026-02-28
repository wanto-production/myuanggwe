<script lang="ts">
	import { toast } from 'svelte-sonner';
	import EditForm from '$lib/components/forms/categories/edit-form.svelte';

	let open_sheet = $state(false);

	const categoryQuery = createQuery(() => ({
		queryKey: ['category'],
		queryFn: async () => {
			const { data } = await client.categories.get();
			return data;
		}
	}));

	const deleteCategoryMutation = createMutation(() => ({
		mutationKey: ['delete-category'],
		mutationFn: async ({ id }: { id: string }) => {
			const res = await client.categories.remove({ id }).delete();
			console.log(res.data?.message)
      if (res.data?.message) toast.message(res.data.message);
		},
		onSuccess() {
			categoryQuery.refetch();
		}
	}));
</script>

<div class="grid gap-4 md:grid-cols-4">
	{#if !categoryQuery.isPending}
		{#each categoryQuery.data?.categoryList as cat (cat.id)}
			<EditForm category={cat} bind:open={open_sheet} />
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{cat.icon} {cat.name}</Card.Title>
					<div class="flex items-center gap-2">
						{#if cat.type === 'income'}
							<Lucide name="ArrowUpCircle" class="h-4 w-4 text-green-500" />
						{:else}
							<Lucide name="ArrowDownCircle" class="h-4 w-4 text-red-500" />
						{/if}
						<DropdownAction
							onDelete={() => deleteCategoryMutation.mutate({ id: cat.id })}
							onUpdate={() => (open_sheet = !open_sheet)}
						>
							{#snippet trigger({ props })}
								<Button {...props} variant="outline">
									<Lucide name="MoreVertical" />
								</Button>
							{/snippet}
						</DropdownAction>
					</div>
				</Card.Header>
			</Card.Root>
		{/each}
	{:else}
		{#each [0,1,2,3,4]}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">
						<Skeleton class="h-5 w-20" />
					</Card.Title>
					<div class="flex items-center gap-2">
						<Skeleton class="h-5 w-5 rounded-full" />
						<Skeleton class="h-9 w-10" />
					</div>
				</Card.Header>
			</Card.Root>
		{/each}
	{/if}
</div>
