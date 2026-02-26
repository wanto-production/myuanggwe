<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Lucide from '$lib/components/utils/Lucide.svelte';
	import { toast } from 'svelte-sonner';
	import { inviteSchema } from '$lib/schemas';
	import { invalidateAll } from '$app/navigation';
	import { createForm } from '@tanstack/svelte-form';
	import { client } from '$lib/eden';

	const inviteForm = createForm(() => ({
		defaultValues: {
			email: '',
			role: 'member' as 'member' | 'admin'
		},
		validators: {
			onChange: inviteSchema,
			onSubmit: inviteSchema
		},
		onSubmit: async ({ value }) => {
			const { data } = await client.organizations.invite.post(value);

			if (data?.success) {
				toast.success(data.message);
				await invalidateAll();
				inviteForm.reset();
			} else {
				toast.error('Gagal mengirim undangan');
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
						<Select.Root
							type="single"
							value={field.state.value}
							onValueChange={(v: any) => {
								field.handleChange(v);
							}}
						>
							<Select.Trigger id="role" class="w-full">
								{field.state.value.charAt(0).toUpperCase() + field.state.value.slice(1)}
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
