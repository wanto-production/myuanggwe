<script lang="ts">
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip'; // Import Tooltip
	import { Button } from '$lib/components/ui/button';
	import { Menu } from 'lucide-svelte';

	let { children, data } = $props();

	let user = $derived(data.user);
	let activeOrg = $derived(data.activeOrg);
	let organizations = $derived(data.organizations || []);

	let isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider delayDuration={0}>
	<div class="flex h-screen w-full overflow-hidden bg-background">
		{#if user && !isAuthPage}
			<div class="hidden h-full md:flex">
				<Sidebar {user} {activeOrg} {organizations} />
			</div>

			<div class="flex min-w-0 flex-1 flex-col">
				<header class="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
					<Sheet.Root>
						<Sheet.Trigger>
							<Button variant="outline" size="icon">
								<Menu class="h-5 w-5" />
							</Button>
						</Sheet.Trigger>
						<Sheet.Content side="left" class="w-72 p-0">
							<Sidebar {user} {activeOrg} {organizations} />
						</Sheet.Content>
					</Sheet.Root>

					<div class="flex-1 overflow-hidden">
						<h2 class="truncate text-sm font-semibold">
							{activeOrg?.name ?? 'Personal Account'}
						</h2>
					</div>
				</header>

				<main class="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
					{@render children()}
				</main>
			</div>
		{:else}
			<main class="flex-1 overflow-y-auto">
				{@render children()}
			</main>
		{/if}
	</div>
</Tooltip.Provider>
