<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { loginSchema } from '$lib/schemas';
	import { authClient } from '$lib/auth/auth-client';
	import { goto, invalidate } from '$app/navigation';
	import Lucide from '$lib/components/utils/Lucide.svelte';

	const loginForm = createForm(() => ({
		defaultValues: {
			email: '',
			password: ''
		},
		validators: {
			onChange: loginSchema,
			onSubmit: loginSchema
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(value, {
				async onError(context) {
					await invalidate('layout:data');
					toast.error(context.error.message);
				},
				async onSuccess() {
					await invalidate('layout:data');
					toast.success('Login successful!');
					goto('/dashboard');
				}
			});
		}
	}));
</script>

<svelte:head>
	<title>Login - MyUangGwe | Financial Management App</title>
	<meta
		name="description"
		content="Sign in to your MyUangGwe account to manage your personal and business finances. Access financial dashboard, reports, and other features."
	/>
	<meta
		name="keywords"
		content="login, sign in, financial account, financial management, financial dashboard"
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Sign In</Card.Title>
			<Card.Description>Enter your email below to sign in to your account.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				class="grid gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					loginForm.handleSubmit();
				}}
			>
				<!-- Email Field -->
				<loginForm.Field name="email">
					{#snippet children(field)}
						<div class="grid gap-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								value={field.state.value}
								onblur={field.handleBlur}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									field.handleChange(target.value);
								}}
								required
								autocomplete="email"
							/>
							{#if field.state.meta.errors.length > 0}
								<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
							{/if}
						</div>
					{/snippet}
				</loginForm.Field>

				<!-- Password Field -->
				<loginForm.Field name="password">
					{#snippet children(field)}
						<div class="grid gap-2">
							<div class="flex items-center justify-between">
								<Label for="password">Password</Label>
								<a href="/forgot-password" class="text-xs underline hover:text-primary">
									Forgot password?
								</a>
							</div>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={field.state.value}
								onblur={field.handleBlur}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									field.handleChange(target.value);
								}}
								required
								autocomplete="current-password"
							/>
							{#if field.state.meta.errors.length > 0}
								<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
							{/if}
						</div>
					{/snippet}
				</loginForm.Field>

				<!-- Submit Button -->
				<loginForm.Subscribe selector={(state) => state.isSubmitting}>
					{#snippet children(isSubmitting)}
						<Button type="submit" class="w-full" disabled={isSubmitting}>
							{#if isSubmitting}
								<Lucide name="Loader2" class="mr-2 h-4 w-4 animate-spin" />
								Signing in...
							{:else}
								Sign In
							{/if}
						</Button>
					{/snippet}
				</loginForm.Subscribe>
			</form>
		</Card.Content>
		<Card.Footer class="text-center">
			<p class="text-sm text-muted-foreground">
				Don't have an account?
				<a href="/register" class="font-medium text-primary underline hover:text-primary/80">
					Sign up
				</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
