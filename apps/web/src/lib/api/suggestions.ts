import { honoClient, type InferPathParam, parseResponse } from "./apiClient";

export async function acceptSuggestion(
  id: InferPathParam<(typeof honoClient.api.suggestions)[":id"]["accept"]["$post"], "id">,
) {
  const response = await parseResponse(
    honoClient.api.suggestions[":id"].accept.$post({ param: { id } }),
  );
  return response.data;
}

export async function dismissSuggestion(
  id: InferPathParam<(typeof honoClient.api.suggestions)[":id"]["dismiss"]["$post"], "id">,
) {
  await parseResponse(honoClient.api.suggestions[":id"].dismiss.$post({ param: { id } }));
}
