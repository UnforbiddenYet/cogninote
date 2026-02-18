import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { NoteCard } from "./notes/NoteCard";
import { useNotes, useDeleteNote } from "../hooks/useNotes";

const PAGE_SIZE = 7;

export function NotesLibrary() {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data, isLoading, isError, error } = useNotes({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });

  const deleteNote = useDeleteNote();

  const notes = data?.notes ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Notes Library
            </h1>
            {total > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {total} {total === 1 ? "note" : "notes"}
              </p>
            )}
          </div>
          <Link
            to="/app/new-note"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Link>
        </div>

        {/* Content */}
        <div className="p-5 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-destructive">
                {error?.message ?? "Failed to load notes"}
              </p>
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={() => deleteNote.mutate(note.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 rounded-full bg-primary/5 mb-2">
                <FileText className="h-6 w-6 text-primary/60" />
              </div>
              <p className="text-xs text-muted-foreground">No notes yet</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-card/80 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-card/80 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
