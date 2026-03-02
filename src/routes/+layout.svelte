<script lang="ts">
	import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import Header from '$lib/components/layout/Header.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { ModeWatcher } from 'mode-watcher';

	let { children, data } = $props();

	let user = $derived(data.user);
	let activeOrg = $derived(data.activeOrg as any);
	let organizations = $derived((data.organizations || []) as any[]);

	let isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
	
	// Canonical URL Construction
	const baseUrl = 'https://myuanggwe.vercel.app';
	let canonicalUrl = $derived(`${baseUrl}${page.url.pathname === '/' ? '' : page.url.pathname}`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={canonicalUrl} />

	<meta name="google-site-verification" content="bWRaoFVlyB345Wietszb9IvK4x9MIN9hvtEA9ChIgoQ" />

  <title>MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis</title>
	<meta
		name="description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran secara real-time."
	/>
	<meta
		name="keywords"
		content="pengelola keuangan, aplikasi keuangan, pencatatan pengeluaran, manajemen anggaran, keuangan pribadi, keuangan bisnis, expense tracker, personal finance app"
	/>
	<meta name="author" content="wanto-production" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content="MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis" />
	<meta
		property="og:description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran secara real-time."
	/>
	<!-- Open Graph Image (Recommend adding an actual og-image.png to static later) -->
	<!-- <meta property="og:image" content={`${baseUrl}/og-image.png`} /> -->

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={canonicalUrl} />
	<meta
		property="twitter:title"
		content="MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis"
	/>
	<meta
		property="twitter:description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran secara real-time."
	/>
</svelte:head>

<ModeWatcher />
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
				<Header {user} />
				<main class="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
					{@render children()}
        </main>
			</div>
		</div>
	</Tooltip.Provider>
	<SvelteQueryDevtools />
</QueryClientProvider>
