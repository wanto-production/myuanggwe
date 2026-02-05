<script lang="ts">
	import { Menu, Moon, Sun } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { sidebarToggle } from '$lib/stores';
	import { toggleMode } from 'mode-watcher';

	let { user } = $props();

	let isDarkMode = $state(false);

	onMount(() => {
		isDarkMode = document.documentElement.classList.contains('dark');
	});

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		toggleMode();
	}
</script>

<header class="flex h-auto shrink-0 items-center gap-4 border-b-2 bg-background p-3">
	<Button
		disabled={!user}
		onclick={() => sidebarToggle.update((v) => !v)}
		size="icon"
		variant="outline"
	>
		<Menu class="h-5 w-5" />
		<span class="sr-only">Toggle Menu</span>
	</Button>

	<!-- Main header content -->
	<div class="flex w-full items-center justify-between gap-2">
		<a href="/" class="mr-auto text-lg font-semibold"> MyUangGwe </a>

		<div class="flex items-center gap-2">
			<!-- Dark mode toggle - ALWAYS RENDERED -->
			<Button onclick={toggleDarkMode} variant="ghost" size="icon">
				{#if isDarkMode}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</Button>

			<!-- {#if !user} -->
			<!-- 	<Button variant="ghost" href="/login">Sign In</Button> -->
			<!-- 	<Button href="/register">Sign Up</Button> -->
			<!-- {/if} -->
		</div>
	</div>
</header>
