<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { goto, invalidate } from '$app/navigation';

	const queryClient = useQueryClient();

	let memberToRemove = $state<{ id: string; name: string } | null>(null);
	let isDeleteDialogOpen = $state(false);

	const manageQuery = createQuery(() => ({
		queryKey: ['manage-orgs'],
		queryFn: async () => {
			const { data, error } = await client['manage-orgs'].get();
			if (error) throw error;
			return data;
		}
	}));

	const removeMember = createMutation(() => ({
		mutationFn: async (id: string) => {
			const { data, error } = await client['manage-orgs'].members({ id }).delete();
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['manage-orgs'] });
			toast.success('Member removed');
			memberToRemove = null;
		},
		onError: (err) => {
			toast.error(err.message || 'Failed to remove member');
		}
	}));

	const updateRole = createMutation(() => ({
		mutationFn: async ({ id, role }: { id: string; role: string }) => {
			const { data, error } = await client['manage-orgs'].members({ id }).role.put({ role });
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['manage-orgs'] });
			toast.success('Role updated');
		},
		onError: (err) => {
			toast.error(err.message || 'Failed to update role');
		}
	}));

	const deleteOrg = createMutation(() => ({
		mutationFn: async () => {
			const { data, error } = await client['manage-orgs'].delete();
			if (error) throw error;
			await invalidate('layout:data');
			await invalidateFn(queryClient);
			return data;
		},
		onSuccess: async () => {
			toast.success('Organization deleted successfully');
			goto('/dashboard');
		},
		onError: (err) => {
			toast.error(err.message || 'Failed to delete organization');
		}
	}));

	const isOwner = $derived(manageQuery.data?.currentUserRole === 'owner');
</script>

<div class="container mx-auto max-w-4xl space-y-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Organization Management</h1>
		{#if manageQuery.data?.org}
			<Badge variant="outline" class="px-3 py-1 text-sm">
				Active: {manageQuery.data.org.name}
			</Badge>
		{/if}
	</div>

	{#if manageQuery.isLoading}
		<div class="flex h-64 items-center justify-center">
			<Lucide name="Loader2" class="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	{:else if !manageQuery.data?.org}
		<Card.Root class="border-dashed bg-muted/50">
			<Card.Content class="flex flex-col items-center justify-center space-y-4 py-12 text-center">
				<Lucide name="Building2" class="h-12 w-12 text-muted-foreground/50" />
				<div class="space-y-2">
					<h2 class="text-xl font-semibold">No Organization Active</h2>
					<p class="max-w-sm text-muted-foreground">
						Please switch to an organization context to manage its members and settings.
					</p>
				</div>
				<Button variant="outline" href="/organizations">Go to Organizations</Button>
			</Card.Content>
		</Card.Root>
	{:else if !isOwner}
		<Card.Root class="border-destructive/20 bg-destructive/5">
			<Card.Content
				class="flex flex-col items-center justify-center space-y-4 py-12 text-center text-destructive"
			>
				<Lucide name="ShieldAlert" class="h-12 w-12" />
				<div class="space-y-2">
					<h2 class="text-xl font-semibold">Access Restricted</h2>
					<p class="max-w-sm text-destructive/80">
						You must be an <strong>Owner</strong> of this organization to manage members and settings.
					</p>
				</div>
				<Button
					variant="outline"
					class="border-destructive/20 hover:bg-destructive/10"
					href="/dashboard"
				>
					Back to Dashboard
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>Members</Card.Title>
				<Card.Description>Manage who has access to this organization.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each manageQuery.data.members as member}
							<Table.Row>
								<Table.Cell class="font-medium">{member.user.name}</Table.Cell>
								<Table.Cell>{member.user.email}</Table.Cell>
								<Table.Cell>
									<Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
										{member.role}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if member.role !== 'owner'}
										<div class="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="sm"
												onclick={() =>
													updateRole.mutate({
														id: member.id,
														role: member.role === 'admin' ? 'member' : 'admin'
													})}
												disabled={updateRole.isPending}
											>
												<Lucide
													name={member.role === 'admin' ? 'ArrowDown' : 'ArrowUp'}
													class="mr-2 h-4 w-4"
												/>
												{member.role === 'admin' ? 'Demote' : 'Promote'}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												class="text-destructive hover:bg-destructive/10 hover:text-destructive"
												onclick={() => {
													memberToRemove = { id: member.id, name: member.user.name };
												}}
												disabled={removeMember.isPending}
											>
												<Lucide name="UserMinus" class="h-4 w-4" />
											</Button>
										</div>
									{:else}
										<span class="text-xs text-muted-foreground italic">Owner</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-destructive/50 bg-destructive/5">
			<Card.Header>
				<Card.Title class="text-destructive">Danger Zone</Card.Title>
				<Card.Description>Irreversible actions for your organization.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<h4 class="font-medium">Delete Organization</h4>
						<p class="text-sm text-muted-foreground">
							This will permanently delete the organization and all its data.
						</p>
					</div>
					<Button
						variant="destructive"
						onclick={() => (isDeleteDialogOpen = true)}
						disabled={deleteOrg.isPending}
					>
						{#if deleteOrg.isPending}
							<Lucide name="Loader2" class="mr-2 h-4 w-4 animate-spin" />
							Deleting...
						{:else}
							Delete Organization
						{/if}
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Remove Member Dialog -->
		<Dialog.Root open={!!memberToRemove} onOpenChange={(open) => !open && (memberToRemove = null)}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Remove Member</Dialog.Title>
					<Dialog.Description>
						Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from this organization?
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (memberToRemove = null)}>Cancel</Button>
					<Button
						variant="destructive"
						onclick={() => memberToRemove && removeMember.mutate(memberToRemove.id)}
						disabled={removeMember.isPending}
					>
						{#if removeMember.isPending}
							<Lucide name="Loader2" class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Remove Member
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Delete Organization Dialog -->
		<Dialog.Root bind:open={isDeleteDialogOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title class="text-destructive">Delete Organization</Dialog.Title>
					<Dialog.Description>
						<div class="space-y-3">
							<p>CRITICAL ACTION: Are you absolutely sure you want to delete this organization?</p>
							<div class="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
								Warning: All wallets, transactions, and categories associated with this organization
								will be PERMANENTLY lost.
							</div>
						</div>
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (isDeleteDialogOpen = false)}>Cancel</Button>
					<Button
						variant="destructive"
						onclick={() => deleteOrg.mutate()}
						disabled={deleteOrg.isPending}
					>
						{#if deleteOrg.isPending}
							<Lucide name="Loader2" class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Permanently Delete
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
