import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Network, Search, Plus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate({ to: "/auth/login" });
        return;
      }

      try {
        const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          navigate({ to: "/auth/login" });
          return;
        }

        const data = await response.json();
        setUser(data.data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        navigate({ to: "/auth/login" });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-pulse">
            <p className="text-muted text-sm">Loading your vault...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-base text-muted">
          Build your personal knowledge graph by connecting ideas and insights.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Create Note Card */}
        <Link
          to="/app/notes/new"
          className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Create Note</h3>
              <p className="text-sm text-muted mt-1">Start documenting your ideas</p>
            </div>
          </div>
        </Link>

        {/* Graph Card */}
        <Link
          to="/app/graph"
          className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Network className="w-6 h-6 text-primary" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Explore Graph</h3>
              <p className="text-sm text-muted mt-1">Visualize your knowledge network</p>
            </div>
          </div>
        </Link>

        {/* Search Card */}
        <Link
          to="/app/search"
          className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Search</h3>
              <p className="text-sm text-muted mt-1">Find notes and connections</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="rounded-xl border border-border bg-background/50 p-6">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Account</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Email</p>
              <p className="text-foreground font-mono text-sm">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">User ID</p>
              <p className="text-foreground font-mono text-xs break-all">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="rounded-xl border border-border bg-background/50 p-6">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Getting Started</h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <span className="text-primary">→</span> Create your first note
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">→</span> Link related ideas together
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">→</span> Explore your knowledge graph
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
