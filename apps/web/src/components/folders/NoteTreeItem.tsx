import { FileText } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useFolderContext } from "../../contexts/FolderContext";

type NoteTreeItemProps = {
  noteId: string;
  title: string;
  isSelected?: boolean;
};

export function NoteTreeItem({ noteId, title, isSelected }: NoteTreeItemProps) {
  const navigate = useNavigate();
  const { selectNote } = useFolderContext();

  const handleClick = async () => {
    selectNote(noteId);
    await navigate({
      to: `/app/notes/${noteId}`,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
        isSelected
          ? "bg-blue-100 text-blue-900 font-medium"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
      title={title}
    >
      <FileText size={16} className="flex-shrink-0" />
      <span className="truncate flex-1 text-left">{title}</span>
    </button>
  );
}
