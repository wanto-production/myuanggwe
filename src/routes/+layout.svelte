<script lang="ts">
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import * as Tooltip from '$lib/components/ui/tooltip'; // Import Tooltip
	import { Toaster } from '$lib/components/ui/sonner';
	import Header from '$lib/components/Header.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
  import { ModeWatcher } from 'mode-watcher';

	let { children, data } = $props();

	let user = $derived(data.queryClient);
	let activeOrg = $derived(data.activeOrg as any);
	let organizations = $derived((data.organizations || []) as any[]);

	let isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<title>MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis</title>
	<meta
		name="description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran."
	/>
	<meta
		name="keywords"
		content="pengelola keuangan, aplikasi keuangan, pencatatan pengeluaran, manajemen anggaran, keuangan pribadi, keuangan bisnis"
	/>
	<meta name="author" content="wanto-production" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://myuanggwe.vercel.app/" />
	<meta property="og:title" content="MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis" />
	<meta
		property="og:description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran."
	/>

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://myuanggwe.vercel.app/" />
	<meta
		property="twitter:title"
		content="MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis"
	/>
	<meta
		property="twitter:description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran."
	/>

	<!-- Canonical URL -->
	<link rel="canonical" href="https://myuanggwe.vercel.app/" />
</svelte:head>

<ModeWatcher/>
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
	<SvelteQueryDevtools />
</QueryClientProvider>
