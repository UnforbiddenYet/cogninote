import { X } from "lucide-react";

type TagBadgeProps = {
  id: string;
  name: string;
  color?: string;
  onRemove?: (id: string) => void;
  disabled?: boolean;
};

export function TagBadge({
  id,
  name,
  color,
  onRemove,
  disabled = false,
}: TagBadgeProps) {
  const baseClasses =
    "flex items-center gap-2 px-3 py-1 rounded-full text-sm";

  const styles = color
    ? {
        backgroundColor: `${color}20`,
        color: color,
        borderLeft: `3px solid ${color}`,
      }
    : { className: "bg-primary/10 text-primary" };

  return (
    <div className={baseClasses} style={styles}>
      {name}
      {onRemove && (
        <button
          onClick={() => onRemove(id)}
          disabled={disabled}
          className="hover:opacity-70 transition-opacity disabled:opacity-50"
          aria-label={`Remove tag ${name}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
