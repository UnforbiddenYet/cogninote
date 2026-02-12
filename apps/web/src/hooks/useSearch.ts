import { useQuery } from "@tanstack/react-query";
import { executeSearchQuery } from "../lib/api/query";

type ExecuteSearchQueryJson = Parameters<typeof executeSearchQuery>[0];

export const searchKeys = {
  all: ["search"] as const,
  query: (query: ExecuteSearchQueryJson["query"]) =>
    [...searchKeys.all, query] as const,
};

export function useSearchQuery(json: ExecuteSearchQueryJson) {
  return useQuery({
    queryKey: searchKeys.query(json.query),
    queryFn: () => executeSearchQuery(json),
    enabled: !!json.query,
    staleTime: 5 * 60 * 1000,
  });
}
