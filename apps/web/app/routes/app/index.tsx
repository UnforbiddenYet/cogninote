import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
        const response = await fetch(
          `${apiUrl}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
      <div className="flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Welcome, {user?.name}!
        </h2>
        <p className="text-muted">
          Start building your knowledge graph by creating notes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 font-bold text-foreground">📝 Create Note</h3>
          <p className="text-sm text-muted">Start documenting your ideas</p>
        </div>
        <div className="card">
          <h3 className="mb-2 font-bold text-foreground">🔗 Connect Ideas</h3>
          <p className="text-sm text-muted">Link related concepts together</p>
        </div>
        <div className="card">
          <h3 className="mb-2 font-bold text-foreground">🧠 AI Insights</h3>
          <p className="text-sm text-muted">Get smart suggestions and tags</p>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 font-bold text-foreground">Session Info</h3>
        <p className="text-sm text-muted">Email: {user?.email}</p>
        <p className="text-sm text-muted">User ID: {user?.id}</p>
        <button
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigate({ to: "/auth/login" });
          }}
          className="btn-secondary mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
