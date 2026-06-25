import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Plug,
  Server,
  Share2,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Dashboard from "@/pages/Dashboard";
import ToolWizard from "@/pages/ToolWizard";
import Integrations from "@/pages/Integrations";
import ServerManager from "@/pages/ServerManager";
import ExportWizard from "@/pages/ExportWizard";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tools/new", label: "New tool", icon: Wrench },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/server", label: "MCP Server", icon: Server },
  { to: "/export", label: "Connect to AI", icon: Share2 },
];

function Sidebar() {
  return (
    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Boxes className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold">MyMCP</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-6 py-6 text-xs text-slate-400">
        Build your own AI tools — no code required.
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tools/new" element={<ToolWizard />} />
            <Route path="/tools/:id" element={<ToolWizard />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/server" element={<ServerManager />} />
            <Route path="/export" element={<ExportWizard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
