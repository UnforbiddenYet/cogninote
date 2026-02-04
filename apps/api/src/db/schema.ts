import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const linkTypeEnum = pgEnum("link_type", [
  "manual",
  "ai_suggested",
  "bidirectional",
]);

export const suggestionTypeEnum = pgEnum("suggestion_type", [
  "tag",
  "link",
  "summary",
]);

export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "accepted",
  "rejected",
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
  })
);

// Folders table
export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    color: varchar("color", { length: 7 }),
    icon: varchar("icon", { length: 50 }),
    position: integer("position").default(0).notNull(),
    isExpanded: boolean("is_expanded").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_folders_user_id").on(table.userId),
    positionIdx: index("idx_folders_position").on(table.userId, table.position),
  })
);

// Notes table
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
    title: varchar("title", { length: 512 }).notNull(),
    content: text("content").notNull(),
    contentPlain: text("content_plain").notNull(),
    color: varchar("color", { length: 7 }),
    isArchived: boolean("is_archived").default(false).notNull(),
    summary: text("summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_notes_user_id").on(table.userId),
    folderIdIdx: index("idx_notes_folder_id").on(table.folderId),
    updatedAtIdx: index("idx_notes_updated_at").on(table.updatedAt),
  })
);

// Tags table
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdNameIdx: index("idx_tags_user_id_name").on(table.userId, table.name),
  })
);

// Note-Tags junction table
export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagId] }),
    noteIdIdx: index("idx_note_tags_note").on(table.noteId),
    tagIdIdx: index("idx_note_tags_tag").on(table.tagId),
  })
);

// Links table (connections between notes)
export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceNoteId: uuid("source_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    targetNoteId: uuid("target_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    linkType: linkTypeEnum("link_type").default("manual").notNull(),
    strength: real("strength").default(1.0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index("idx_links_source").on(table.sourceNoteId),
    targetIdx: index("idx_links_target").on(table.targetNoteId),
    userIdIdx: index("idx_links_user_id").on(table.userId),
  })
);

// AI Suggestions table
export const aiSuggestions = pgTable(
  "ai_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    suggestionType: suggestionTypeEnum("suggestion_type").notNull(),
    suggestionData: jsonb("suggestion_data").notNull(),
    status: suggestionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_ai_suggestions_user_id").on(table.userId),
    noteIdIdx: index("idx_ai_suggestions_note_id").on(table.noteId),
    statusIdx: index("idx_ai_suggestions_status").on(table.status),
  })
);

// Sessions table
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_sessions_user_id").on(table.userId),
    expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  notes: many(notes),
  tags: many(tags),
  links: many(links),
  sessions: many(sessions),
  aiSuggestions: many(aiSuggestions),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  folder: one(folders, { fields: [notes.folderId], references: [folders.id] }),
  tags: many(noteTags),
  sourceLinks: many(links, { relationName: "source" }),
  targetLinks: many(links, { relationName: "target" }),
  aiSuggestions: many(aiSuggestions),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  notes: many(noteTags),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  notes: many(notes),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const linksRelations = relations(links, ({ one }) => ({
  user: one(users, { fields: [links.userId], references: [users.id] }),
  source: one(notes, {
    fields: [links.sourceNoteId],
    references: [notes.id],
    relationName: "source",
  }),
  target: one(notes, {
    fields: [links.targetNoteId],
    references: [notes.id],
    relationName: "target",
  }),
}));

export const aiSuggestionsRelations = relations(
  aiSuggestions,
  ({ one }) => ({
    user: one(users, { fields: [aiSuggestions.userId], references: [users.id] }),
    note: one(notes, {
      fields: [aiSuggestions.noteId],
      references: [notes.id],
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
