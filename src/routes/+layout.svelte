<script lang="ts">
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Menu } from 'lucide-svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	// Ambil data langsung dari props tanpa casting di variabel antara
	// Kita gunakan data.user dkk langsung di template agar TS melakukan inferensi lokal
	let { children, data } = $props();

	let isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

<Tooltip.Provider delayDuration={0}>
	<div class="flex h-screen w-full overflow-hidden bg-background">
		{#if data.user && !isAuthPage}
			<div class="hidden h-full md:flex">
				<Sidebar
					user={data.user as any}
					activeOrg={data.activeOrg as any}
					organizations={(data.organizations as any) ?? []}
				/>
			</div>

			<div class="flex min-w-0 flex-1 flex-col">
				<header class="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
					<Sheet.Root>
						<Sheet.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon">
									<Menu class="h-5 w-5" />
								</Button>
							{/snippet}
						</Sheet.Trigger>
						<Sheet.Content side="left" class="w-72 p-0">
							<Sidebar
								user={data.user as any}
								activeOrg={data.activeOrg as any}
								organizations={(data.organizations as any) ?? []}
							/>
						</Sheet.Content>
					</Sheet.Root>

					<div class="flex-1 overflow-hidden">
						<h2 class="truncate text-sm font-semibold">
							{data.activeOrg?.name ?? 'Personal Account'}
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
