import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchDashboard } from "../lib/api/dashboard";

type FetchDashboardQuery = Parameters<typeof fetchDashboard>[0];

export const dashboardKeys = {
  all: ["dashboard"] as const,
  byRange: (range: FetchDashboardQuery["timeRange"]) =>
    [...dashboardKeys.all, range] as const,
};

export function useDashboard(query: FetchDashboardQuery) {
  return useQuery({
    queryKey: dashboardKeys.byRange(query.timeRange),
    queryFn: () => fetchDashboard(query),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
