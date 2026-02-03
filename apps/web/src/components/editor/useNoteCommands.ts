import { useEffect, useState, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";

type Note = {
  id: string;
  title: string;
};

type CommandState = {
  query: string;
  isOpen: boolean;
  type: "link" | "mention" | null;
  position?: { x: number; y: number };
};

export function useNoteCommands(editor: Editor | null) {
  const [state, setState] = useState<CommandState>({
    query: "",
    isOpen: false,
    type: null,
  });
  const [allNotes, setAllNotes] = useState<Note[]>([]);

  // Fetch all notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const apiUrl =
          (typeof window !== "undefined" && (window as any).__API_URL__) ||
          "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/notes?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAllNotes(data.data.notes || []);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    fetchNotes();
  }, []);

  // Handle editor updates to detect commands
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { $from } = editor.state.selection;
      const line = editor.state.doc.textBetween(
        Math.max(0, $from.pos - 100),
        $from.pos,
      );

      // Check for /link command
      const linkMatch = line.match(/\/link\s*$/);
      if (linkMatch) {
        const editorElement = document.querySelector(".ProseMirror");
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();
          setState({
            type: "link",
            isOpen: true,
            query: "",
            position: { x: rect.left, y: rect.top + 100 },
          });
        }
        return;
      }

      // Check for @ mention
      const mentionMatch = line.match(/@(\w*)$/);
      if (mentionMatch) {
        const editorElement = document.querySelector(".ProseMirror");
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();
          setState({
            type: "mention",
            isOpen: true,
            query: mentionMatch[1] || "",
            position: { x: rect.left, y: rect.top + 100 },
          });
        }
        return;
      }

      // Close if no match
      if (state.isOpen) {
        setState({ ...state, isOpen: false });
      }
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, state]);

  const selectNote = useCallback(
    (note: Note) => {
      if (!editor) return;

      const { $from } = editor.state.selection;

      if (state.type === "link") {
        // Remove /link and insert atomic link node
        const linkPos = $from.pos - 5; // length of '/link'
        editor
          .chain()
          .focus()
          .deleteRange({
            from: linkPos,
            to: $from.pos,
          })
          .insertContent({
            type: "atomicLink",
            attrs: {
              href: `/app/notes/${note.id}`,
              title: note.title,
            },
          })
          .run();
      } else if (state.type === "mention") {
        // Find the @ and replace with mention link node
        const text = editor.state.doc.textBetween(
          Math.max(0, $from.pos - 50),
          $from.pos,
        );
        const mentionMatch = text.match(/(@\w*)$/);
        if (mentionMatch) {
          const mentionStart = $from.pos - mentionMatch[0].length;
          editor
            .chain()
            .focus()
            .deleteRange({
              from: mentionStart,
              to: $from.pos,
            })
            .insertContent([
              {
                type: "atomicLink",
                attrs: {
                  href: `/app/notes/${note.id}`,
                  title: `@${note.title}`,
                },
              },
            ])
            .run();
        }
      }

      setState({ ...state, isOpen: false, query: "" });
    },
    [editor, state],
  );

  const filteredNotes = allNotes.filter((note) =>
    note.title.toLowerCase().includes(state.query.toLowerCase()),
  );

  return {
    state,
    selectNote,
    filteredNotes,
    setQuery: (query: string) => setState({ ...state, query }),
    close: () => setState({ ...state, isOpen: false }),
  };
}
