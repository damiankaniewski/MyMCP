import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/api";
import type { ServerInfo, ServerTestResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServerManager() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [test, setTest] = useState<ServerTestResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    setInfo(await api.getServerInfo());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function runTest() {
    setBusy("test");
    setTest(null);
    try {
      setTest(await api.testServer());
    } finally {
      setBusy(null);
    }
  }

  async function rebuild() {
    setBusy("build");
    try {
      await api.generateServer();
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">MCP Server</h1>
        <p className="mt-1 text-slate-500">
          The bridge that exposes your tools to AI assistants.
        </p>
      </header>

      {/* How it works — clears up the "why isn't it running?" confusion */}
      <div className="flex gap-3 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <Icon name="circle-info" className="mt-0.5 text-base text-slate-900" />
        <div>
          <p className="font-medium text-slate-900">
            There's nothing to keep running.
          </p>
          <p className="mt-1">
            Your AI assistant (Claude, Copilot, Cursor) starts this server by
            itself whenever it needs your tools, and closes it when done. So it
            won't show as a constantly-running process — that's normal. Use{" "}
            <span className="font-medium">Test server</span> below to confirm it
            works.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 py-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-500">Status</div>
              <div className="mt-1">
                <Badge tone={info?.built ? "green" : "neutral"}>
                  {info?.built ? "Ready" : "Not built yet"}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">How AI connects</div>
              <div className="mt-1 font-medium">stdio</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Tools exposed</div>
              <div className="mt-1 font-medium">{info?.toolCount ?? "—"}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={busy !== null} onClick={runTest}>
              <Icon name="stethoscope" className="text-sm" />
              {busy === "test" ? "Testing…" : "Test server"}
            </Button>
            <Button variant="outline" disabled={busy !== null} onClick={rebuild}>
              <Icon name="hammer" className="text-sm" />
              {busy === "build" ? "Rebuilding…" : "Rebuild"}
            </Button>
          </div>

          {test && (
            <div
              className={
                "border px-4 py-3 text-sm " +
                (test.ok
                  ? "border-slate-300 bg-slate-50 text-slate-900"
                  : "border-slate-900 bg-slate-50 text-slate-900")
              }
            >
              {test.ok ? (
                <div className="flex items-start gap-2">
                  <Icon name="circle-check" className="mt-0.5 text-sm" />
                  <div>
                    <div className="font-medium">
                      Working — {test.toolCount} tool
                      {test.toolCount === 1 ? "" : "s"} responded.
                    </div>
                    {test.tools.length > 0 && (
                      <div className="mt-1 text-slate-500">
                        {test.tools.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Icon name="circle-exclamation" className="mt-0.5 text-sm" />
                  <div>
                    <div className="font-medium">Server test failed.</div>
                    <div className="mt-1">{test.error}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Connected assistants
        </h2>
        <div className="space-y-2">
          {info?.connections.map((c) => (
            <Card key={c.target}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {c.connected ? (
                    <Icon name="circle-check" className="text-base text-slate-900" />
                  ) : (
                    <Icon name="circle" regular className="text-base text-slate-300" />
                  )}
                  <span className="font-medium">{c.label}</span>
                  {!c.detected && <Badge tone="neutral">Not installed</Badge>}
                </div>
                {c.connected ? (
                  <Badge tone="green">Connected</Badge>
                ) : (
                  c.detected && (
                    <Link to="/export">
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </Link>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
