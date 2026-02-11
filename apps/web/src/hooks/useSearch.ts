import { useQuery } from "@tanstack/react-query";
import { executeSearchQuery } from "../lib/api/query";

export const searchKeys = {
  all: ["search"] as const,
  query: (query: string) => [...searchKeys.all, query] as const,
};

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: searchKeys.query(query),
    queryFn: () => executeSearchQuery(query),
    enabled: !!query,
    staleTime: 5 * 60 * 1000,
  });
}
