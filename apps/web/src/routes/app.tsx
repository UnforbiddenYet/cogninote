import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { FileText, Network, Search, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const navItems = [
    { icon: FileText, label: "Notes", href: "/app/notes" },
    { icon: Network, label: "Graph", href: "/app/graph" },
    { icon: Search, label: "Search", href: "/app/search" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0"
          } border-r border-border bg-background transition-all duration-200 overflow-hidden flex flex-col`}
      >
        {/* Logo */}
        <div className="border-b border-border p-4">
          <Link to="/app">
            <h1 className="text-lg font-bold text-primary">MindGraph</h1>
          </Link>
          <p className="text-xs text-muted">Knowledge Graph</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                activeProps={{
                  className: "bg-primary/10 text-primary",
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-border/50 transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <button
            onClick={() => navigate({ to: "/app" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-border/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-foreground hover:text-primary transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-sm text-muted">MindGraph</h2>
          </div>
          <div className="w-5 h-5" /> {/* Spacer for balance */}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
