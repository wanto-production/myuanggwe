<script lang="ts">
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import * as Tooltip from '$lib/components/ui/tooltip'; // Import Tooltip
	import { Toaster } from '$lib/components/ui/sonner';
	import Header from '$lib/components/Header.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';

	let { children, data } = $props();

	let user = $derived(data.user);
	let activeOrg = $derived(data.activeOrg as any);
	let organizations = $derived((data.organizations || []) as any[]);

	let isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
	<Toaster />
	<Tooltip.Provider delayDuration={0}>
		<div class="flex h-screen w-full overflow-hidden bg-background">
			{#if user && !isAuthPage}
				<div class="h-full">
					<Sidebar {user} {activeOrg} {organizations} />
				</div>
			{/if}

			<div class="flex min-w-0 flex-1 flex-col">
				<Header {user} {activeOrg} {organizations} />
				<main class="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
					{@render children()}
				</main>
			</div>
		</div>
	</Tooltip.Provider>
</QueryClientProvider>
