import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api, type IntegrationInput, type ServiceTemplate } from "@/lib/api";
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
  guidance?: string;
  learnMoreUrl?: string;
}

const PRESETS: Record<
  IntegrationType,
  { label: string; baseUrl: string; creds: CredField[] }
> = {
  jira: {
    label: "Jira",
    baseUrl: "https://your-domain.atlassian.net",
    creds: [
      {
        key: "email",
        label: "Account email",
        guidance: "Your Atlassian account email address (e.g. you@company.com).",
      },
      {
        key: "apiToken",
        label: "API token",
        secret: true,
        guidance: "Generate at Atlassian → Account Settings → Security → API tokens.",
        learnMoreUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
      },
    ],
  },
  github: {
    label: "GitHub",
    baseUrl: "https://api.github.com",
    creds: [
      {
        key: "token",
        label: "Personal access token",
        secret: true,
        guidance: "Create a classic token with repo and issues scopes at GitHub → Settings → Developer settings → Personal access tokens.",
        learnMoreUrl: "https://github.com/settings/tokens/new",
      },
    ],
  },
  slack: {
    label: "Slack",
    baseUrl: "https://slack.com/api",
    creds: [
      {
        key: "token",
        label: "Bot token (xoxb-…)",
        secret: true,
        guidance: "Create a Slack app, install it to your workspace, and copy the Bot User OAuth Token. Required scopes: chat:write, channels:read, channels:history.",
        learnMoreUrl: "https://api.slack.com/apps",
      },
    ],
  },
  notion: {
    label: "Notion",
    baseUrl: "https://api.notion.com/v1",
    creds: [
      {
        key: "token",
        label: "Integration token",
        secret: true,
        guidance: "Create an internal integration at Notion → Settings → Integrations, then share each database or page with it.",
        learnMoreUrl: "https://www.notion.so/my-integrations",
      },
    ],
  },
  "google-sheets": {
    label: "Google Sheets",
    baseUrl: "https://sheets.googleapis.com/v4",
    creds: [
      {
        key: "accessToken",
        label: "OAuth2 access token",
        secret: true,
        guidance: "Short-lived token (expires in 1 h). Use the OAuth Playground to get one quickly — select the Sheets API scope (…/auth/spreadsheets).",
        learnMoreUrl: "https://developers.google.com/oauthplayground",
      },
    ],
  },
  "google-calendar": {
    label: "Google Calendar",
    baseUrl: "https://www.googleapis.com/calendar/v3",
    creds: [
      {
        key: "accessToken",
        label: "OAuth2 access token",
        secret: true,
        guidance: "Short-lived token (expires in 1 h). Use the OAuth Playground to get one quickly — select the Calendar API scope (…/auth/calendar).",
        learnMoreUrl: "https://developers.google.com/oauthplayground",
      },
    ],
  },
  gmail: {
    label: "Gmail",
    baseUrl: "https://gmail.googleapis.com/gmail/v1",
    creds: [
      {
        key: "accessToken",
        label: "OAuth2 access token",
        secret: true,
        guidance: "Short-lived token (expires in 1 h). Use the OAuth Playground to get one quickly — select the Gmail API scope (…/auth/gmail.readonly).",
        learnMoreUrl: "https://developers.google.com/oauthplayground",
      },
    ],
  },
  linear: {
    label: "Linear",
    baseUrl: "https://api.linear.app",
    creds: [
      {
        key: "apiKey",
        label: "API key",
        secret: true,
        guidance: "Generate a personal API key at Linear → Settings → API → Personal API keys.",
        learnMoreUrl: "https://linear.app/settings/api",
      },
    ],
  },
  confluence: {
    label: "Confluence",
    baseUrl: "https://your-domain.atlassian.net/wiki",
    creds: [
      {
        key: "email",
        label: "Account email",
        guidance: "Your Atlassian account email address (same as for Jira).",
      },
      {
        key: "apiToken",
        label: "API token",
        secret: true,
        guidance: "Generate at Atlassian → Account Settings → Security → API tokens.",
        learnMoreUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
      },
    ],
  },
  "ms-teams": {
    label: "Microsoft Teams",
    baseUrl: "https://graph.microsoft.com/v1.0",
    creds: [
      {
        key: "accessToken",
        label: "OAuth2 access token",
        secret: true,
        guidance: "Short-lived token from Microsoft Graph. Use Graph Explorer to get one quickly. Required scopes: Team.ReadBasic.All, Channel.ReadBasic.All, ChannelMessage.Send.",
        learnMoreUrl: "https://developer.microsoft.com/en-us/graph/graph-explorer",
      },
    ],
  },
  airtable: {
    label: "Airtable",
    baseUrl: "https://api.airtable.com/v0",
    creds: [
      {
        key: "apiKey",
        label: "Personal access token",
        secret: true,
        guidance: "Create a personal access token at Airtable → Account → Developer hub → Personal access tokens. Scopes needed: data.records:read, data.records:write.",
        learnMoreUrl: "https://airtable.com/create/tokens",
      },
    ],
  },
  discord: {
    label: "Discord",
    baseUrl: "https://discord.com/api/v10",
    creds: [
      {
        key: "botToken",
        label: "Bot token",
        secret: true,
        guidance: "Create a bot at Discord Developer Portal → Applications → Bot → Reset Token. Add the bot to your server with the appropriate permissions.",
        learnMoreUrl: "https://discord.com/developers/applications",
      },
    ],
  },
  stripe: {
    label: "Stripe",
    baseUrl: "https://api.stripe.com/v1",
    creds: [
      {
        key: "apiKey",
        label: "Secret key (sk_…)",
        secret: true,
        guidance: "Find your secret key at Stripe Dashboard → Developers → API keys. Use a restricted key with only the permissions your tools need.",
        learnMoreUrl: "https://dashboard.stripe.com/apikeys",
      },
    ],
  },
  hubspot: {
    label: "HubSpot",
    baseUrl: "https://api.hubapi.com",
    creds: [
      {
        key: "accessToken",
        label: "Private app access token",
        secret: true,
        guidance: "Create a private app at HubSpot → Settings → Integrations → Private Apps and copy its access token. Select the CRM scopes your tools need.",
        learnMoreUrl: "https://app.hubspot.com/private-apps",
      },
    ],
  },
  zendesk: {
    label: "Zendesk",
    baseUrl: "https://your-subdomain.zendesk.com/api/v2",
    creds: [
      {
        key: "email",
        label: "Account email",
        guidance: "Your Zendesk agent account email address.",
      },
      {
        key: "apiToken",
        label: "API token",
        secret: true,
        guidance: "Generate at Zendesk Admin Center → Apps and Integrations → APIs → Zendesk API → API token.",
        learnMoreUrl: "https://support.zendesk.com/hc/en-us/articles/4408889192858",
      },
    ],
  },
  rest: {
    label: "Custom REST API",
    baseUrl: "https://api.example.com",
    creds: [
      {
        key: "apiKey",
        label: "API key (optional)",
        secret: true,
        guidance: "Your API key or bearer token. Leave blank if the API is public or uses a different auth method.",
      },
    ],
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
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [form, setForm] = useState<IntegrationInput | null>(null);
  const [addStarterTools, setAddStarterTools] = useState(true);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<Record<string, string>>({});

  async function refresh() {
    setItems(await api.getIntegrations());
  }

  useEffect(() => {
    refresh();
    api.getTemplates().then(setTemplates);
  }, []);

  async function save() {
    if (!form) return;
    const integration = await api.createIntegration(form);
    if (addStarterTools) {
      const template = templates.find((t) => t.type === form.type);
      if (template?.starterTools?.length) {
        const tools = template.starterTools.map((t) => ({
          ...t,
          executionConfig: { ...t.executionConfig, integrationId: integration.id },
        }));
        await api.createToolsBulk(tools);
        setImportResult((r) => ({
          ...r,
          [integration.id]: `Added ${tools.length} starter tool${tools.length !== 1 ? "s" : ""}`,
        }));
      }
    }
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

  async function importStarterTools(integration: Integration) {
    const template = templates.find((t) => t.type === integration.type);
    if (!template?.starterTools?.length) return;

    setImportingId(integration.id);
    try {
      const tools = template.starterTools.map((t) => ({
        ...t,
        executionConfig: { ...t.executionConfig, integrationId: integration.id },
      }));
      const created = await api.createToolsBulk(tools);
      setImportResult((r) => ({
        ...r,
        [integration.id]: `Added ${created.length} tool${created.length !== 1 ? "s" : ""}`,
      }));
    } catch {
      setImportResult((r) => ({ ...r, [integration.id]: "Import failed" }));
    } finally {
      setImportingId(null);
    }
  }

  function starterCount(type: IntegrationType) {
    return templates.find((t) => t.type === type)?.starterTools?.length ?? 0;
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
          <Button onClick={() => { setForm(emptyForm("jira")); setAddStarterTools(true); }}>
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
                  onChange={(e) => { setForm(emptyForm(e.target.value as IntegrationType)); setAddStarterTools(true); }}
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
                {c.guidance && (
                  <p className="mt-1 text-xs text-slate-500">
                    {c.guidance}{" "}
                    {c.learnMoreUrl && (
                      <a
                        href={c.learnMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        Learn more
                      </a>
                    )}
                  </p>
                )}
              </div>
            ))}
            {starterCount(form.type) > 0 && (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addStarterTools}
                  onChange={(e) => setAddStarterTools(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Also add {starterCount(form.type)} starter tool{starterCount(form.type) !== 1 ? "s" : ""} for {PRESETS[form.type].label}
              </label>
            )}
            <div className="flex gap-2">
              <Button onClick={save}>Save integration</Button>
              <Button variant="ghost" onClick={() => { setForm(null); setAddStarterTools(true); }}>
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
          {items.map((it) => {
            const count = starterCount(it.type);
            const result = importResult[it.id];
            return (
              <Card key={it.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-900">
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
                      {result && (
                        <div className="mt-1 text-xs text-green-600">{result}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {count > 0 && !result && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => importStarterTools(it)}
                        disabled={importingId === it.id}
                      >
                        <Icon name="wand-magic-sparkles" className="text-sm" />
                        {importingId === it.id
                          ? "Adding…"
                          : `Add ${count} starter tool${count !== 1 ? "s" : ""}`}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => test(it.id)}>
                      <Icon name="wifi" className="text-sm" /> Test
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(it.id)}>
                      <Icon name="trash" className="text-sm text-slate-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
