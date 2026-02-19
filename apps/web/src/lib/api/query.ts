import { honoClient, type InferReqJson, type InferReqQuery, parseResponse } from "./apiClient";

export async function executeSearchQuery(
  json: InferReqJson<(typeof honoClient.api.query)["$post"]>,
) {
  const response = await parseResponse(
    honoClient.api.query.$post({
      json,
    }),
  );
  return response.data;
}

export async function fetchQueryHistory(
  query: InferReqQuery<(typeof honoClient.api.query.history)["$get"]>,
) {
  const response = await parseResponse(honoClient.api.query.history.$get({ query }));
  return response.data;
}
