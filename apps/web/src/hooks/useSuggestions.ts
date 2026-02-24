import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptSuggestion, dismissSuggestion } from "../lib/api/suggestions";
import { dashboardKeys } from "./useDashboard";
import { noteKeys } from "./useNotes";

export function useAcceptSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptSuggestion,
    onSuccess: () => {
      // Refresh dashboard (removes suggestion) and notes (connection counts changed)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
