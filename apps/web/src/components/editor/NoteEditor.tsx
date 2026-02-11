import { useRef, useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { formatDistanceToNow } from "date-fns";

type EditorProps = {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  saving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
};


export function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  saving = false,
  lastSaved = null,
  hasUnsavedChanges = false,
}: EditorProps) {
  const debounceTimer = useRef<NodeJS.Timeout>();
  const hasFocused = useRef(false);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none text-gray-900 prose-headings:text-gray-950 prose-strong:text-gray-950 prose-code:text-gray-950 prose-pre:bg-gray-50 prose-pre:text-gray-950 prose-blockquote:border-l-blue-300 prose-blockquote:text-gray-700",
      },
    },
    content,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const newContent = editor.storage.markdown.getMarkdown();
      onContentChange(newContent);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        // Auto-save happens via parent component
      }, 1000);
    },
  });

  // Sync content from props to editor when it changes externally (e.g., note loaded from API)
  useEffect(() => {
    if (editor && content && !isInternalUpdate.current) {
      const currentContent = editor.storage.markdown.getMarkdown();
      if (currentContent !== content) {
        editor.commands.setContent(content);
      }
    }
    isInternalUpdate.current = false;
  }, [editor, content]);

  // Focus editor after mount if it has content (e.g., after redirect from creation)
  useEffect(() => {
    if (editor && content && !hasFocused.current) {
      // Focus at the end of the content
      setTimeout(() => {
        editor.commands.focus("end");
        hasFocused.current = true;
      }, 0);
    }
  }, [editor, content]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-gray-50 relative">
      <div className="max-w-3xl mx-auto pt-12 pb-20 px-6 sm:px-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled note"
          className="w-full text-5xl font-serif font-bold outline-none bg-transparent text-gray-950 placeholder-gray-400 mb-2 tracking-tight"
        />

        {/* Metadata */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-12 pb-6 border-b border-gray-200">
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          {saving && (
            <span className="flex items-center gap-2 text-amber-600">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Saving...
            </span>
          )}
          {!saving && lastSaved && (
            <span className="text-gray-400">
              {hasUnsavedChanges ? "Unsaved changes" : `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`}
            </span>
          )}
        </div>

        {/* Editor Content */}
        <div className="relative">
          <EditorContent
            editor={editor}
            className="min-h-64 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
