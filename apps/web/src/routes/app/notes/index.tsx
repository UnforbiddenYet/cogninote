import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/app/notes/")({
  component: NotesPage,
});

function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
      <div className="space-y-2">
        <FileText size={48} className="mx-auto text-gray-400" />
        <h1 className="text-3xl font-bold text-gray-900">No Note Selected</h1>
        <p className="text-gray-600 max-w-md">
          Select a note from the sidebar to view and edit it, or create a new one using the "New Note" button.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md text-sm text-gray-700">
        <p className="font-semibold mb-2">Getting started:</p>
        <ul className="space-y-1 text-left text-sm">
          <li>✨ Click <span className="font-mono bg-gray-200 px-1 rounded">New Note</span> to create a note</li>
          <li>📁 Click <span className="font-mono bg-gray-200 px-1 rounded">Folder</span> to organize your notes</li>
          <li>🔍 Use search to find notes quickly</li>
        </ul>
      </div>
    </div>
  );
}
