import { Node } from "@tiptap/core";

export const AtomicLink = Node.create({
  name: "atomicLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[href^="/app/notes/"]',
        getAttrs: (node: any) => {
          const href = (node as HTMLElement).getAttribute("href");
          const title = (node as HTMLElement).textContent;
          return { href, title };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }: any) {
    return ["a", HTMLAttributes, node.attrs.title || node.attrs.href];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }: any) => {
        const { $from, $to } = editor.state.selection;

        // Get the previous node (node before the cursor)
        const prev = $from.nodeBefore;
        if (prev && prev.type.name === this.name) {
          // Delete the previous atomic link node
          return editor
            .chain()
            .focus()
            .deleteRange({ from: $from.pos - prev.nodeSize, to: $from.pos })
            .run();
        }

        return false;
      },
    };
  },
});
