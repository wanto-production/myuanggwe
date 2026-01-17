<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Banknote, CreditCard, Plus, Landmark } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let open = $state(false);

	const { form, enhance } = superForm(data.form, {
		onUpdated: ({ form }) => {
			if (form.valid) {
				open = false;
				toast.success('wallets created!');
			}
		}
	});

	const icons = {
		bank: Landmark,
		credit_card: CreditCard,
		cash: Banknote
	};

	const typeOptions = [
		{ value: 'cash', label: 'Tunai (Cash)' },
		{ value: 'bank', label: 'Bank / E-Wallet' },
		{ value: 'credit_card', label: 'Kartu Kredit' }
	];

	let selectedLabel = $derived(
		typeOptions.find((t) => t.value === $form.type)?.label ?? 'Pilih tipe'
	);

	const formatIDR = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dompet Saya</h1>
			<p class="text-sm text-muted-foreground">
				Kelola rekening untuk {data.activeOrg?.name ?? 'Personal'}.
			</p>
		</div>

		<Dialog.Root bind:open>
			<Dialog.Trigger class={buttonVariants({ class: 'gap-2' })}>
				<Plus class="h-4 w-4" /> Tambah Dompet
			</Dialog.Trigger>

			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Buat Dompet Baru</Dialog.Title>
				</Dialog.Header>

				<form method="POST" use:enhance class="space-y-4 pt-4">
					<div class="space-y-2">
						<Label for="name">Nama Dompet</Label>
						<Input id="name" name="name" bind:value={$form.name} placeholder="BCA, Dana, dll" />
					</div>

					<div class="space-y-2">
						<Label for="balance">Saldo Awal</Label>
						<Input id="balance" name="balance" type="number" bind:value={$form.balance} />
					</div>

					<div class="space-y-2">
						<Label>Tipe</Label>
						<Select.Root type="single" bind:value={$form.type} name="type">
							<Select.Trigger
								class={buttonVariants({
									variant: 'outline',
									class: 'w-full justify-between text-left font-normal'
								})}
							>
								{selectedLabel}
							</Select.Trigger>
							<Select.Content>
								{#each typeOptions as option (option.value)}
									<Select.Item value={option.value} label={option.label}>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<Button type="submit" class="w-full">Simpan Dompet</Button>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		{#each data.walletList as wallet (wallet.id)}
			{@const Icon = icons[wallet.type as keyof typeof icons] || Banknote}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">{wallet.name}</Card.Title>
					<Icon class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{formatIDR(wallet.balance)}</div>
					<p class="text-xs text-muted-foreground capitalize">{wallet.type.replace('_', ' ')}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
