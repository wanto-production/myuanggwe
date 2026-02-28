<script lang="ts">
	import EditForm from '$lib/components/forms/wallets/edit-form.svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let sheet_open = $state(false);

	const icons = {
		bank: 'Landmark',
		credit_card: 'CreditCard',
		cash: 'Banknote'
	} as const;

	const deleteWalletMutation = createMutation(() => ({
		mutationKey: ['delete-wallet'],
		mutationFn: async ({ id }: { id: string }) => {
			const res = await client.wallets.erase({ id }).delete();
			if (res.data?.message) toast.message(res.data.message);
		},
		onSuccess() {
			data.queryClient.invalidateQueries({ queryKey: ['wallets'] });
		}
	}));

	const walletsQuery = createQuery(() => ({
		queryKey: ['wallets'],
		queryFn: async () => {
			const { data } = await client.wallets.get();
			return data;
		}
	}));

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};
</script>

<div class="grid gap-4 md:grid-cols-3">
	{#if !walletsQuery.isPending}
		{#each walletsQuery.data?.walletList as wallet (wallet.id)}
			<EditForm bind:open={sheet_open} {wallet} />
			{@const iconName = icons[wallet.type as keyof typeof icons] || 'Banknote'}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">{wallet.name}</Card.Title>
					<div class="flex items-center gap-2">
						<i class="rounded-md border-2 p-2">
							<Lucide name={iconName} class="h-4 w-4" />
						</i>
						<DropdownAction
							onDelete={() => deleteWalletMutation.mutate({ id: wallet.id })}
							onUpdate={() => (sheet_open = !sheet_open)}
						>
							{#snippet trigger({ props })}
								<Button variant="outline" size="icon" {...props}>
									<Lucide name="MoreVertical" class="h-4 w-4" />
								</Button>
							{/snippet}
						</DropdownAction>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{formatIDR(wallet.balance)}</div>
					<p class="text-xs text-muted-foreground capitalize">{wallet.type.replace('_', ' ')}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	{:else}
		{#each [1, 2, 3, 4, 5, 6, 7]}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title>
						<Skeleton class="h-4 w-10" />
					</Card.Title>
					<div class="flex items-center gap-2">
						<Skeleton class=" h-8.5 w-8.5" />
						<Skeleton class="h-8.5 w-16" />
						<Skeleton class="h-8.5 w-14" />
					</div>
				</Card.Header>
				<Card.Content>
					<Skeleton class="h-9 w-30" />
					<Skeleton class="mt-2 h-4 w-10" />
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>
