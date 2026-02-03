import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

type Tag = {
  id: string;
  name: string;
  color?: string;
};

type TagSearchProps = {
  availableTags: Tag[];
  onSelectTag: (tag: Tag) => void;
  onCreateTag: (name: string) => Promise<void>;
  placeholder?: string;
  loading?: boolean;
};

export function TagSearch({
  availableTags,
  onSelectTag,
  onCreateTag,
  placeholder = "Add a tag...",
  loading = false,
}: TagSearchProps) {
  const [searchInput, setSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleCreateTag = async () => {
    if (!searchInput.trim()) return;

    setCreating(true);
    try {
      await onCreateTag(searchInput.trim());
      setSearchInput("");
      setShowDropdown(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={handleCreateTag}
          disabled={!searchInput.trim() || creating || loading}
          className="px-3 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  onSelectTag(tag);
                  setSearchInput("");
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
              >
                {tag.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                )}
                {tag.name}
              </button>
            ))
          ) : searchInput.trim() ? (
            <div className="px-3 py-2 text-sm text-muted">
              Create "{searchInput}" as a new tag
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted">No tags available</div>
          )}
        </div>
      )}
    </div>
  );
}
