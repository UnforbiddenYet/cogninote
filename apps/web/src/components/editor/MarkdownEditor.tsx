import { EditorContent } from "@tiptap/react";
import { useMarkdownEditor } from "../../hooks/useMarkdownEditor";

export function MarkdownEditor({ content, editable }: { content: string; editable?: boolean }) {
  const editor = useMarkdownEditor({
    content,
    editable,
  });
  return <EditorContent editor={editor} />;
}

export default MarkdownEditor;
