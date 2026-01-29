<svelte:head>
	<title>MyUangGwe - Aplikasi Pengelola Keuangan Pribadi & Bisnis</title>
	<meta
		name="description"
		content="MyUangGwe adalah aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran, pendapatan, dan mengatur anggaran."
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="mb-6 text-center text-3xl font-bold">Selamat Datang di MyUangGwe</h1>
	<p class="mb-8 text-center text-lg">
		Aplikasi pengelola keuangan pribadi dan bisnis yang mudah digunakan untuk mencatat pengeluaran,
		pendapatan, dan mengatur anggaran.
	</p>

	<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
			<h2 class="mb-3 text-xl font-semibold">Pencatatan Transaksi</h2>
			<p>Catat semua transaksi keuanganmu dengan cepat dan mudah.</p>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
			<h2 class="mb-3 text-xl font-semibold">Laporan Keuangan</h2>
			<p>Dapatkan laporan keuangan yang jelas dan terperinci.</p>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
			<h2 class="mb-3 text-xl font-semibold">Anggaran</h2>
			<p>Atur dan pantau anggaranmu untuk mencapai tujuan finansial.</p>
		</div>
	</div>

	<div class="mt-12 text-center">
		<a
			href="/login"
			class="inline-block rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition duration-300 hover:bg-blue-700"
		>
			Mulai Sekarang
		</a>
	</div>
</div>
