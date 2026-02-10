<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { registerSchema } from '$lib/schemas';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidate } from '$app/navigation';

	const registerForm = createForm(() => ({
		defaultValues: {
			name: '',
			email: '',
			password: '',
			passwordConfirm: ''
		},
		validators: {
			onChange: registerSchema,
			onSubmit: registerSchema
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					name: value.name,
					email: value.email,
					password: value.password
				},
				{
					async onError(context) {
						await invalidate('layout:data');
						toast.error(context.error.message);
					},
					async onSuccess() {
						await invalidate('layout:data');
						toast.success('Account created successfully!');
						goto('/dashboard');
					}
				}
			);
		}
	}));
</script>

<svelte:head>
	<title>Sign Up - MyUangGwe | Financial Management App</title>
	<meta
		name="description"
		content="Create a MyUangGwe account to start managing your personal and business finances. Get access to financial dashboard, reports, and budgeting tools."
	/>
	<meta
		name="keywords"
		content="sign up, register, financial account, financial management, finance app"
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Sign Up</Card.Title>
			<Card.Description>Enter your information to create an account.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				class="grid gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					registerForm.handleSubmit();
				}}
			>
				<!-- Name Field -->
				<registerForm.Field name="name">
					{#snippet children(field)}
						<div class="grid gap-2">
							<Label for="name">Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="John Doe"
								value={field.state.value}
								onblur={field.handleBlur}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									field.handleChange(target.value);
								}}
								required
								autocomplete="name"
							/>
							{#if field.state.meta.errors.length > 0}
								<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
							{/if}
						</div>
					{/snippet}
				</registerForm.Field>

				<!-- Email Field -->
				<registerForm.Field name="email">
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
				</registerForm.Field>

				<!-- Password Field -->
				<registerForm.Field name="password">
					{#snippet children(field)}
						<div class="grid gap-2">
							<Label for="password">Password</Label>
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
								autocomplete="new-password"
							/>
							{#if field.state.meta.errors.length > 0}
								<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
							{/if}
						</div>
					{/snippet}
				</registerForm.Field>

				<!-- Confirm Password Field -->
				<registerForm.Field name="passwordConfirm">
					{#snippet children(field)}
						<div class="grid gap-2">
							<Label for="passwordConfirm">Confirm Password</Label>
							<Input
								id="passwordConfirm"
								type="password"
								placeholder="••••••••"
								value={field.state.value}
								onblur={field.handleBlur}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									field.handleChange(target.value);
								}}
								required
								autocomplete="new-password"
							/>
							{#if field.state.meta.errors.length > 0}
								<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
							{/if}
						</div>
					{/snippet}
				</registerForm.Field>

				<!-- Submit Button -->
				<registerForm.Subscribe selector={(state) => state.isSubmitting}>
					{#snippet children(isSubmitting)}
						<Button type="submit" class="w-full" disabled={isSubmitting}>
							{#if isSubmitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Creating account...
							{:else}
								Create account
							{/if}
						</Button>
					{/snippet}
				</registerForm.Subscribe>
			</form>
		</Card.Content>
		<Card.Footer class="text-center">
			<p class="text-sm text-muted-foreground">
				Already have an account?
				<a href="/login" class="font-medium text-primary underline hover:text-primary/80">
					Sign in
				</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
