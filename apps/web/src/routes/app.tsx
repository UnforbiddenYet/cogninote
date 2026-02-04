import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Network, Search, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { FolderProvider } from "../contexts/FolderContext";
import { FolderTree } from "../components/folders/FolderTree";
import { fetchFolders } from "../lib/api/folders";
import { queryClient } from "../lib/queryClient";

export const Route = createFileRoute("/app")({
  loader: async () => {
    try {
      const foldersData = await queryClient.ensureQueryData({
        queryKey: ["folders"],
        queryFn: () => fetchFolders(),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
      return { foldersData };
    } catch {
      // If loading fails, return empty data and let the component handle it
      return { foldersData: null };
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const bottomNavItems = [
    { icon: Network, label: "Graph", href: "/app/graph" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("folder_tree_expanded");
    localStorage.removeItem("folder_tree_selected_note");
    localStorage.removeItem("folder_tree_selected_folder");
    navigate({ to: "/auth/login" });
  };

  return (
    <FolderProvider>
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "w-80" : "w-0"
            } border-r border-gray-200 bg-white transition-all duration-200 overflow-hidden flex flex-col`}
        >
          {/* Logo */}
          <div className="border-b border-gray-200 p-4">
            <Link to="/app">
              <h1 className="text-lg font-bold text-gray-900">MindGraph</h1>
            </Link>
            <p className="text-xs text-gray-500">Knowledge Graph</p>
          </div>

          {/* Folder Tree */}
          <nav className="flex-1 overflow-hidden flex flex-col p-4">
            <FolderTree />
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  activeProps={{
                    className: "bg-blue-100 text-blue-600",
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          {/* <TopBar/> */}

          {/* Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </FolderProvider>
  );
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