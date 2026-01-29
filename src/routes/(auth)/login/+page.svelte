<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data } = $props();

	// enhance memastikan login berjalan tanpa reload halaman (SPA feel)
	const { form, errors, enhance } = superForm(data.form);
</script>

<svelte:head>
	<title>Login - MyUangGwe | Aplikasi Pengelola Keuangan</title>
	<meta name="description" content="Masuk ke akun MyUangGwe Anda untuk mengelola keuangan pribadi dan bisnis. Akses dashboard keuangan, laporan, dan fitur-fitur lainnya." />
	<meta name="keywords" content="login, masuk, akun keuangan, pengelolaan keuangan, dashboard keuangan" />
</svelte:head>

<div class="flex h-screen items-center justify-center">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Login</Card.Title>
			<Card.Description>Enter your email below to login to your account.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-4">
			<form method="POST" use:enhance class="grid gap-4">
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
					<div class="flex items-center justify-between">
						<Label for="password">Password</Label>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href="/forgot-password" class="text-xs underline hover:text-primary"
							>Forgot password?</a
						>
					</div>
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

				<Button type="submit" class="w-full">Login</Button>
			</form>
		</Card.Content>
		<Card.Footer class="text-center">
			<p class="text-sm">
				Don't have an account?
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/register" class="underline hover:text-primary">Register</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
