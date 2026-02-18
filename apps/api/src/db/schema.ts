import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export * from "./auth-schema";
import { user } from "./auth-schema";

// Enums
export const connectionTypeEnum = pgEnum("connection_type", [
  "manual",
  "ai_suggested",
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

// Notes table
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    content: text("content").notNull(),
    color: varchar("color", { length: 7 }),
    isArchived: boolean("is_archived").default(false).notNull(),
    summary: text("summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_notes_user_id").on(table.userId),
    updatedAtIdx: index("idx_notes_updated_at").on(table.updatedAt),
  }),
);

// Connections table (knowledge graph connections between notes)
export const connections = pgTable(
  "connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceNoteId: uuid("source_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    targetNoteId: uuid("target_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    connectionType: connectionTypeEnum("connection_type")
      .default("manual")
      .notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index("idx_connections_source").on(table.sourceNoteId),
    targetIdx: index("idx_connections_target").on(table.targetNoteId),
    userIdIdx: index("idx_connections_user_id").on(table.userId),
  }),
);

// AI Suggestions table
export const aiSuggestions = pgTable(
  "ai_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
  }),
);

// Query logs table
export const queryLogs = pgTable(
  "query_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    queryText: text("query_text").notNull(),
    mode: varchar("mode", { length: 20 }).notNull(),
    answerPreview: text("answer_preview"),
    sourceCount: integer("source_count").default(0).notNull(),
    processingTimeMs: integer("processing_time_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_query_logs_user_id").on(table.userId),
    createdAtIdx: index("idx_query_logs_created_at").on(table.createdAt),
  }),
);

// Relations
export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(user, { fields: [notes.userId], references: [user.id] }),
  sourceConnections: many(connections, { relationName: "source" }),
  targetConnections: many(connections, { relationName: "target" }),
  aiSuggestions: many(aiSuggestions),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(user, { fields: [connections.userId], references: [user.id] }),
  source: one(notes, {
    fields: [connections.sourceNoteId],
    references: [notes.id],
    relationName: "source",
  }),
  target: one(notes, {
    fields: [connections.targetNoteId],
    references: [notes.id],
    relationName: "target",
  }),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  user: one(user, { fields: [aiSuggestions.userId], references: [user.id] }),
  note: one(notes, {
    fields: [aiSuggestions.noteId],
    references: [notes.id],
  }),
}));

export const queryLogsRelations = relations(queryLogs, ({ one }) => ({
  user: one(user, { fields: [queryLogs.userId], references: [user.id] }),
}));
