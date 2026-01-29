<script lang="ts">
	import { Menu, Moon, Sun } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { onMount } from 'svelte';
	import { sidebarToggle } from '$lib/stores';

	let { user, activeOrg, organizations } = $props();

	let isDarkMode = $state(false);
	let open = $state(false);

	onMount(() => {
		isDarkMode = document.documentElement.classList.contains('dark');
	});

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

<header class="flex h-auto shrink-0 items-center gap-4 border-b-2 bg-background p-3">
	{#if user}
		<Button onclick={() => sidebarToggle.update((v) => !v)} size="icon" variant="outline">
			<Menu class="h-5 w-5" />
			<span class="sr-only">Toggle Menu</span>
		</Button>
	{/if}

	<!-- Main header content -->
	<div class="flex w-full items-center justify-between gap-2">
		<div class="flex-1 overflow-hidden">
			<h2 class="truncate text-sm font-semibold">
				{activeOrg?.name ?? 'Personal Account'}
			</h2>
		</div>
		{#if !user}
			<a href="/" class="mr-auto text-lg font-semibold"> MyUang </a>
		{/if}

		<div class="flex items-center gap-2">
			<!-- Dark mode toggle - ALWAYS RENDERED -->
			<Button onclick={toggleDarkMode} variant="ghost" size="icon">
				{#if isDarkMode}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</Button>

			{#if !user}
				<Button variant="ghost" href="/login">Sign In</Button>
				<Button href="/register">Sign Up</Button>
			{/if}
		</div>
	</div>
</header>
