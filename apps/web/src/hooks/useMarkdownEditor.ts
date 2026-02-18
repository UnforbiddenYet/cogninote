import { useEditor, EditorOptions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";

export function useMarkdownEditor(
  options: Partial<
    Omit<EditorOptions, "extensions" | "editorProps" | "contentType">
  >,
) {
  const editor = useEditor({
    extensions: [
      Markdown,
      StarterKit,
      Details,
      DetailsSummary,
      DetailsContent,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image,
      TableKit,
      Highlight,
      Placeholder.configure({
        placeholder: "Write something …",
      }),
    ],
    editorProps: {
      attributes: {
        class: "min-h-64 focus:outline-none",
      },
    },
    contentType: "markdown",
    ...options,
  });

  return editor;
}
