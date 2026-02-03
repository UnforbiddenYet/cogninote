// User types
export type User = {
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = Omit<User, "email">;

// Note types
export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  contentPlain: string;
  embedding?: number[];
  color?: string;
  isArchived: boolean;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateNoteInput = Pick<Note, "title" | "content"> & {
  color?: string;
};

export type UpdateNoteInput = Partial<Pick<Note, "title" | "content" | "color" | "isArchived">>;

// Tag types
export type Tag = {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
};

export type CreateTagInput = Pick<Tag, "name"> & { color?: string };

export type UpdateTagInput = Partial<Pick<Tag, "name" | "color">>;

// Link types
export type LinkType = "manual" | "ai_suggested" | "bidirectional";

export type Link = {
  id: string;
  userId: string;
  sourceNoteId: string;
  targetNoteId: string;
  linkType: LinkType;
  strength: number;
  createdAt: Date;
};

export type CreateLinkInput = {
  sourceNoteId: string;
  targetNoteId: string;
  linkType?: LinkType;
};

// AI Suggestion types
export type SuggestionType = "tag" | "link" | "summary";
export type SuggestionStatus = "pending" | "accepted" | "rejected";

export type AISuggestion = {
  id: string;
  userId: string;
  noteId: string;
  suggestionType: SuggestionType;
  suggestionData: Record<string, unknown>;
  status: SuggestionStatus;
  createdAt: Date;
};

// Graph types
export type GraphNode = {
  id: string;
  title: string;
  tags: string[];
  connections: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: LinkType;
  strength: number;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNotes: number;
    totalLinks: number;
    avgConnections: number;
  };
};

// API Response types
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  error?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

// Auth types
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};
