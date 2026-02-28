<script lang="ts">
</script>

<svelte:head>
	<title>MyUangGwe - Personal & Business Finance Management App</title>
	<meta
		name="description"
		content="MyUangGwe is an easy-to-use personal and business finance management app for tracking expenses, income, and budgeting."
	/>
</svelte:head>

<div class="relative">
	<!-- Hero Section -->
	<section class="relative overflow-hidden border-b">
		<div
			class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"
		></div>
    
    <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
					Take control of your
					<span class="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
						finances
					</span>
				</h1>
				<p class="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
					Track expenses, manage budgets, and gain insights into your financial health. Built for
					individuals and businesses.
				</p>
				<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button size="lg" class="gap-2" href="/register">
						Get started for free
						<Lucide name="ArrowRight" class="h-4 w-4" />
					</Button>
					<Button size="lg" variant="outline" href="/login">Sign in</Button>
				</div>
				<p class="mt-4 text-sm text-muted-foreground">
					No credit card required. Start managing your finances today.
				</p>
			</div>

			<!-- Hero Image/Preview -->
			<div class="mt-16">
				<div class="relative overflow-hidden rounded-xl border bg-card shadow-2xl">
					<div class="aspect-video bg-linear-to-br from-primary/10 to-blue-600/10 p-8">
						<div class="grid gap-4 md:grid-cols-3">
							<Card.Root>
								<Card.Header class="pb-3">
									<Card.Title class="text-sm">Total Balance</Card.Title>
								</Card.Header>
								<Card.Content>
									<p class="text-2xl font-bold">$12,450.00</p>
								</Card.Content>
							</Card.Root>
							<Card.Root>
								<Card.Header class="pb-3">
									<Card.Title class="text-sm">This Month</Card.Title>
								</Card.Header>
								<Card.Content>
									<p class="text-2xl font-bold text-green-600">+$2,350.00</p>
								</Card.Content>
							</Card.Root>
							<Card.Root>
								<Card.Header class="pb-3">
									<Card.Title class="text-sm">Expenses</Card.Title>
								</Card.Header>
								<Card.Content>
									<p class="text-2xl font-bold text-red-600">-$1,280.00</p>
								</Card.Content>
							</Card.Root>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="border-b py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
					Everything you need to manage your money
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Powerful features to help you stay on top of your finances
				</p>
			</div>

			<div class="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				<!-- Feature 1 -->
				<Card.Root>
					<Card.Header>
						<div class="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
							<Lucide name="Wallet" class="h-6 w-6 text-primary" />
						</div>
						<Card.Title>Multiple Wallets</Card.Title>
						<Card.Description>
							Manage multiple accounts including bank, cash, and credit cards in one place.
						</Card.Description>
					</Card.Header>
				</Card.Root>

				<!-- Feature 2 -->
				<Card.Root>
					<Card.Header>
						<div class="mb-4 inline-flex rounded-lg bg-blue-600/10 p-3">
							<Lucide name="PieChart" class="h-6 w-6 text-blue-600" />
						</div>
						<Card.Title>Visual Reports</Card.Title>
						<Card.Description>
							Get detailed insights with charts and graphs to understand your spending patterns.
						</Card.Description>
					</Card.Header>
				</Card.Root>

				<!-- Feature 3 -->
				<Card.Root>
					<Card.Header>
						<div class="mb-4 inline-flex rounded-lg bg-green-600/10 p-3">
							<Lucide name="TrendingUp" class="h-6 w-6 text-green-600" />
						</div>
						<Card.Title>Budget Tracking</Card.Title>
						<Card.Description>
							Set budgets and track your progress to achieve your financial goals.
						</Card.Description>
					</Card.Header>
				</Card.Root>

				<!-- Feature 4 -->
				<Card.Root>
					<Card.Header>
						<div class="mb-4 inline-flex rounded-lg bg-purple-600/10 p-3">
							<Lucide name="Shield" class="h-6 w-6 text-purple-600" />
						</div>
						<Card.Title>Secure & Private</Card.Title>
						<Card.Description>
							Your financial data is encrypted and secure. We never share your information.
						</Card.Description>
					</Card.Header>
				</Card.Root>

				<!-- Feature 5 -->
				<Card.Root>
					<Card.Header>
						<div class="mb-4 inline-flex rounded-lg bg-orange-600/10 p-3">
							<Lucide name="Zap" class="h-6 w-6 text-orange-600" />
						</div>
						<Card.Title>Quick Entry</Card.Title>
						<Card.Description>
							Record transactions in seconds with our intuitive and fast interface.
						</Card.Description>
					</Card.Header>
				</Card.Root>

				<!-- Feature 6 -->
				<Card.Root>
					<Card.Header>
						<div class="mb-4 inline-flex rounded-lg bg-pink-600/10 p-3">
							<Lucide name="Users" class="h-6 w-6 text-pink-600" />
						</div>
						<Card.Title>Team Collaboration</Card.Title>
						<Card.Description>
							Manage business finances with your team using organization accounts.
						</Card.Description>
					</Card.Header>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- Pricing Section -->
	<section class="border-b py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
					Simple, transparent pricing
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Choose the plan that works best for you
				</p>
			</div>

			<div class="mt-16 grid gap-8 lg:grid-cols-3">
				<!-- Free Plan -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Personal</Card.Title>
						<Card.Description>Perfect for individuals</Card.Description>
						<div class="mt-4">
							<span class="text-4xl font-bold">$0</span>
							<span class="text-muted-foreground">/month</span>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<ul class="space-y-2">
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Up to 3 wallets</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Unlimited transactions</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Basic reports</span>
							</li>
						</ul>
						<Button class="w-full" variant="outline" href="/register">Get started</Button>
					</Card.Content>
				</Card.Root>

				<!-- Pro Plan -->
				<Card.Root class="border-primary">
					<Card.Header>
						<div class="mb-2">
							<span
								class="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
							>
								Popular
							</span>
						</div>
						<Card.Title>Pro</Card.Title>
						<Card.Description>For power users</Card.Description>
						<div class="mt-4">
							<span class="text-4xl font-bold">$9</span>
							<span class="text-muted-foreground">/month</span>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<ul class="space-y-2">
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Unlimited wallets</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Advanced reports</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Budget alerts</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Priority support</span>
							</li>
						</ul>
						<Button class="w-full" href="/register">Get started</Button>
					</Card.Content>
				</Card.Root>

				<!-- Business Plan -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Business</Card.Title>
						<Card.Description>For teams and organizations</Card.Description>
						<div class="mt-4">
							<span class="text-4xl font-bold">$29</span>
							<span class="text-muted-foreground">/month</span>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<ul class="space-y-2">
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Everything in Pro</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Team collaboration</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Role management</span>
							</li>
							<li class="flex items-center gap-2">
								<Lucide name="Check" class="h-4 w-4 text-green-600" />
								<span class="text-sm">Dedicated support</span>
							</li>
						</ul>
						<Button class="w-full" variant="outline" href="/register">Get started</Button>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<Card.Root class="bg-linear-to-r from-primary to-blue-600 text-primary-foreground">
				<Card.Header class="text-center">
					<Card.Title class="mb-4 text-3xl sm:text-4xl">
						Ready to take control of your finances?
					</Card.Title>
					<Card.Description class="mb-8 text-lg text-primary-foreground/80">
						Join thousands of users who are already managing their money better with MyUangGwe.
					</Card.Description>
					<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button size="lg" variant="secondary" class="gap-2" href="/register">
							Get started for free
							<Lucide name="ArrowRight" class="h-4 w-4" />
						</Button>
						<Button
							size="lg"
							variant="outline"
							class="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
							href="/login"
						>
							Sign in
						</Button>
					</div>
				</Card.Header>
			</Card.Root>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center text-sm text-muted-foreground">
				<p>&copy; 2024 MyUangGwe. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
