import { useState } from "react";
import { ChevronRight, Folder, Trash2, Edit2 } from "lucide-react";
import { useFolderContext } from "../../contexts/FolderContext";
import { useGetFolderNotes, useDeleteFolder, useUpdateFolder } from "../../hooks/useFolders";
import { NoteTreeItem } from "./NoteTreeItem";
import { type FolderWithNoteCount } from "../../lib/api/folders";

type FolderTreeItemProps = {
  folder: FolderWithNoteCount;
};

export function FolderTreeItem({ folder }: FolderTreeItemProps) {
  const { expandedFolders, toggleFolder, selectedNoteId } = useFolderContext();
  const isExpanded = expandedFolders.has(folder.id);
  const { data: notes = [] } = useGetFolderNotes(isExpanded ? folder.id : null);
  const deleteFolder = useDeleteFolder();
  const updateFolder = useUpdateFolder();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleToggle = () => {
    toggleFolder(folder.id);
    // Persist the expanded state
    if (!isExpanded) {
      updateFolder.mutate({ folderId: folder.id, updates: { isExpanded: true } });
    } else {
      updateFolder.mutate({ folderId: folder.id, updates: { isExpanded: false } });
    }
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== folder.name) {
      await updateFolder.mutateAsync({
        folderId: folder.id,
        updates: { name: newName.trim() },
      });
    }
    setIsRenaming(false);
    setNewName(folder.name);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete folder "${folder.name}"? Notes will be moved to Uncategorized.`)) {
      await deleteFolder.mutateAsync(folder.id);
    }
  };

  return (
    <div className="select-none">
      <div className="flex items-center gap-1 relative">
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors ${isExpanded ? "rotate-90" : ""
            }`}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded-md group">
          {isRenaming ? (
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setIsRenaming(false);
                  setNewName(folder.name);
                }
              }}
              className="flex-1 px-2 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Folder name"
            />
          ) : (
            <span className="text-sm font-medium text-gray-900 flex-1">{folder.name}</span>
          )}

          {isRenaming ? null : (<div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => setIsRenaming(true)}
              className="p-1 rounded hover:bg-gray-300 text-gray-600"
              title="Rename"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete()}
              className="p-1 rounded hover:bg-gray-300 text-gray-600"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>)}
        </div>
      </div>


      {isExpanded && (
        <div className="ml-4 space-y-1 mt-1">
          {notes.map((note) => (
            <NoteTreeItem
              key={note.id}
              noteId={note.id}
              title={note.title}
              isSelected={selectedNoteId === note.id}
            />
          ))
          }
        </div>
      )}
    </div>
  );
}
