import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-primary">MindGraph Dashboard</h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
