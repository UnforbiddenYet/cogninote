import { useState, useCallback, useRef, useEffect } from "react";

type EditorProps = {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  saving?: boolean;
};

export function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  saving = false,
}: EditorProps) {
  const [debouncedContent, setDebouncedContent] = useState(content);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const handleContentChange = useCallback(
    (newContent: string) => {
      setDebouncedContent(newContent);
      onContentChange(newContent);

      // Debounce auto-save
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        // Auto-save happens via parent component
      }, 1000);
    },
    [onContentChange]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title..."
          className="text-3xl font-bold outline-none bg-transparent text-foreground placeholder-muted w-full"
        />
        {saving && <span className="text-xs text-muted">Saving...</span>}
      </div>

      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Write in markdown..."
        className="w-full h-96 p-4 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="text-xs text-muted">
        {content.split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  );
}
