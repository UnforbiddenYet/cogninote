import { type Editor, useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  FileCode,
  Highlighter,
  Minus,
  Undo,
  Redo,
  type LucideIcon,
} from "lucide-react";

type ToolbarButton = {
  icon: LucideIcon;
  label: string;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
};

type ToolbarGroup = ToolbarButton[];

const toolbarGroups: ToolbarGroup[] = [
  // Text
  [
    {
      icon: Bold,
      label: "Bold",
      action: (e) => e.chain().focus().toggleBold().run(),
      isActive: (e) => e.isActive("bold"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: (e) => e.chain().focus().toggleItalic().run(),
      isActive: (e) => e.isActive("italic"),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: (e) => e.chain().focus().toggleStrike().run(),
      isActive: (e) => e.isActive("strike"),
    },
    {
      icon: Code,
      label: "Inline Code",
      action: (e) => e.chain().focus().toggleCode().run(),
      isActive: (e) => e.isActive("code"),
    },
  ],
  // Headings
  [
    {
      icon: Heading1,
      label: "Heading 1",
      action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: (e) => e.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (e) => e.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: (e) => e.isActive("heading", { level: 3 }),
    },
  ],
  // Lists
  [
    {
      icon: List,
      label: "Bullet List",
      action: (e) => e.chain().focus().toggleBulletList().run(),
      isActive: (e) => e.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "Ordered List",
      action: (e) => e.chain().focus().toggleOrderedList().run(),
      isActive: (e) => e.isActive("orderedList"),
    },
    {
      icon: ListTodo,
      label: "Task List",
      action: (e) => e.chain().focus().toggleTaskList().run(),
      isActive: (e) => e.isActive("taskList"),
    },
  ],
  // Blocks
  [
    {
      icon: Quote,
      label: "Blockquote",
      action: (e) => e.chain().focus().toggleBlockquote().run(),
      isActive: (e) => e.isActive("blockquote"),
    },
    {
      icon: FileCode,
      label: "Code Block",
      action: (e) => e.chain().focus().toggleCodeBlock().run(),
      isActive: (e) => e.isActive("codeBlock"),
    },
    {
      icon: Highlighter,
      label: "Highlight",
      action: (e) => e.chain().focus().toggleHighlight().run(),
      isActive: (e) => e.isActive("highlight"),
    },
    {
      icon: Minus,
      label: "Horizontal Rule",
      action: (e) => e.chain().focus().setHorizontalRule().run(),
    },
  ],
  // History
  [
    {
      icon: Undo,
      label: "Undo",
      action: (e) => e.chain().focus().undo().run(),
      isDisabled: (e) => !e.can().undo(),
    },
    {
      icon: Redo,
      label: "Redo",
      action: (e) => e.chain().focus().redo().run(),
      isDisabled: (e) => !e.can().redo(),
    },
  ],
];

export function Toolbar({
  editor,
  children,
}: {
  editor: Editor | null;
  children: React.ReactNode;
}) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;
      const e = ctx.editor;
      return toolbarGroups.map((group) =>
        group.map((btn) => ({
          active: btn.isActive?.(e) ?? false,
          disabled: btn.isDisabled?.(e) ?? false,
        })),
      );
    },
  });

  if (!editor || !state) return null;

  return (
    <div className="bg-background border-b border-border flex items-center gap-0.5 px-2 py-1.5 flex-wrap">
      {toolbarGroups.map((group, gi) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static toolbar groups
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="border-r border-border h-5 mx-1" />}
          {group.map((btn, bi) => {
            const { active, disabled } = state[gi][bi];
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
                type="button"
                title={btn.label}
                disabled={disabled}
                onClick={() => btn.action(editor)}
                className={`p-1.5 rounded-md transition-colors ${
                  disabled
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      ))}
      {children}
    </div>
  );
}
