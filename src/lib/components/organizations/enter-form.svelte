<script lang="ts">
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { createForm } from '@tanstack/svelte-form';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Lucide from '$lib/components/utils/Lucide.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { z } from 'zod';
	import { authClient } from '$lib/auth/auth-client';
	import { invalidateFn } from '$lib/@functions';
	import { useQueryClient } from '@tanstack/svelte-query';
  
  const queryClient = useQueryClient()

	const joinOrgSchema = z.object({
		inviteCode: z.string().min(6, 'Invalid invitation code')
	});

	const joinOrgForm = createForm(() => ({
		defaultValues: {
			inviteCode: ''
		},
		validators: {
			onChange: joinOrgSchema,
			onSubmit: joinOrgSchema
		},
		onSubmit: async ({ value }) => {
			await authClient.organization.acceptInvitation(
				{
					invitationId: value.inviteCode
				},
				{
					async onSuccess() {
						toast.success('Successfully joined organization!');

						await invalidateFn(queryClient);
						goto('/dashboard');
					},
					onError({ error }) {
						toast.error(error.message || 'Failed to join organization');
					}
				}
			);
		}
	}));
</script>

<Card.Root class="w-full max-w-md">
	<Card.Header>
		<Card.Title class="text-2xl">Join Organization</Card.Title>
		<Card.Description>Enter your invitation code to join</Card.Description>
	</Card.Header>

	<Card.Content>
		<form
			class="grid gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				joinOrgForm.handleSubmit();
			}}
		>
			<joinOrgForm.Field name="inviteCode">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="inviteCode">Invitation Code</Label>
						<Input
							id="inviteCode"
							type="text"
							placeholder="ABC123XYZ"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								field.handleChange(target.value);
							}}
							required
							class="text-center text-lg tracking-widest"
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
			<p class="text-sm text-muted-foreground">Don't have an invitation code?</p>
			<a href="/organizations/create" class="text-sm font-medium text-primary underline">
				Create your own organization
			</a>
		</div>
	</Card.Footer>
</Card.Root>
