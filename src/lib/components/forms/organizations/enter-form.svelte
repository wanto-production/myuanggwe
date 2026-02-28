<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { goto, invalidate } from '$app/navigation';
	import { joinSchema } from '$lib/schemas';

	const queryClient = useQueryClient();

	const joinOrgForm = createForm(() => ({
		defaultValues: {
			invitationId: ''
		},
		validators: {
			onChange: joinSchema,
			onSubmit: joinSchema
		},
		onSubmit: async ({ value }) => {
			const { data } = await client.organizations['accept-invitation'].post(value);

			if (data?.success) {
				toast.success(data.message);
				await invalidate('layout:data');
				await invalidateFn(queryClient);
				goto('/dashboard');
			} else {
				toast.error('Gagal bergabung dengan organisasi');
			}
		}
	}));
</script>

<Card.Root class="w-full max-w-md">
	<Card.Header>
		<Card.Title class="text-2xl">Join Organization</Card.Title>
		<Card.Description>Enter your invitation ID to join</Card.Description>
	</Card.Header>

	<Card.Content>
		<form
			class="grid gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				joinOrgForm.handleSubmit();
			}}
		>
			<joinOrgForm.Field name="invitationId">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="invitationId">Invitation ID</Label>
						<Input
							id="invitationId"
							type="text"
							placeholder="Your invitation ID"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								field.handleChange(target.value);
							}}
							required
							class="text-center"
						/>
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">
								{field.state.meta.errors[0]?.message}
							</p>
						{/if}
					</div>
				{/snippet}
			</joinOrgForm.Field>

			<joinOrgForm.Subscribe selector={(state) => state.isSubmitting}>
				{#snippet children(isSubmitting)}
					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{#if isSubmitting}
							<Lucide name="Loader2" size={16} class="mr-2 animate-spin" />
							Joining...
						{:else}
							<Lucide name="Users" size={16} class="mr-2" />
							Join Organization
						{/if}
					</Button>
				{/snippet}
			</joinOrgForm.Subscribe>
		</form>
	</Card.Content>

	<Card.Footer class="flex flex-col gap-4">
		<Separator />
		<div class="text-center">
			<p class="text-sm text-muted-foreground">Don't have an invitation ID?</p>
			<a href="/organizations/create" class="text-sm font-medium text-primary underline">
				Create your own organization
			</a>
		</div>
	</Card.Footer>
</Card.Root>
