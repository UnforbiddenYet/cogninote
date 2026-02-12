import { honoClient, type InferReqQuery, parseResponse } from "./apiClient";

export async function fetchDashboard(
  query: InferReqQuery<typeof honoClient.api.dashboard.$get>,
) {
  const response = await parseResponse(
    honoClient.api.dashboard.$get({
      query,
    }),
  );
  return response.data;
}
