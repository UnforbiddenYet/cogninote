import { apiRequest } from "./apiClient";

export interface DashboardStats {
  totalNotes: number;
  totalConnections: number;
  notesCreatedInPeriod: number;
  connectionsCreatedInPeriod: number;
}

export interface DashboardRecentNote {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  connectionCount: number;
}

export interface TopEntity {
  label: string;
  count: number;
}

export interface SuggestedConnection {
  id: string;
  noteId: string;
  suggestionData: {
    sourceNoteId: string;
    sourceTitle: string;
    targetNoteId: string;
    targetTitle: string;
    sharedEntities: string[];
    score: number;
  };
  status: string;
}

export interface MostConnectedNote {
  id: string;
  title: string;
  connectionCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentNotes: DashboardRecentNote[];
  topEntities: TopEntity[];
  suggestedConnections: SuggestedConnection[];
  mostConnectedNote: MostConnectedNote | null;
}

export type TimeRange = "1d" | "7d" | "30d";

export async function fetchDashboard(
  timeRange: TimeRange = "7d",
): Promise<DashboardData> {
  const result = await apiRequest<{
    success: boolean;
    data: DashboardData;
  }>(`/api/dashboard?timeRange=${timeRange}`);
  return result.data;
}
