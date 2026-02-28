<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import CreateForm from '$lib/components/forms/organizations/create-form.svelte';
	import EnterForm from '$lib/components/forms/organizations/enter-form.svelte';
	import InviteForm from '$lib/components/forms/organizations/invite-form.svelte';
  
  let { data } = $props()
</script>

<svelte:head>
	<title>NewOrgs - MyUangGwe | Financial Management App</title>
	<meta name="description" content="Create an organizations to collaborate" />
	<meta
		name="keywords"
		content="create organizations, financial account, financial management, financial dashboard"
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Tabs.Root value="create">
		<Tabs.List>
			<Tabs.Trigger value="create">Create</Tabs.Trigger>
			<Tabs.Trigger value="enter">Enter</Tabs.Trigger>
			<Tabs.Trigger disabled={!data.activeOrg} value="invite">Invite</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="create">
			<CreateForm />
		</Tabs.Content>
		<Tabs.Content value="enter">
			<EnterForm />
		</Tabs.Content>
		<Tabs.Content value="invite">
			<InviteForm />
		</Tabs.Content>
	</Tabs.Root>
</div>
