import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-primary">MindGraph</h1>
          <p className="text-sm text-muted">AI-Powered Personal Knowledge Graph</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
