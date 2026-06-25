import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api, type IntegrationInput } from "@/lib/api";
import type { Integration, IntegrationType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CredField {
  key: string;
  label: string;
  secret?: boolean;
}

const PRESETS: Record<
  IntegrationType,
  { label: string; baseUrl: string; creds: CredField[] }
> = {
  jira: {
    label: "Jira",
    baseUrl: "https://your-domain.atlassian.net",
    creds: [
      { key: "email", label: "Account email" },
      { key: "apiToken", label: "API token", secret: true },
    ],
  },
  github: {
    label: "GitHub",
    baseUrl: "https://api.github.com",
    creds: [{ key: "token", label: "Personal access token", secret: true }],
  },
  slack: {
    label: "Slack",
    baseUrl: "https://slack.com/api",
    creds: [{ key: "token", label: "Bot token (xoxb-…)", secret: true }],
  },
  notion: {
    label: "Notion",
    baseUrl: "https://api.notion.com",
    creds: [{ key: "token", label: "Integration token", secret: true }],
  },
  rest: {
    label: "Custom REST API",
    baseUrl: "https://api.example.com",
    creds: [{ key: "apiKey", label: "API key (optional)", secret: true }],
  },
};

const emptyForm = (type: IntegrationType): IntegrationInput => ({
  type,
  name: PRESETS[type].label,
  baseUrl: PRESETS[type].baseUrl,
  credentials: {},
});

export default function Integrations() {
  const [items, setItems] = useState<Integration[]>([]);
  const [form, setForm] = useState<IntegrationInput | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  async function refresh() {
    setItems(await api.getIntegrations());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!form) return;
    await api.createIntegration(form);
    setForm(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this integration?")) return;
    await api.deleteIntegration(id);
    refresh();
  }

  async function test(id: string) {
    setTestResult((r) => ({ ...r, [id]: "Testing…" }));
    const res = await api.testIntegration(id);
    setTestResult((r) => ({
      ...r,
      [id]: (res.ok ? "OK — " : "Failed — ") + res.message,
    }));
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="mt-1 text-slate-500">
            Connect the services your tools should talk to.
          </p>
        </div>
        {!form && (
          <Button onClick={() => setForm(emptyForm("jira"))}>
            <Icon name="plus" className="text-sm" /> Add integration
          </Button>
        )}
      </header>

      {form && (
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Service</Label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm(emptyForm(e.target.value as IntegrationType))}
                >
                  {(Object.keys(PRESETS) as IntegrationType[]).map((t) => (
                    <option key={t} value={t}>
                      {PRESETS[t].label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Display name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Base URL</Label>
              <Input
                value={form.baseUrl ?? ""}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              />
            </div>
            {PRESETS[form.type].creds.map((c) => (
              <div key={c.key}>
                <Label>{c.label}</Label>
                <Input
                  type={c.secret ? "password" : "text"}
                  value={form.credentials[c.key] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      credentials: { ...form.credentials, [c.key]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={save}>Save integration</Button>
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !form ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No integrations yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-900">
                    <Icon name="plug" className="text-base" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      {it.name}
                      <Badge tone="indigo">{it.type}</Badge>
                    </div>
                    <div className="text-sm text-slate-500">{it.baseUrl}</div>
                    {testResult[it.id] && (
                      <div className="mt-1 text-xs text-slate-600">
                        {testResult[it.id]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => test(it.id)}>
                    <Icon name="wifi" className="text-sm" /> Test
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(it.id)}>
                    <Icon name="trash" className="text-sm text-slate-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
