import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Network, Search, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { queryClient } from "../lib/queryClient";
import { signOut } from "../lib/auth/authClient";
import { requireAuth } from "../lib/auth/authGuard";
import { MagicIsland } from "../components/magic-island";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => await requireAuth(),
  component: AppLayout,
});

function AppLayout() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Persistent Magic Island at Top */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
        <MagicIsland />
      </div>

      {/* Content Area */}
      <div className="relative z-10 pt-32">
        <Outlet />
      </div>
    </main>
  )

}
