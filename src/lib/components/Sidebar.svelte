<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { cn } from '$lib/utils';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { buttonVariants } from '$lib/components/ui/button';
	import type { User as UserType } from 'better-auth';
	import type { OrganizationType } from '$lib/server/db/schema';
	import { sidebarToggle } from '$lib/stores';
	import { page } from '$app/state';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { invalidateFn } from '$lib/@functions';
	import Lucide from './utils/Lucide.svelte';
	import { client } from '$lib/eden';

	const queryClient = useQueryClient();

	const menuItems = [
		{ title: 'Dashboard', icon: 'ChartPie', href: '/dashboard' },
		{ title: 'Transaksi', icon: 'ArrowLeftRight', href: '/transactions' },
		{ title: 'Dompet', icon: 'Wallet', href: '/wallets' },
		{ title: 'Kategori', icon: 'Layers', href: '/categories' }
	];

	let { activeOrg, organizations, user } = $props<{
		activeOrg: OrganizationType | null;
		organizations: OrganizationType[];
		user: UserType;
	}>();

	let isPopoverOpen = $state(false);
	let isOrgCollapsibleOpen = $state(false);
	let isMinimized = $derived($sidebarToggle);
	let isRoot = $derived(page.url.pathname === '/');

	const switchOrgsMutation = createMutation(() => ({
		mutationKey: ['switch-from', activeOrg],
		mutationFn: async (id: string | null) => {
			// Invalidate React Query cache first
			await invalidateFn(queryClient);

			// Call API
			const orgParam = id || 'personal'; // Use 'personal' keyword for null
			const { data, error } = await client.changeOrgs({ id: orgParam }).put();

			if (error) {
				throw new Error('Failed to switch organization');
			}

			return data;
		},
		async onSuccess() {
			isPopoverOpen = false;
			toast.success('Organization switched!');

			// Optional: Force reload page to refresh all data
			// window.location.reload()
		},
		async onError(error: any) {
			toast.error(error.message || 'Failed to switch organization');
		}
	}));

	const logoutMutation = createMutation(() => ({
		mutationKey: ['logout'],
		mutationFn: async () => {
			await authClient.signOut();
		},
		onSuccess() {
			goto('/login');
		},
		onError({ message }) {
			toast.error(message);
		}
	}));
</script>

<aside
	class={cn(
		'relative z-10 flex h-screen flex-col overflow-x-hidden border-r bg-card transition-all duration-300 ease-in-out max-sm:fixed',
		isMinimized ? (isRoot ? 'w-0' : 'w-17.5 max-sm:w-0') : 'w-64'
	)}
>
	<!-- Organization Switcher -->
	<div class="flex justify-evenly p-3">
		<Popover.Root bind:open={isPopoverOpen}>
			<Popover.Trigger
				disabled={switchOrgsMutation.isPending}
				class={buttonVariants({
					variant: 'outline',
					class: cn(
						'w-full justify-between overflow-hidden px-2 transition-all max-sm:w-[80%]',
						isMinimized && 'justify-center border-transparent bg-transparent hover:bg-accent'
					)
				})}
			>
				<div class="flex items-center gap-2">
					{#if !activeOrg}
						<div
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground"
						>
							<Lucide name="User" size={14} />
						</div>
						{#if !isMinimized}
							<span class="truncate text-left text-xs font-semibold">Personal</span>
						{/if}
					{:else}
						<div
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-blue-600 text-white"
						>
							<Lucide name="Users" size={14} />
						</div>
						{#if !isMinimized}
							<span class="truncate text-left text-xs font-semibold">
								{activeOrg.name}
							</span>
						{/if}
					{/if}
				</div>
				{#if !isMinimized}
					<Lucide name="ChevronDown" size={16} class="shrink-0 opacity-50" />
				{/if}
			</Popover.Trigger>

			<Popover.Content class="w-64 p-0" align="start">
				<Command.Root>
					<Command.List>
						<Command.Group heading="Akun">
							<Command.Item
								disabled={switchOrgsMutation.isPending}
								onSelect={() => switchOrgsMutation.mutate(null)}
							>
								<Lucide name="User" size={16} class="mr-2" />
								<span>Personal</span>
							</Command.Item>
						</Command.Group>

						<Separator />

						<Command.Group heading="Organisasi">
							{#each organizations as org (org.id)}
								<Command.Item
									disabled={switchOrgsMutation.isPending}
									onSelect={() => switchOrgsMutation.mutate(org.id)}
								>
									<Lucide name="Users" size={16} class="mr-2" />
									<span>{org.name}</span>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		<!-- Mobile Toggle -->
		<Button class="sm:hidden" variant="outline" onclick={() => sidebarToggle.update((v) => !v)}>
			<Lucide name="ChevronLeft" class={cn(isMinimized && 'rotate-180')} />
		</Button>
	</div>

	<Separator />

	<!-- Navigation Menu -->
	<nav class="flex-1 space-y-2 overflow-y-auto p-3">
		{#each menuItems as item (item.href)}
			<a
				href={item.href}
				class={cn(
					'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
					page.url.pathname === item.href && 'bg-accent',
					isMinimized && 'justify-center px-0'
				)}
			>
				<Lucide name={item.icon as any} size={20} />
				{#if !isMinimized}
					<span class="truncate">{item.title}</span>
				{/if}
			</a>
		{/each}

		<!-- Organizations Collapsible -->
		{#if !isMinimized}
			<Collapsible.Root bind:open={isOrgCollapsibleOpen}>
				<Collapsible.Trigger
					class="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent"
				>
					<div class="flex items-center gap-3">
						<Lucide name="Building2" size={20} />
						<span>Organizations</span>
					</div>
					<div class="flex items-center gap-2">
						<Lucide
							name="ChevronRight"
							size={16}
							class={cn('transition-transform', isOrgCollapsibleOpen && 'rotate-90')}
						/>
					</div>
				</Collapsible.Trigger>

				<Collapsible.Content class="space-y-1 pt-1 pl-9">
					<a
						href="/organizations"
						class={cn(
							'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent',
							page.url.pathname === '/organizations' && 'bg-accent'
						)}
					>
						<Lucide name="Plus" size={16} />
						<span>Buat Grup Baru</span>
					</a>

					<a
						href={!activeOrg ? '#' : '/organizations/invitations'}
						class={cn(
							'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent',
							page.url.pathname === '/organizations/invitations' && 'bg-accent'
						)}
					>
						<div class="flex items-center gap-2">
							<Lucide name="Mail" size={16} />
							<span>Invitations</span>
						</div>
					</a>
				</Collapsible.Content>
			</Collapsible.Root>
		{:else}
			<!-- Minimized view - show icon only -->
			<button
				type="button"
				class="flex w-full items-center justify-center rounded-md px-0 py-2 text-sm font-medium transition-all hover:bg-accent"
				onclick={() => {
					isMinimized = false;
					isOrgCollapsibleOpen = true;
				}}
			>
				<Lucide name="Building2" size={20} />
			</button>
		{/if}
	</nav>

	<!-- User Section -->
	<div class="mt-auto border-t p-3">
		{#if user}
			<Button
				onclick={() => logoutMutation.mutate()}
				variant="destructive"
				class="w-full gap-2 p-2"
				disabled={logoutMutation.isPending}
			>
				<Lucide
					name={logoutMutation.isPending ? 'Loader2' : 'LogOut'}
					size={16}
					class={cn(logoutMutation.isPending && 'animate-spin')}
				/>
				{#if !isMinimized}
					<span>Logout</span>
				{/if}
			</Button>
		{/if}

		<div
			class={cn(
				'mt-2 flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-accent/50',
				isMinimized && 'justify-center px-0'
			)}
		>
			{#if !isMinimized}
				<div class="flex flex-1 flex-col overflow-hidden text-left text-xs">
					<span class="truncate font-bold text-foreground">{user.name}</span>
					<span class="truncate text-muted-foreground">{user.email}</span>
				</div>
				<Button variant="ghost" size="icon" class="h-8 w-8">
					<Lucide name="Settings" size={16} />
				</Button>
			{/if}
		</div>
	</div>
</aside>
