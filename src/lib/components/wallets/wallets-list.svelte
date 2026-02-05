<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Banknote, CreditCard, Landmark, MoreVertical } from 'lucide-svelte';
	import EditForm from '$lib/components/wallets/edit-form.svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/eden.js';
	import { toast } from 'svelte-sonner';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import DropdownAction from '$lib/components/DropdownAction.svelte';

	let { data } = $props();

	let sheet_open = $state(false);

	const icons = {
		bank: Landmark,
		credit_card: CreditCard,
		cash: Banknote
	};

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
			{@const Icon = icons[wallet.type as keyof typeof icons] || Banknote}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">{wallet.name}</Card.Title>
					<div class="flex items-center gap-2">
						<i class="rounded-md border-2 p-2">
							<Icon class="h-4 w-4" />
						</i>
						<DropdownAction
							onDelete={() => deleteWalletMutation.mutate({ id: wallet.id })}
							onUpdate={() => (sheet_open = !sheet_open)}
						>
							{#snippet trigger({ props })}
								<Button variant="outline" size="icon" {...props}>
									<MoreVertical class="h-4 w-4" />
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
