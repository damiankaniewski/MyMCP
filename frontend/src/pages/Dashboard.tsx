import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Wrench,
  Plug,
  Activity,
  Pencil,
  Trash2,
  Upload,
  Download,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Project, ServerInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wrench;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [p, i] = await Promise.all([api.getProject(), api.getServerInfo()]);
    setProject(p);
    setInfo(i);
    setName(p.name);
    setDescription(p.description);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveMeta() {
    await api.updateProject({ name, description });
    setEditingMeta(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    refresh();
  }

  async function removeTool(id: string) {
    if (!confirm("Delete this tool?")) return;
    await api.deleteTool(id);
    refresh();
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await api.importProject(JSON.parse(text));
      refresh();
    } catch (err) {
      alert("Could not import file: " + (err as Error).message);
    }
    e.target.value = "";
  }

  if (!project) {
    return <div className="text-slate-400">Loading…</div>;
  }

  const connectedCount =
    info?.connections.filter((c) => c.connected).length ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {editingMeta ? (
            <div className="space-y-3">
              <div>
                <Label>Project name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>What is this server for?</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveMeta} size="sm">
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingMeta(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="group flex items-start gap-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-slate-500">{project.description}</p>
              </div>
              <button
                onClick={() => setEditingMeta(true)}
                className="mt-2 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 group-hover:opacity-100"
                title="Edit project"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {saved && (
                <Badge tone="green" className="mt-2">
                  <Check className="h-3 w-3" /> Saved
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImport}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <a href="/api/export/project.json" download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Export
            </Button>
          </a>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Wrench} label="Tools" value={project.tools.length} />
        <StatCard icon={Plug} label="Integrations" value={project.integrations.length} />
        <StatCard
          icon={Activity}
          label="Connected AI"
          value={
            <Badge tone={connectedCount > 0 ? "green" : "neutral"}>
              {connectedCount > 0
                ? `${connectedCount} connected`
                : info?.built
                ? "Ready"
                : "—"}
            </Badge>
          }
        />
      </div>

      <Button size="lg" className="w-full" onClick={() => navigate("/tools/new")}>
        <Plus className="h-5 w-5" /> Add a new tool
      </Button>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Your tools
        </h2>
        {project.tools.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No tools yet. Click “Add a new tool” to create your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {project.tools.map((tool) => (
              <Card key={tool.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tool.name}</span>
                      <Badge tone="indigo">{tool.executionType}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {tool.description}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/tools/${tool.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTool(tool.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
