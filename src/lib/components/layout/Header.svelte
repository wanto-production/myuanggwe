<script lang="ts">
	import { toggleMode } from 'mode-watcher';
  import { sidebarStore } from '$lib/stores/sidebar';

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
		onclick={() => sidebarStore.update((v) => !v)}
		size="icon"
		variant="outline"
	>
		<Lucide name="Menu" class="h-5 w-5" />
		<span class="sr-only">Toggle Menu</span>
	</Button>

	<!-- Main header content -->
	<div class="flex w-full items-center justify-between gap-2">
		<a href="/" class="mr-auto text-lg font-semibold"> MyUangGwe </a>

		<div class="flex items-center gap-2">
			<!-- Dark mode toggle - ALWAYS RENDERED -->
			<Button onclick={toggleDarkMode} variant="ghost" size="icon">
				{#if isDarkMode}
					<Lucide name="Sun" class="h-5 w-5" />
				{:else}
					<Lucide name="Moon" class="h-5 w-5" />
				{/if}
			</Button>

			<!-- {#if !user} -->
			<!-- 	<Button variant="ghost" href="/login">Sign In</Button> -->
			<!-- 	<Button href="/register">Sign Up</Button> -->
			<!-- {/if} -->
		</div>
	</div>
</header>
