import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import Dashboard from "@/pages/Dashboard";
import ToolWizard from "@/pages/ToolWizard";
import Integrations from "@/pages/Integrations";
import ExportWizard from "@/pages/ExportWizard";

const nav = [
  { to: "/", label: "Dashboard", icon: "gauge-high", end: true },
  { to: "/tools/new", label: "New tool", icon: "wrench" },
  { to: "/integrations", label: "Integrations", icon: "plug" },
  { to: "/export", label: "Connect to AI", icon: "share-nodes" },
];

function Sidebar() {
  return (
    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white">
          <Icon name="cubes" className="text-base" />
        </div>
        <span className="text-lg font-semibold tracking-tight">MyMCP</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {nav.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )
            }
          >
            <Icon name={icon} className="w-5 text-center" />
            {label}
          </NavLink>
        ))}
      </nav>
      <a
        href="https://github.com/damiankaniewski/MyMCP"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto mx-3 mb-4 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Icon name="github" brand className="w-5 text-center text-base" />
        <span>Star on GitHub</span>
        <Icon name="arrow-up-right-from-square" className="ml-auto text-xs text-slate-400" />
      </a>
    </aside>
  );
}

export default function App() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-end border-b border-slate-200 bg-white px-6">
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-8 py-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tools/new" element={<ToolWizard />} />
              <Route path="/tools/:id" element={<ToolWizard />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/export" element={<ExportWizard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
