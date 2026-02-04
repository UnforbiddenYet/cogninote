import { useState, useEffect } from "react";
import { TagBadge } from "./TagBadge";
import { TagSearch } from "./TagSearch";
import { apiRequest } from "../../lib/api/apiClient";

type Tag = {
  id: string;
  name: string;
  color?: string;
};

type TagsManagerProps = {
  noteId: string;
  noteTags: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  loading?: boolean;
};

export function TagsManager({
  noteId,
  noteTags,
  onTagsChange,
  loading = false,
}: TagsManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tags, setTags] = useState<Tag[]>(noteTags);

  useEffect(() => {
    setTags(noteTags);
  }, [noteTags]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await apiRequest<{ data: { tags: Tag[] } }>("/api/tags");
        setAllTags(data.data.tags || []);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };

    fetchTags();
  }, []);

  const availableTags = allTags.filter(
    (tag) => !tags.find((t) => t.id === tag.id)
  );

  const handleAddTag = async (tag: Tag) => {
    try {
      await apiRequest(`/api/tags/${tag.id}/notes/${noteId}`, {
        method: "POST",
      });

      const newTags = [...tags, tag];
      setTags(newTags);
      setAllTags(allTags.filter((t) => t.id !== tag.id));
      onTagsChange?.(newTags);
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await apiRequest(`/api/tags/${tagId}/notes/${noteId}`, {
        method: "DELETE",
      });

      const removedTag = tags.find((t) => t.id === tagId);
      const newTags = tags.filter((t) => t.id !== tagId);
      setTags(newTags);
      if (removedTag) {
        setAllTags([...allTags, removedTag]);
      }
      onTagsChange?.(newTags);
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const handleCreateTag = async (name: string) => {
    try {
      const data = await apiRequest<{ data: { tag: Tag } }>("/api/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const newTag = data.data.tag;

      // Add to note
      await apiRequest(`/api/tags/${newTag.id}/notes/${noteId}`, {
        method: "POST",
      });

      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      setAllTags([...allTags, newTag]);
      onTagsChange?.(updatedTags);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Tags</label>

      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={handleRemoveTag}
              disabled={loading}
            />
          ))}
        </div>
      )}

      {/* Add tag input */}
      <TagSearch
        availableTags={availableTags}
        onSelectTag={handleAddTag}
        onCreateTag={handleCreateTag}
        loading={loading}
      />
    </div>
  );
}
