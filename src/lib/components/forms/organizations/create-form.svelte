<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { organizationSchema } from '$lib/schemas';
	import { authClient } from '$lib/auth/auth-client';
	import { goto, invalidate } from '$app/navigation';

	const queryClient = useQueryClient();
	const session = authClient.useSession();

	const orgForm = createForm(() => ({
		defaultValues: {
			name: '',
			slug: ''
		},
		validators: {
			onChange: organizationSchema,
			onSubmit: organizationSchema
		},
		onSubmit: async ({ value }) => {
			const { data } = await client.orgs.create.post(value);

			if (data?.success) {
				toast.success(data.message!);
				goto('/dashboard');
				await invalidate('layout:data');
				await invalidateFn(queryClient);
			} else {
				toast.error('Gagal membuat organisasi');
			}
		}
	}));
</script>

<svelte:head>
	<title>New Orgs - MyUangGwe | Financial Management App</title>
	<meta name="description" content="Create an organization to collaborate" />
</svelte:head>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Create Organization</Card.Title>
		<Card.Description>Enter your name and slug below to create your organization.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			class="grid gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				orgForm.handleSubmit();
			}}
		>
			<orgForm.Field name="name">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							type="text"
							placeholder="My Organization"
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
			</orgForm.Field>

			<orgForm.Field name="slug">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="slug">Slug</Label>
						<Input
							id="slug"
							type="text"
							placeholder="my-org"
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
			</orgForm.Field>

			<!-- Submit Button -->
			<orgForm.Subscribe selector={(state) => state.isSubmitting}>
				{#snippet children(isSubmitting)}
					<Button type="submit" class="w-full" disabled={$session.isPending || isSubmitting}>
						{#if isSubmitting}
							<Lucide name="Loader2" class="mr-2 h-4 w-4 animate-spin" />
							Creating...
						{:else}
							Create
						{/if}
					</Button>
				{/snippet}
			</orgForm.Subscribe>
		</form>
	</Card.Content>
</Card.Root>
