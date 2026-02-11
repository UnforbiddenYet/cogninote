import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, type TimeRange } from "../lib/api/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  byRange: (range: TimeRange) => [...dashboardKeys.all, range] as const,
};

export function useDashboard(timeRange: TimeRange = "7d") {
  return useQuery({
    queryKey: dashboardKeys.byRange(timeRange),
    queryFn: () => fetchDashboard(timeRange),
  });
}
