import { useRef, useEffect } from "react";
import { EditorContent } from "@tiptap/react";

import { useMarkdownEditor } from "../../hooks/useMarkdownEditor";
import { Toolbar } from "./Toolbar";

type EditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  saving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
};

export function NoteEditor({
  content,
  onContentChange,
  saving = false,
  lastSaved = null,
  hasUnsavedChanges = false,
}: EditorProps) {
  const isInternalUpdate = useRef(false);
  const isNew = !content.trim();
  const editor = useMarkdownEditor({
    content,
    onCreate: ({ editor }) => {
      if (isNew) {
        // Set an empty H1 without triggering onUpdate — TipTap can't parse "# " from markdown
        editor.commands.setContent("<h1></h1>", { emitUpdate: false });
        editor.commands.focus("start");
      }
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const md = editor.getMarkdown();
      // TipTap renders empty paragraphs as &nbsp; — strip trailing ones and normalize
      const cleaned = md.replace(/(\n\n&nbsp;)+$/, "");
      const newContent = cleaned.replace(/&nbsp;/g, " ").trim() === "" ? "" : cleaned;
      onContentChange(newContent);
    },
  });

  // Sync content from props to editor when it changes externally (e.g., note loaded from API)
  useEffect(() => {
    if (editor && content && !isInternalUpdate.current) {
      const currentContent = editor.getMarkdown();
      if (currentContent !== content) {
        editor.commands.setContent(content, { emitUpdate: false, contentType: 'markdown' });
      }
    }
    isInternalUpdate.current = false;
  }, [editor, content]);

  return (
    <div className="space-y-4">
      <Toolbar editor={editor} >
        <div className="flex items-center gap-3 text-sm flex-1 justify-end">
          {!saving && lastSaved && (
            <span>
              {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
            </span>
          )}
        </div>
      </Toolbar>
      <div className="min-h-screen bg-linear-to-br from-white via-white to-gray-50 relative">
        <EditorContent
          editor={editor}
          className="mx-auto px-2 sm:px-4"
        />
      </div>
    </div>
  );
}
