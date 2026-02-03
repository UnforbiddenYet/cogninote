import { useEffect, useRef, useState } from "react";
import { Link as LinkIcon, AtSign, Check } from "lucide-react";

type Note = {
  id: string;
  title: string;
};

type NoteCommandPopupProps = {
  isOpen: boolean;
  type: "link" | "mention" | null;
  query: string;
  onQueryChange: (query: string) => void;
  filteredNotes: Note[];
  onSelectNote: (note: Note) => void;
  onClose: () => void;
  position?: { x: number; y: number };
};

export function NoteCommandPopup({
  isOpen,
  type,
  query,
  onQueryChange,
  filteredNotes,
  onSelectNote,
  onClose,
  position,
}: NoteCommandPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(-1);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredNotes.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && filteredNotes[selectedIndex]) {
            onSelectNote(filteredNotes[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose, selectedIndex, filteredNotes, onSelectNote]);

  if (!isOpen || !type) return null;

  const icon = type === "link" ? LinkIcon : AtSign;
  const Icon = icon;
  const label = type === "link" ? "Link note" : "Mention note";

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-96 rounded-xl bg-white border border-gray-200 shadow-2xl backdrop-blur-sm animation-in fade-in slide-in-from-top-2 duration-150"
      style={{
        top: position?.y ?? 0,
        left: position?.x ?? 0,
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
          <Icon size={14} strokeWidth={2.5} />
          {label}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setSelectedIndex(-1);
          }}
          placeholder="Search notes..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-950 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Notes List */}
      <div className="max-h-72 overflow-y-auto">
        {filteredNotes.length > 0 ? (
          <div className="py-1">
            {filteredNotes.map((note, index) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`w-full text-left px-4 py-3 transition-all duration-100 flex items-center justify-between group ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="text-sm font-medium truncate">{note.title}</span>
                {index === selectedIndex && (
                  <Check size={16} className="ml-2 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-sm text-gray-500 text-center">
            {query ? (
              <div>
                <p className="font-medium mb-1">No notes found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : (
              <div>
                <p className="font-medium mb-1">Start typing to search</p>
                <p className="text-xs">Find notes to link to your content</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex gap-3">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
