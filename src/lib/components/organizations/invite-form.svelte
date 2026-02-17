<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Lucide from '$lib/components/utils/Lucide.svelte';
	import { toast } from 'svelte-sonner';
	import { authClient } from '$lib/auth/auth-client';
	import { z } from 'zod';
	import { invalidateAll } from '$app/navigation';

	let { organizationId } = $props<{
		organizationId: string;
	}>();

	// Fix 1: Remove required_error from enum
	const inviteMemberSchema = z.object({
		email: z.email('Invalid email address'),
		role: z.enum(['member', 'admin'])
	});

	// Fix 2: Proper type for selected state
	let selectedRole = $state<{ value: 'member' | 'admin'; label: string }>({
		value: 'member',
		label: 'Member'
	});

	const inviteForm = createForm(() => ({
		defaultValues: {
			email: '',
			role: 'member' as 'member' | 'admin'
		},
		validators: {
			onChange: inviteMemberSchema,
			onSubmit: inviteMemberSchema
		},
		onSubmit: async ({ value }) => {
			try {
				// Fix 6: Remove unused 'data' variable
				const { error } = await authClient.organization.inviteMember({
					email: value.email,
					role: value.role,
					organizationId: organizationId
				});

				if (error) {
					toast.error(error.message || 'Failed to send invitation');
					return;
				}

				toast.success(`Invitation sent to ${value.email}`);
				await invalidateAll();
				inviteForm.reset();

				// Reset select
				selectedRole = { value: 'member', label: 'Member' };
			} catch (err: any) {
				toast.error(err.message || 'Failed to send invitation');
			}
		}
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Invite Member</Card.Title>
		<Card.Description>Send an invitation to join your organization</Card.Description>
	</Card.Header>

	<Card.Content>
		<form
			class="grid gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				inviteForm.handleSubmit();
			}}
		>
			<!-- Email Field -->
			<inviteForm.Field name="email">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							placeholder="member@example.com"
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
							<p class="text-sm text-destructive">
								{field.state.meta.errors[0]?.message}
							</p>
						{/if}
					</div>
				{/snippet}
			</inviteForm.Field>

			<!-- Role Field -->
			<inviteForm.Field name="role">
				{#snippet children(field)}
					<div class="grid gap-2">
						<Label for="role">Role</Label>
						<!-- Fix 2-4: Proper Select binding -->
						<Select.Root
							value={field.state.value}
							onValueChange={(v: any) => {
								if (v) {
									selectedRole = v;
									field.handleChange(v.value);
								}
							}}
						>
							<Select.Trigger id="role" class="w-full">
								{field.state.value || 'Seelect role'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="member" label="Member">
									<div class="flex items-center gap-2">
										<Lucide name="User" size={16} />
										<div>
											<p class="font-medium">Member</p>
											<p class="text-xs text-muted-foreground">Can view and edit data</p>
										</div>
									</div>
								</Select.Item>
								<Select.Item value="admin" label="Admin">
									<div class="flex items-center gap-2">
										<Lucide name="Shield" size={16} />
										<div>
											<p class="font-medium">Admin</p>
											<p class="text-xs text-muted-foreground">
												Full access and can manage members
											</p>
										</div>
									</div>
								</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors.length > 0}
							<p class="text-sm text-destructive">
								{field.state.meta.errors[0]?.message}
							</p>
						{/if}
					</div>
				{/snippet}
			</inviteForm.Field>

			<!-- Submit Button -->
			<inviteForm.Subscribe selector={(state) => state.isSubmitting}>
				{#snippet children(isSubmitting)}
					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{#if isSubmitting}
							<Lucide name="Loader2" size={16} class="mr-2 animate-spin" />
							Sending invitation...
						{:else}
							<Lucide name="Send" size={16} class="mr-2" />
							Send Invitation
						{/if}
					</Button>
				{/snippet}
			</inviteForm.Subscribe>
		</form>
	</Card.Content>
</Card.Root>
