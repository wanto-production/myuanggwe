<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data } = $props();

	// Tambahkan dataType: 'json' jika ingin mengirim data via fetch,
	// tapi secara default Form POST butuh atribut 'name'.
	const { form, errors, enhance } = superForm(data.form);
</script>

<svelte:head>
	<title>Daftar - MyUangGwe | Aplikasi Pengelola Keuangan</title>
	<meta name="description" content="Daftar akun MyUangGwe untuk mulai mengelola keuangan pribadi dan bisnis Anda. Dapatkan akses ke dashboard keuangan, laporan, dan alat penganggaran." />
	<meta name="keywords" content="daftar, registrasi, akun keuangan, pengelolaan keuangan, aplikasi keuangan" />
</svelte:head>

<div class="flex h-screen items-center justify-center">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Register</Card.Title>
			<Card.Description>Enter your information to create an account.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-4">
			<form method="POST" use:enhance class="grid gap-4">
				<div class="grid gap-2">
					<Label for="name">Name</Label>
					<Input id="name" name="name" placeholder="John Doe" bind:value={$form.name} />
					{#if $errors.name}
						<p class="text-sm text-red-500">{$errors.name}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="m@example.com"
						bind:value={$form.email}
					/>
					{#if $errors.email}
						<p class="text-sm text-red-500">{$errors.email}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="********"
						bind:value={$form.password}
					/>
					{#if $errors.password}
						<p class="text-sm text-red-500">{$errors.password}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="passwordConfirm">Confirm Password</Label>
					<Input
						id="passwordConfirm"
						name="passwordConfirm"
						type="password"
						placeholder="********"
						bind:value={$form.passwordConfirm}
					/>
					{#if $errors.passwordConfirm}
						<p class="text-sm text-red-500">{$errors.passwordConfirm}</p>
					{/if}
				</div>

				<Button type="submit" class="w-full">Create account</Button>
			</form>
		</Card.Content>
		<Card.Footer class="text-center">
			<p class="text-sm">
				Already have an account?
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/login" class="underline hover:text-primary">Login</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
