import { honoClient, type InferPathParam, parseResponse } from "./apiClient";

export async function deleteConnection(
  connectionId: InferPathParam<
    (typeof honoClient.api.connections)[":connectionId"]["$delete"],
    "connectionId"
  >,
) {
  await parseResponse(
    honoClient.api.connections[":connectionId"].$delete({
      param: { connectionId },
    }),
  );
}
