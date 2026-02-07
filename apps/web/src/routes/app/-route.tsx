import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Network, Search, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { FolderProvider } from "../../contexts/FolderContext";
import { FolderTree } from "../../components/folders/FolderTree";
import { fetchFolders } from "../../lib/api/folders";
import { queryClient } from "../../lib/queryClient";
import { signOut } from "../../lib/auth/authClient";
import { requireAuth } from "../../lib/auth/authGuard";
import { MagicIsland } from "../../components/magic-island";

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

// const TopBar = () => (
//   <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
//     <div className="flex items-center gap-4">
//       <button
//         onClick={() => setSidebarOpen(!sidebarOpen)}
//         className="text-gray-700 hover:text-gray-900 transition-colors"
//       >
//         {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//       </button>
//       <div>
//         <h2 className="text-sm font-semibold text-gray-900">MindGraph</h2>
//         <p className="text-xs text-gray-500">Knowledge Graph</p>
//       </div>
//     </div>

//     {/* Top Right Actions */}
//     <div className="flex items-center gap-2">
//       <button
//         onClick={() => navigate({ to: "/app" })}
//         className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//         title="Settings"
//       >
//         <Settings className="w-5 h-5" />
//       </button>
//       <button
//         onClick={handleLogout}
//         className="p-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
//         title="Logout"
//       >
//         <LogOut className="w-5 h-5" />
//       </button>
//     </div>
//   </header>
// )