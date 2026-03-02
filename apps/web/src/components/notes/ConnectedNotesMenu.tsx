import { Menu, MenuButton, MenuItems, MenuItem, MenuSeparator } from "@headlessui/react";
import { Link2, Trash } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useRelatedNotes, useDeleteConnection } from "../../hooks/useNotes";

export function ConnectedNotesMenu({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data: connections } = useRelatedNotes(noteId);
  const { mutate: removeConnection } = useDeleteConnection(noteId);

  if (!connections || connections.length === 0) return null;

  function goToNote(targetNoteId: string) {
    navigate({ to: "/app/notes/$noteId", params: { noteId: targetNoteId } });
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-1 p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
        <Link2 size={16} />
        <span className="text-xs font-medium">{connections.length}</span>
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-30 mt-2 min-w-[200px] max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-md py-1 focus:outline-none"
      >
        {connections.map((conn, ind) => (
          <>
            <MenuItem key={conn.id}>
              <div className="group/row max-w-[300px] flex gap-2 items-center px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => goToNote(conn.noteId)}
                  className="flex-1 min-w-0 text-left text-xs text-popover-foreground data-focus:bg-accent data-focus:text-foreground transition-colors truncate cursor-pointer"
                  title={conn.noteTitle}
                >
                  {conn.noteTitle}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeConnection(conn.id);
                  }}
                  className="shrink-0 w-7 flex items-center justify-center text-muted-foreground opacity-0 group-hover/row:opacity-100 hover:text-foreground rounded-xs border border-border/50 p-1 cursor-pointer transition-opacity"
                  title="Disconnect note"
                >
                  <Trash className="h-3 w-3" />
                </button>
              </div>
            </MenuItem>
            {connections.length - 1 !== ind && <MenuSeparator className="my-1 h-px bg-border" />}
          </>
        ))}
      </MenuItems>
    </Menu>
  );
}
