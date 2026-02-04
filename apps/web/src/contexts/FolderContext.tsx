import { createContext, useContext, useState, useEffect } from "react";

export interface FolderContextType {
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  searchQuery: string;

  selectNote: (noteId: string) => void;
  deselectNote: () => void;
  selectFolder: (folderId: string) => void;
  deselectFolder: () => void;
  toggleFolder: (folderId: string) => void;
  setSearchQuery: (query: string) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

const EXPANDED_FOLDERS_STORAGE_KEY = "folder_tree_expanded";
const SELECTED_NOTE_STORAGE_KEY = "folder_tree_selected_note";
const SELECTED_FOLDER_STORAGE_KEY = "folder_tree_selected_folder";

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedExpandedFolders = localStorage.getItem(EXPANDED_FOLDERS_STORAGE_KEY);
    const savedSelectedNote = localStorage.getItem(SELECTED_NOTE_STORAGE_KEY);
    const savedSelectedFolder = localStorage.getItem(SELECTED_FOLDER_STORAGE_KEY);

    if (savedExpandedFolders) {
      try {
        const folders = JSON.parse(savedExpandedFolders);
        setExpandedFolders(new Set(folders));
      } catch (e) {
        console.error("Failed to parse expanded folders from storage", e);
      }
    }

    if (savedSelectedNote) {
      setSelectedNoteId(savedSelectedNote);
    }

    if (savedSelectedFolder) {
      setSelectedFolderId(savedSelectedFolder);
    }

    setIsHydrated(true);
  }, []);

  // Save expanded folders to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify([...expandedFolders]));
    }
  }, [expandedFolders, isHydrated]);

  // Save selected note to localStorage when it changes
  useEffect(() => {
    if (isHydrated && selectedNoteId) {
      localStorage.setItem(SELECTED_NOTE_STORAGE_KEY, selectedNoteId);
    }
  }, [selectedNoteId, isHydrated]);

  // Save selected folder to localStorage when it changes
  useEffect(() => {
    if (isHydrated && selectedFolderId) {
      localStorage.setItem(SELECTED_FOLDER_STORAGE_KEY, selectedFolderId);
    }
  }, [selectedFolderId, isHydrated]);

  const selectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const deselectNote = () => {
    setSelectedNoteId(null);
    if (isHydrated) {
      localStorage.removeItem(SELECTED_NOTE_STORAGE_KEY);
    }
  };

  const selectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    // Auto-expand the selected folder
    setExpandedFolders((prev) => new Set([...prev, folderId]));
  };

  const deselectFolder = () => {
    setSelectedFolderId(null);
    if (isHydrated) {
      localStorage.removeItem(SELECTED_FOLDER_STORAGE_KEY);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const value: FolderContextType = {
    selectedNoteId,
    selectedFolderId,
    expandedFolders,
    searchQuery,
    selectNote,
    deselectNote,
    selectFolder,
    deselectFolder,
    toggleFolder,
    setSearchQuery,
  };

  return <FolderContext.Provider value={value}>{children}</FolderContext.Provider>;
}

export function useFolderContext() {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error("useFolderContext must be used within a FolderProvider");
  }
  return context;
}
