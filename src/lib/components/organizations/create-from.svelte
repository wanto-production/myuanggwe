<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { organizationSchema } from '$lib/schemas';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { invalidateFn } from '$lib/@functions';
	import { useQueryClient } from '@tanstack/svelte-query';

	const queryClient = useQueryClient();
	const session = authClient.useSession();

	const loginForm = createForm(() => ({
		defaultValues: {
			name: '',
			slug: ''
		},
		validators: {
			onChange: organizationSchema,
			onSubmit: organizationSchema
		},
		onSubmit: async ({ value }) => {
			await invalidateFn(queryClient);
			await authClient.organization.create(
				{
					name: value.name,
					slug: value.slug, // required
					userId: $session.data?.user.id,
					keepCurrentActiveOrganization: false
				},
				{
					async onError(context) {
						toast.error(context.error.message);
					},
					async onSuccess() {
						toast.success('change organizations!');
						goto('/dashboard');
					}
				}
			);
		}
	}));
</script>

<svelte:head>
	<title>NewOrgs - MyUangGwe | Financial Management App</title>
	<meta name="description" content="Create an organizations to collaborate" />
	<meta
		name="keywords"
		content="create organizations, financial account, financial management, financial dashboard"
	/>
</svelte:head>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Create organizations</Card.Title>
		<Card.Description
			>Enter your name,slug organizations below to create your organization.</Card.Description
		>
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
			<loginForm.Field name="name">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							type="name"
							placeholder="name's.org"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								field.handleChange(target.value);
							}}
							required
						/>
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">{field.state.meta.errors[0]?.message}</p>
						{/if}
					</div>
				{/snippet}
			</loginForm.Field>

			<loginForm.Field name="slug">
				{#snippet children(field)}
					<div class="grid gap-2">
						<div class="flex items-center justify-between">
							<Label for="slug">Slug</Label>
							<a href="/forgot-password" class="text-xs underline hover:text-primary">
								Forgot password?
							</a>
						</div>
						<Input
							id="slug"
							type="text"
							placeholder="••••••••"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								field.handleChange(target.value);
							}}
							required
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
					<Button type="submit" class="w-full" disabled={$session.isPending || isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Creating...
						{:else}
							Create
						{/if}
					</Button>
				{/snippet}
			</loginForm.Subscribe>
		</form>
	</Card.Content>
</Card.Root>
