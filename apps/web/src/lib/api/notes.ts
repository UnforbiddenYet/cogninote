import {
  honoClient,
  type InferReqJson,
  type InferReqQuery,
  type InferPathParam,
  parseResponse,
} from "./apiClient";

export async function fetchNotes(
  query: InferReqQuery<(typeof honoClient.api.notes)["$get"]>,
) {
  const response = await parseResponse(
    honoClient.api.notes.$get({ query }),
  );
  return response.data;
}

export async function fetchNote(
  noteId: InferPathParam<
    (typeof honoClient.api.notes)[":noteId"]["$get"],
    "noteId"
  >,
) {
  const response = await parseResponse(
    honoClient.api.notes[":noteId"].$get({
      param: { noteId },
    }),
  );
  return response.data.note;
}

export async function updateNote({
  noteId,
  updates,
}: {
  noteId: InferPathParam<
    (typeof honoClient.api.notes)[":noteId"]["$patch"],
    "noteId"
  >;
  updates: InferReqJson<(typeof honoClient.api.notes)[":noteId"]["$patch"]>;
}) {
  const response = await parseResponse(
    honoClient.api.notes[":noteId"].$patch({
      param: { noteId },
      json: updates,
    }),
  );
  return response.data.note;
}

export async function createNote(
  json: InferReqJson<(typeof honoClient.api.notes)["$post"]>,
) {
  const response = await parseResponse(
    honoClient.api.notes.$post({
      json,
    }),
  );
  return response.data.note;
}

export async function deleteNote(
  noteId: InferPathParam<
    (typeof honoClient.api.notes)[":noteId"]["$delete"],
    "noteId"
  >,
) {
  await parseResponse(
    honoClient.api.notes[":noteId"].$delete({
      param: { noteId },
    }),
  );
}
