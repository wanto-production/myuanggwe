<script lang="ts">
	import { authClient } from '$lib/auth/auth-client';

	let { data } = $props();

	let searchQuery = $state('');

	// Get ALL invitations for current user
	const invitationsQuery = createQuery(() => ({
		queryKey: ['my-invitations'],
		queryFn: async () => {
			const { data: res, error } = await authClient.organization.listInvitations({
				query: {
					organizationId: data.activeOrg?.id
				}
			});
			if (error) {
				throw new Error(error.message || 'Failed to fetch invitations');
			}

			return res;
		}
	}));

	// Filter invitations by search query
	let filteredInvitations = $derived(
		(invitationsQuery.data || []).filter((inv) => {
			if (!searchQuery) return true;
			return inv.organizationId.toLowerCase().includes(searchQuery.toLowerCase());
		})
	);
</script>

<svelte:head>
	<title>My Invitations - MyUangGwe</title>
</svelte:head>

<div class="container mx-auto max-w-6xl py-8">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
				<Lucide name="Mail" size={24} class="text-primary" />
			</div>
			<div>
				<h1 class="text-3xl font-bold">My Invitations</h1>
				<p class="text-muted-foreground">
					{filteredInvitations.length} pending invitation(s)
				</p>
			</div>
		</div>
	</div>

	<!-- Search Bar -->
	<Card.Root class="mb-6">
		<Card.Content class="pt-6">
			<div class="relative">
				<Lucide
					name="Search"
					size={18}
					class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Search by Organization ID..."
					bind:value={searchQuery}
					class="pl-10 font-mono"
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Invitations Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if invitationsQuery.isLoading}
				<div class="flex items-center justify-center py-12">
					<Lucide name="Loader2" size={32} class="animate-spin text-muted-foreground" />
				</div>
			{:else if invitationsQuery.isError}
				<div class="flex flex-col items-center justify-center py-12">
					<Lucide name="AlertCircle" size={48} class="mb-4 text-destructive" />
					<p class="text-lg font-semibold">Failed to load invitations</p>
					<p class="text-sm text-muted-foreground">
						{invitationsQuery.error?.message || 'Please try again'}
					</p>
				</div>
			{:else if filteredInvitations.length === 0}
				<div class="flex flex-col items-center justify-center py-12">
					<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Lucide name="Inbox" size={32} class="text-muted-foreground" />
					</div>
					<h3 class="mb-2 text-lg font-semibold">No invitations found</h3>
					<p class="text-sm text-muted-foreground">
						{searchQuery ? 'Try a different search term' : 'You have no pending invitations'}
					</p>
				</div>
			{:else}
				<div class="rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Invitation ID</Table.Head>
								<Table.Head>Email</Table.Head>
								<Table.Head>Role</Table.Head>
								<Table.Head>Date</Table.Head>
								<Table.Head>Expires</Table.Head>
								<Table.Head>Status</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each filteredInvitations as invitation (invitation.id)}
								<Table.Row>
									<Table.Cell class="font-mono text-sm">
										<div class="flex items-center gap-2">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10"
											>
												<Lucide name="Building2" size={16} class="text-primary" />
											</div>
											<span class="max-w-[200px]">
												{invitation.id}
											</span>
										</div>
									</Table.Cell>

									<Table.Cell class="font-mono text-sm">
										<div class="flex items-center gap-2">
											<span class="max-w-[200px] truncate">
												{invitation.email}
											</span>
										</div>
									</Table.Cell>

									<Table.Cell>
										<Badge variant="outline" class="capitalize">
											{#if invitation.role === 'admin'}
												<Lucide name="Shield" size={12} class="mr-1" />
											{:else}
												<Lucide name="User" size={12} class="mr-1" />
											{/if}
											{invitation.role}
										</Badge>
									</Table.Cell>

									<Table.Cell class="text-muted-foreground">
										{new Date(invitation.createdAt).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</Table.Cell>

									<Table.Cell class="text-muted-foreground">
										{new Date(invitation.expiresAt).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric'
										})}
									</Table.Cell>

									<Table.Cell>
										<Badge variant="secondary" class="capitalize">
											<Lucide name="Clock" size={12} class="mr-1" />
											{invitation.status}
										</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
