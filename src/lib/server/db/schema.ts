import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	username: text('username').unique(),
	displayUsername: text('display_username')
});

export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		activeOrganizationId: text('active_organization_id')
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', {
			mode: 'timestamp_ms'
		}),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', {
			mode: 'timestamp_ms'
		}),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const organization = sqliteTable(
	'organization',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull().unique(),
		logo: text('logo'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		metadata: text('metadata')
	},
	(table) => [uniqueIndex('organization_slug_uidx').on(table.slug)]
);

export const member = sqliteTable(
	'member',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organization.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').default('member').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
	},
	(table) => [
		index('member_organizationId_idx').on(table.organizationId),
		index('member_userId_idx').on(table.userId)
	]
);

export const invitation = sqliteTable(
	'invitation',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organization.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		role: text('role'),
		status: text('status').default('pending').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		inviterId: text('inviter_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [
		index('invitation_organizationId_idx').on(table.organizationId),
		index('invitation_email_idx').on(table.email)
	]
);

export const wallets = sqliteTable('wallets', {
	id: text('id').primaryKey().default(crypto.randomUUID()),
	name: text('name').notNull(), // Misal: "Rekening Utama", "Kas Bersama"
	type: text('type').default('cash').notNull(), // cash, bank, credit_card
	balance: integer('balance').default(0).notNull(), // Simpan dalam satuan terkecil (misal: Rupiah tanpa desimal)

	// KUNCI KOLABORASI:
	// Jika organizationId terisi, ini dompet grup. Jika null, ini dompet personal user.
	organizationId: text('organization_id').references(() => organization.id, {
		onDelete: 'cascade'
	}),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

export const categories = sqliteTable('categories', {
	id: text('id').primaryKey().default(crypto.randomUUID()),
	name: text('name').notNull(),
	icon: text('icon'), // Simpan nama ikon Lucide
	type: text('type').notNull(), // 'income' atau 'expense'
	organizationId: text('organization_id').references(() => organization.id, {
		onDelete: 'cascade'
	}),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const transactions = sqliteTable('transactions', {
	id: text('id').primaryKey().default(crypto.randomUUID()),
	amount: integer('amount').notNull(),
	// Tambah kolom ini:
	type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
	description: text('description'),
	date: integer('date', { mode: 'timestamp_ms' }).notNull(),
	// ... sisanya tetep sama
	walletId: text('wallet_id')
		.notNull()
		.references(() => wallets.id, { onDelete: 'cascade' }),
	toWalletId: text('to_wallet_id').references(() => wallets.id, { onDelete: 'cascade' }), // Kolom baru
	categoryId: text('category_id')
		.notNull()
		.references(() => categories.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	organizationId: text('organization_id').references(() => organization.id, {
		onDelete: 'cascade'
	}),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// --- Update Relations ---

export const walletRelations = relations(wallets, ({ one, many }) => ({
	organization: one(organization, {
		fields: [wallets.organizationId],
		references: [organization.id]
	}),
	user: one(user, { fields: [wallets.userId], references: [user.id] }),
	transactions: many(transactions)
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
	wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
	category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
	user: one(user, { fields: [transactions.userId], references: [user.id] }),
	organization: one(organization, {
		fields: [transactions.organizationId],
		references: [organization.id]
	})
}));

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	members: many(member),
	invitations: many(invitation)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	invitations: many(invitation)
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	})
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	})
}));
