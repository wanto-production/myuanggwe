<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Wallet,
		ArrowLeftRight,
		ChartPie,
		Users,
		Settings,
		ChevronDown,
		Plus,
		User,
		ChevronLeft,
		Layers, // Tambahkan ini untuk icon kategori
		LogOut
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { authClient } from '$lib/auth-client';
	import { invalidate } from '$app/navigation';
	import { buttonVariants } from '$lib/components/ui/button';
	import type { User as UserType } from 'better-auth';
	import type { OrganizationType } from '$lib/server/db/schema';
	import { sidebarToggle } from '$lib/stores';

	const menuItems = [
		{ title: 'Dashboard', icon: ChartPie, href: '/dashboard' },
		{ title: 'Transaksi', icon: ArrowLeftRight, href: '/transactions' },
		{ title: 'Dompet', icon: Wallet, href: '/wallets' },
		{ title: 'Kategori', icon: Layers, href: '/categories' } // Menu Baru
	];

	let { activeOrg, organizations, user } = $props<{
		activeOrg: OrganizationType | null;
		organizations: OrganizationType[];
		user: UserType;
	}>();

	let isPopoverOpen = $state(false);

	let isMinimized = $derived($sidebarToggle);

	async function handleSwitch(id: string | null) {
		await authClient.organization.setActive({ organizationId: id });
		isPopoverOpen = false;
		await invalidate('layout:data');
	}

	async function handleLogout() {
		await authClient.signOut();
		await invalidate('layout:data');
	}
</script>

<aside
	class={cn(
		'relative flex h-screen flex-col overflow-x-hidden border-r bg-card transition-all duration-300 ease-in-out max-sm:fixed',
		isMinimized ? 'w-17.5 max-sm:w-0' : 'w-64'
	)}
>
	<!-- <Button -->
	<!-- 	variant="ghost" -->
	<!-- 	size="icon" -->
	<!-- 	onclick={() => (isMinimized = !isMinimized)} -->
	<!-- 	class="absolute top-10 -right-3 z-20 hidden h-6 w-6 rounded-full border bg-background md:flex" -->
	<!-- > -->
	<!-- 	<ChevronLeft class={cn('h-4 w-4 transition-transform', isMinimized && 'rotate-180')} /> -->
	<!-- </Button> -->

	<div class="flex justify-evenly p-3">
		<Popover.Root bind:open={isPopoverOpen}>
			<Popover.Trigger
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
							<User size={14} />
						</div>
						{#if !isMinimized}
							<span class="truncate text-left text-xs font-semibold"> Personal </span>
						{/if}
					{:else}
						<div
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-blue-600 text-white"
						>
							<Users size={14} />
						</div>
						{#if !isMinimized}
							<span class="truncate text-left text-xs font-semibold">
								{activeOrg.name}
							</span>
						{/if}
					{/if}
				</div>
				{#if !isMinimized}
					<ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
				{/if}
			</Popover.Trigger>
			<Popover.Content class="w-64 p-0" align="start">
				<Command.Root>
					<Command.List>
						<Command.Group heading="Akun">
							<Command.Item onSelect={() => handleSwitch(null)}>
								<User class="mr-2 h-4 w-4" />
								<span>Personal</span>
							</Command.Item>
						</Command.Group>
						<Separator />
						<Command.Group heading="Organisasi">
							{#each organizations as org (org.id)}
								<Command.Item onSelect={() => handleSwitch(org.id)}>
									<Users class="mr-2 h-4 w-4" />
									<span>{org.name}</span>
								</Command.Item>
							{/each}
							<Command.Item>
								<Plus class="mr-2 h-4 w-4" />
								<span class="font-medium text-blue-600">Buat Grup Baru</span>
							</Command.Item>
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		<Button class="sm:hidden" variant="outline" onclick={() => sidebarToggle.update((v) => !v)}>
			<ChevronLeft class={isMinimized ? 'rotate-180' : ''} />
		</Button>
	</div>

	<Separator />

	<nav class="flex-1 space-y-2 p-3">
		{#each menuItems as item (item.href)}
			<a
				href={item.href}
				class={cn(
					'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
					isMinimized && 'justify-center px-0'
				)}
			>
				<item.icon size={20} />
				{#if !isMinimized}
					<span class="truncate">{item.title}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="mt-auto border-t p-3">
		{#if user}
			<Button onclick={handleLogout} variant="destructive" class="w-full p-2">
				<LogOut />
				{#if !isMinimized}
					logout
				{/if}
			</Button>
		{/if}
		<div
			class={cn(
				'flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-accent/50',
				isMinimized && 'justify-center px-0'
			)}
		>
			<div
				class="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-background"
			>
				<img src="https://avatar.iran.liara.run/public/boy" alt="avatar" />
			</div>
			{#if !isMinimized}
				<div class="flex flex-1 flex-col overflow-hidden text-left text-xs">
					<span class="truncate font-bold text-foreground">{user.name}</span>
					<span class="truncate text-muted-foreground">{user.email}</span>
				</div>
				<Button variant="ghost" size="icon" class="h-8 w-8">
					<Settings size={16} />
				</Button>
			{/if}
		</div>
	</div>
</aside>
