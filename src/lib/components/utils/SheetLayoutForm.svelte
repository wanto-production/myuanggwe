<script lang="ts">
	interface Props {
		label: string;
		descriptions: string;
		form: Snippet;
		open: boolean;
	}

	let { open = $bindable(), label, descriptions, form }: Props = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right">
		<Sheet.Header>
			<Sheet.Title>{label}</Sheet.Title>
			<Sheet.Description>
				{descriptions}
			</Sheet.Description>
		</Sheet.Header>

		{@render form()}
		<Sheet.Footer>
			<Sheet.Close>
				{#snippet child({ props })}
					<Button {...props} variant="outline">Tutup</Button>
				{/snippet}
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
