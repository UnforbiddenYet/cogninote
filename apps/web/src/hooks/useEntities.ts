import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchEntities, mergeEntities, deleteEntity } from "../lib/api/entities";
import { dashboardKeys } from "./useDashboard";

type FetchEntitiesQuery = Parameters<typeof fetchEntities>[0];

export const entityKeys = {
  all: ["entities"] as const,
  list: (params: FetchEntitiesQuery) => [...entityKeys.all, params] as const,
};

export function useEntities(params: FetchEntitiesQuery) {
  return useQuery({
    queryKey: entityKeys.list(params),
    queryFn: () => fetchEntities(params),
    placeholderData: keepPreviousData,
  });
}

export function useMergeEntities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mergeEntities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
