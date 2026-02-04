import { useState, useRef, useEffect } from "react";
import { Plus, Loader, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useFolders, useCreateFolder, useGetFolderNotes } from "../../hooks/useFolders";
import { useFolderContext } from "../../contexts/FolderContext";
import { FolderTreeItem } from "./FolderTreeItem";
import { FolderSearch } from "./FolderSearch";
import { NoteTreeItem } from "./NoteTreeItem";

export function FolderTree() {
  const navigate = useNavigate();
  const { data: foldersData, isLoading, isError } = useFolders();
  const createFolder = useCreateFolder();
  const { expandedFolders, searchQuery, selectedNoteId } = useFolderContext();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isCreatingRef = useRef(false);

  const shouldFetchUncategorized =
    expandedFolders.has("uncategorized") ||
    searchQuery ||
    (foldersData?.uncategorizedCount ?? 0) > 0;

  const { data: uncategorizedNotes = [] } = useGetFolderNotes(
    shouldFetchUncategorized ? null : undefined
  );

  // Focus input when creating folder
  useEffect(() => {
    if (isCreatingFolder && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || isCreatingRef.current) {
      setIsCreatingFolder(false);
      setNewFolderName("");
      return;
    }

    isCreatingRef.current = true;
    try {
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        position: foldersData?.folders.length ?? 0,
      });
      setNewFolderName("");
      setIsCreatingFolder(false);
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleCancelCreate = () => {
    setNewFolderName("");
    setIsCreatingFolder(false);
    isCreatingRef.current = false;
  };

  const handleCreateNote = () => navigate({ to: "/app/notes/new" });

  const filteredFolders = searchQuery
    ? foldersData?.folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []
    : foldersData?.folders ?? [];

  const filteredUncategorizedNotes = searchQuery
    ? uncategorizedNotes.filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : uncategorizedNotes;

  const isEmpty =
    filteredFolders.length === 0 &&
    (foldersData?.uncategorizedCount ?? 0) === 0 &&
    !isLoading;

  return (
    <div className="flex flex-col h-full">
      <FolderSearch />

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCreateNote}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          New Note
        </button>
        <button
          onClick={() => setIsCreatingFolder(true)}
          disabled={isCreatingFolder}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Folder
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader size={20} className="animate-spin text-gray-400" />
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <p className="text-sm text-red-600">Failed to load folders</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isEmpty ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Create your first note</p>
            </div>
          ) : (
            <>
              {/* Inline folder creation */}
              {isCreatingFolder && (
                <div className="flex items-center gap-3.5 px-1 py-1.5 rounded-lg">
                  <ChevronRight size={16} className="text-gray-600" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") handleCancelCreate();
                    }}
                    onBlur={handleCreateFolder}
                    placeholder="Folder name..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    disabled={createFolder.isPending}
                  />
                  {createFolder.isPending && (
                    <Loader size={14} className="animate-spin text-blue-500" />
                  )}
                </div>
              )}

              {/* Existing folders */}
              {filteredFolders.map((folder) => (
                <FolderTreeItem key={folder.id} folder={folder} />
              ))}

              {/* Uncategorized notes */}
              {(foldersData?.uncategorizedCount ?? 0) > 0 &&
                filteredUncategorizedNotes.map((note) => (
                  <NoteTreeItem
                    key={note.id}
                    noteId={note.id}
                    title={note.title}
                    isSelected={selectedNoteId === note.id}
                  />
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
