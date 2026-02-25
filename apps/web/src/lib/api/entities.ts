import {
  honoClient,
  type InferReqJson,
  type InferReqQuery,
  type InferPathParam,
  parseResponse,
} from "./apiClient";

export async function fetchEntities(
  query: InferReqQuery<(typeof honoClient.api.graph.entities.list)["$get"]>,
) {
  const response = await parseResponse(honoClient.api.graph.entities.list.$get({ query }));
  return response.data;
}

export async function mergeEntities(
  json: InferReqJson<(typeof honoClient.api.graph.entities.merge)["$post"]>,
) {
  const response = await parseResponse(honoClient.api.graph.entities.merge.$post({ json }));
  return response.data;
}

export async function deleteEntity(
  name: InferPathParam<(typeof honoClient.api.graph.entities)[":name"]["$delete"], "name">,
) {
  const response = await parseResponse(
    honoClient.api.graph.entities[":name"].$delete({ param: { name } }),
  );
  return response.data;
}
