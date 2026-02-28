<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		trigger: Snippet<[{ props: Record<string, any> }]>;
		onUpdate?: () => void;
		onDelete?: () => void;
	}

	let { trigger, onUpdate, onDelete }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-40" align="end">
		{#if onUpdate}
			<DropdownMenu.Item onclick={onUpdate}>
				<Lucide name="Pencil" class="mr-2 h-4 w-4" />
				Update
			</DropdownMenu.Item>
		{/if}
		{#if onDelete}
			<DropdownMenu.Item onclick={onDelete} class="text-destructive focus:text-destructive">
				<Lucide name="Trash2" class="mr-2 h-4 w-4" />
				Delete
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
