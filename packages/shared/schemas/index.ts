import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

// Note schemas
export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color").optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color").optional(),
  isArchived: z.boolean().optional(),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color").optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color").optional(),
});

// Link schemas
export const linkTypeEnum = z.enum(["manual", "ai_suggested", "bidirectional"]);

export const createLinkSchema = z.object({
  sourceNoteId: z.string().uuid("Invalid source note ID"),
  targetNoteId: z.string().uuid("Invalid target note ID"),
  linkType: linkTypeEnum.default("manual"),
});

// Search schemas
export const searchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const semanticSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(100).default(5),
  threshold: z.number().min(0).max(1).default(0.7),
});

// Export types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;
