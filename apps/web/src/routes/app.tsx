import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "../lib/auth/authGuard";
import { MagicIsland } from "../components/search/MagicIsland";
import { AccountMenu } from "../components/AccountMenu";
import { useScrollHide } from "../hooks/useScrollHide";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => await requireAuth(),
  component: AppLayout,
});

function AppLayout() {
  const { sentinelRef, hidden: islandHidden } = useScrollHide(true, "-60px 0px 0px 0px");

  return (
    <main className="min-h-screen bg-background relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      {/* Top Chrome */}
      <div
        className={`transition-opacity duration-300${islandHidden ? " opacity-0 pointer-events-none" : ""}`}
      >
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
          <MagicIsland />
        </div>
        <div className="fixed top-8 right-8 z-50">
          <AccountMenu />
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 pt-20">
        <div ref={sentinelRef} className="h-0" aria-hidden="true" />
        <Outlet />
      </div>
    </main>
  );
}
