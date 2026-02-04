import { Search, X } from "lucide-react";
import { useFolderContext } from "../../contexts/FolderContext";
import { useCallback, useState } from "react";

type FolderSearchProps = {
  onSearch?: (query: string) => void;
};

export function FolderSearch({ onSearch }: FolderSearchProps) {
  const { searchQuery, setSearchQuery } = useFolderContext();
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleSearch = useCallback(
    (value: string) => {
      setInputValue(value);
      // Debounce the search
      const timer = setTimeout(() => {
        setSearchQuery(value);
        onSearch?.(value);
      }, 300);
      return () => clearTimeout(timer);
    },
    [setSearchQuery, onSearch]
  );

  const handleClear = () => {
    setInputValue("");
    setSearchQuery("");
    onSearch?.("");
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search notes..."
          value={inputValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
