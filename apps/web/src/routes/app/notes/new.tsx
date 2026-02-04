import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NoteEditor } from "../../../components/editor/NoteEditor";
import { useCreateNote } from "../../../hooks/useNotes";
import { folderKeys } from "../../../hooks/useFolders";

export const Route = createFileRoute("/app/notes/new")({
  validateSearch: (search: any) => ({
    folderId: search?.folderId as string | undefined,
  }),
  component: NewNote,
});

function NewNote() {
  const navigate = useNavigate();
  const search = Route.useSearch() as any;
  const folderId = search?.folderId as string | undefined;
  const queryClient = useQueryClient();
  const createNote = useCreateNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const creationInProgress = useRef(false);

  const attemptCreateNote = async () => {
    if (
      !title.trim() ||
      !content.trim() ||
      hasAttemptedCreation ||
      creationInProgress.current
    ) {
      return;
    }

    creationInProgress.current = true;
    setHasAttemptedCreation(true);

    try {
      const note = await createNote.mutateAsync({
        title: title.trim() || "Untitled",
        content,
        folderId,
      });

      queryClient.invalidateQueries({ queryKey: folderKeys.all });

      navigate({
        to: `/app/notes/${note.id}`,
        search: {
          initialTitle: title,
          initialContent: content,
        },
      });
    } catch (error) {
      console.error("Failed to create note:", error);
      setHasAttemptedCreation(false);
      creationInProgress.current = false;
    }
  };

  useEffect(() => {
    attemptCreateNote();
  }, [title, content]);

  return (
    <div className="space-y-4">
      <NoteEditor
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        saving={createNote.isPending}
        lastSaved={null}
        hasUnsavedChanges={title.length > 0 || content.length > 0}
      />
    </div>
  );
}
