import { honoClient, type InferReqJson, parseResponse } from "./apiClient";

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
