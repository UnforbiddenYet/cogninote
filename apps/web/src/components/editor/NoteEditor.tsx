import { useRef, useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { formatDistanceToNow } from "date-fns";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Redo,
  Undo,
  Plus,
  Slash,
} from "lucide-react";
import { useNoteCommands } from "./useNoteCommands";
import { NoteCommandPopup } from "./NoteCommandPopup";
import { AtomicLink } from "./AtomicLink";

type EditorProps = {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  saving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
};

function FloatingToolbar({
  editor,
  position,
}: {
  editor: Editor | null;
  position?: { x: number; y: number };
}) {
  if (!editor || !position) return null;

  const Button = ({
    onClick,
    isActive,
    icon: Icon,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: typeof Bold;
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md transition-all duration-150 ${isActive
          ? "bg-blue-100 text-blue-600"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );

  return (
    <div
      className="fixed z-50 flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg shadow-xl backdrop-blur-sm"
      style={{
        top: `${position.y - 48}px`,
        left: `${Math.max(16, position.x - 100)}px`,
      }}
    >
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={Bold}
        title="Bold (Ctrl+B)"
      />
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={Italic}
        title="Italic (Ctrl+I)"
      />
      <div className="w-px h-5 bg-gray-200 mx-0.5" />
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon={Heading2}
        title="Heading 2"
      />
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={List}
        title="Bullet List"
      />
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={Quote}
        title="Blockquote"
      />
    </div>
  );
}

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
  const [toolbarPosition, setToolbarPosition] = useState<
    { x: number; y: number } | undefined
  >();

  const editor = useEditor({
    extensions: [
      StarterKit,
      AtomicLink,
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

  const {
    state: commandState,
    selectNote,
    filteredNotes,
    setQuery,
    close: closeCommand,
  } = useNoteCommands(editor);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Text is selected
        const view = editor.view;
        const coords = view.coordsAtPos(from);
        setToolbarPosition({
          x: coords.left,
          y: coords.top,
        });
      } else {
        setToolbarPosition(undefined);
      }
    };

    if (editor) {
      editor.on("selectionUpdate", handleSelectionChange);
      return () => {
        editor.off("selectionUpdate", handleSelectionChange);
      };
    }
  }, [editor]);

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

  const wordCount = content
    .replace(/<[^>]*>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

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
          <span>{wordCount} words</span>
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

          {/* Floating Toolbar */}
          <FloatingToolbar editor={editor} position={toolbarPosition} />

          {/* Command Palette Popup */}
          <NoteCommandPopup
            isOpen={commandState.isOpen}
            type={commandState.type}
            query={commandState.query}
            onQueryChange={setQuery}
            filteredNotes={filteredNotes}
            onSelectNote={selectNote}
            onClose={closeCommand}
            position={commandState.position}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
          <Slash size={14} />
          <span>Type / for commands • Type @ to mention • /link to insert links</span>
        </div>
      </div>
    </div>
  );
}
