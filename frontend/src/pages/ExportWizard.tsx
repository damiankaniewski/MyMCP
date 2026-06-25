import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api, type InstallResult, type InstallTargetStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  {
    key: "claude",
    label: "Claude",
    hint: "Paste into claude_desktop_config.json (Desktop) or ~/.claude.json (CLI)",
  },
  {
    key: "copilot",
    label: "GitHub Copilot",
    hint: "Paste into VS Code's mcp.json",
  },
  { key: "cursor", label: "Cursor", hint: "Paste into ~/.cursor/mcp.json" },
] as const;

export default function ExportWizard() {
  const [serverName, setServerName] = useState("");
  const [configs, setConfigs] = useState<Record<string, unknown>>({});
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("claude");
  const [copied, setCopied] = useState(false);
  const [targets, setTargets] = useState<InstallTargetStatus[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, InstallResult>>({});

  useEffect(() => {
    api.getExportConfigs().then((r) => {
      setServerName(r.serverName);
      setConfigs(r.configs);
    });
    api.getInstallTargets().then(setTargets);
  }, []);

  async function autoConnect(target: string) {
    setInstalling(target);
    try {
      const res = await api.installToClient(target);
      setResults((r) => ({ ...r, [target]: res }));
    } finally {
      setInstalling(null);
    }
  }

  const snippet = JSON.stringify(configs[tab] ?? {}, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Connect to your AI assistant</h1>
        <p className="mt-1 text-slate-500">
          Your server is named <code className="rounded bg-slate-100 px-1.5">{serverName}</code>.
          Pick your assistant and copy the snippet.
        </p>
      </header>

      {/* One-click auto configuration */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="bolt" className="text-sm text-slate-900" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Connect automatically — no copying
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {targets.map((t) => {
            const result = results[t.target];
            return (
              <Card key={t.target}>
                <CardContent className="flex h-full flex-col gap-3 py-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t.label}</span>
                    {t.detected ? (
                      <Badge tone="green">Installed</Badge>
                    ) : (
                      <Badge tone="neutral">Not found</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={t.detected ? "primary" : "outline"}
                    disabled={!t.detected || installing === t.target}
                    onClick={() => autoConnect(t.target)}
                  >
                    {installing === t.target ? (
                      "Connecting…"
                    ) : (
                      <>
                        <Icon name="bolt" className="text-sm" /> Connect
                      </>
                    )}
                  </Button>
                  {result && (
                    <div
                      className={cn(
                        "flex items-start gap-2 border px-3 py-2 text-xs",
                        result.ok
                          ? "border-slate-300 bg-slate-50 text-slate-900"
                          : "border-slate-900 bg-slate-50 text-slate-900"
                      )}
                    >
                      {result.ok ? (
                        <Icon name="circle-check" className="mt-0.5 text-xs" />
                      ) : (
                        <Icon name="circle-exclamation" className="mt-0.5 text-xs" />
                      )}
                      <span>{result.message}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">
          We add your server to the app's config file (backing up the old one
          first). Already-configured servers are kept.
        </p>
      </section>

      <div className="pt-2">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Or copy the snippet manually
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <p className="text-sm text-slate-500">
            {TABS.find((t) => t.key === tab)?.hint}
          </p>
          <div className="relative">
            <pre className="overflow-auto border border-slate-900 bg-slate-900 p-4 text-xs text-slate-100">
              {snippet}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute right-3 top-3"
              onClick={copy}
            >
              <Icon name={copied ? "check" : "copy"} className="text-sm" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <div className="font-medium">Export project file</div>
            <div className="text-sm text-slate-500">
              Download <code>project.json</code> to back up or share your setup.
            </div>
          </div>
          <a href="/api/export/project.json" download>
            <Button variant="outline">
              <Icon name="download" className="text-sm" /> Download project.json
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
