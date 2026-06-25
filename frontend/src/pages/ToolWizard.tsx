import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Plus,
  Trash2,
  Globe,
  Code2,
  Plug,
} from "lucide-react";
import { api, type ToolInput } from "@/lib/api";
import type {
  ExecutionType,
  InputParameter,
  Integration,
  ParameterType,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = ["Name", "Description", "Input fields", "Tool action"];

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="h-4 w-4 cursor-help text-slate-400" />
      <span className="pointer-events-none absolute left-1/2 top-6 z-10 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

const emptyParam = (): InputParameter => ({
  name: "",
  description: "",
  type: "text",
  required: true,
});

const PARAM_TYPES: ParameterType[] = ["text", "number", "boolean", "select", "date"];

export default function ToolWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [params, setParams] = useState<InputParameter[]>([]);
  const [executionType, setExecutionType] = useState<ExecutionType>("http");
  const [config, setConfig] = useState<Record<string, unknown>>({
    method: "GET",
    url: "",
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getIntegrations().then(setIntegrations);
    if (id) {
      api.getTools().then((tools) => {
        const tool = tools.find((t) => t.id === id);
        if (tool) {
          setName(tool.name);
          setDescription(tool.description);
          setParams(tool.inputSchema);
          setExecutionType(tool.executionType);
          setConfig(tool.executionConfig);
        }
      });
    }
  }, [id]);

  const canNext = useMemo(() => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return description.trim().length > 0;
    return true;
  }, [step, name, description]);

  function updateParam(i: number, patch: Partial<InputParameter>) {
    setParams((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function setExec(type: ExecutionType) {
    setExecutionType(type);
    if (type === "http") setConfig({ method: "GET", url: "", headers: {} });
    else if (type === "integration")
      setConfig({ integrationId: integrations[0]?.id ?? "", method: "GET", path: "" });
    else setConfig({ code: "" });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const payload: ToolInput = {
      name: name.trim(),
      description: description.trim(),
      inputSchema: params,
      executionType,
      executionConfig: config,
    };
    try {
      if (isEdit && id) await api.updateTool(id, payload);
      else await api.createTool(payload);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit tool" : "Create a new tool"}
        </h1>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          Cancel
        </Button>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                i < step
                  ? "bg-brand-600 text-white"
                  : i === step
                  ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                i === step ? "text-slate-900" : "text-slate-400"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-5 py-8">
          {step === 0 && (
            <div>
              <Label>Tool name</Label>
              <Input
                autoFocus
                placeholder="e.g. Search Jira Issues"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="mt-2 text-sm text-slate-500">
                A short, clear name for what this tool does.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Label className="mb-0">Description for the AI</Label>
                <Tooltip text="This is the description the AI will read to decide whether to use this tool." />
              </div>
              <Textarea
                autoFocus
                placeholder="e.g. Searches issues in Jira by text query."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                These are the fields the AI fills in when it uses your tool.
              </p>
              {params.map((p, i) => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-400">
                        Field {i + 1}
                      </span>
                      <button
                        onClick={() => setParams(params.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Name</Label>
                        <Input
                          placeholder="query"
                          value={p.name}
                          onChange={(e) => updateParam(i, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={p.type}
                          onChange={(e) =>
                            updateParam(i, { type: e.target.value as ParameterType })
                          }
                        >
                          {PARAM_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="Text to search"
                        value={p.description}
                        onChange={(e) =>
                          updateParam(i, { description: e.target.value })
                        }
                      />
                    </div>
                    {p.type === "select" && (
                      <div>
                        <Label>Options (comma separated)</Label>
                        <Input
                          placeholder="low, medium, high"
                          value={(p.options ?? []).join(", ")}
                          onChange={(e) =>
                            updateParam(i, {
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={p.required}
                        onChange={(e) => updateParam(i, { required: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Required
                    </label>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => setParams([...params, emptyParam()])}
              >
                <Plus className="h-4 w-4" /> Add field
              </Button>
            </div>
          )}

          {step === 3 && (
            <ActionStep
              executionType={executionType}
              setExec={setExec}
              config={config}
              setConfig={setConfig}
              params={params}
              integrations={integrations}
            />
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={saving} onClick={save}>
            <Check className="h-4 w-4" /> {isEdit ? "Save changes" : "Create tool"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ExecChoice({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: typeof Globe;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
          : "border-slate-200 hover:bg-slate-50"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-slate-400")} />
      <div className="font-medium">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </button>
  );
}

function ActionStep({
  executionType,
  setExec,
  config,
  setConfig,
  params,
  integrations,
}: {
  executionType: ExecutionType;
  setExec: (t: ExecutionType) => void;
  config: Record<string, unknown>;
  setConfig: (c: Record<string, unknown>) => void;
  params: InputParameter[];
  integrations: Integration[];
}) {
  const placeholders = params.map((p) => `{{${p.name}}}`).join("  ");

  return (
    <div className="space-y-5">
      <div>
        <Label>What should this tool do?</Label>
        <div className="mt-2 flex gap-3">
          <ExecChoice
            active={executionType === "http"}
            icon={Globe}
            title="Call an API"
            subtitle="Jira, GitHub, Slack, any REST API"
            onClick={() => setExec("http")}
          />
          <ExecChoice
            active={executionType === "integration"}
            icon={Plug}
            title="Use an integration"
            subtitle="A connection you already set up"
            onClick={() => setExec("integration")}
          />
          <ExecChoice
            active={executionType === "javascript" || executionType === "python"}
            icon={Code2}
            title="Run a script"
            subtitle="JavaScript or Python (advanced)"
            onClick={() => setExec("javascript")}
          />
        </div>
      </div>

      {params.length > 0 && (
        <p className="text-xs text-slate-500">
          Insert field values using:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">{placeholders}</code>
        </p>
      )}

      {executionType === "http" && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-32">
              <Label>Method</Label>
              <Select
                value={(config.method as string) ?? "GET"}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <Label>URL</Label>
              <Input
                placeholder="https://api.example.com/search?q={{query}}"
                value={(config.url as string) ?? ""}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Request body (optional)</Label>
            <Textarea
              placeholder='{"text": "{{message}}"}'
              value={(config.body as string) ?? ""}
              onChange={(e) => setConfig({ ...config, body: e.target.value })}
            />
          </div>
        </div>
      )}

      {executionType === "integration" && (
        <div className="space-y-3">
          {integrations.length === 0 ? (
            <Badge tone="amber">
              No integrations yet — add one on the Integrations page first.
            </Badge>
          ) : (
            <>
              <div>
                <Label>Integration</Label>
                <Select
                  value={(config.integrationId as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, integrationId: e.target.value })
                  }
                >
                  {integrations.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.type})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-3">
                <div className="w-32">
                  <Label>Method</Label>
                  <Select
                    value={(config.method as string) ?? "GET"}
                    onChange={(e) => setConfig({ ...config, method: e.target.value })}
                  >
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Path</Label>
                  <Input
                    placeholder="/rest/api/3/search?jql={{jql}}"
                    value={(config.path as string) ?? ""}
                    onChange={(e) => setConfig({ ...config, path: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Request body (optional)</Label>
                <Textarea
                  value={(config.body as string) ?? ""}
                  onChange={(e) => setConfig({ ...config, body: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      )}

      {(executionType === "javascript" || executionType === "python") && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["javascript", "python"] as const).map((lang) => (
              <Button
                key={lang}
                variant={executionType === lang ? "primary" : "outline"}
                size="sm"
                onClick={() => setExec(lang)}
              >
                {lang === "javascript" ? "JavaScript" : "Python"}
              </Button>
            ))}
          </div>
          <div>
            <Label>Code</Label>
            <Textarea
              className="min-h-[180px] font-mono text-xs"
              placeholder={
                executionType === "javascript"
                  ? "// `params` holds the field values\nreturn `Hello ${params.name}`;"
                  : "# define what to return\nreturn 'Hello ' + params['name']"
              }
              value={(config.code as string) ?? ""}
              onChange={(e) => setConfig({ ...config, code: e.target.value })}
            />
            <p className="mt-2 text-xs text-slate-500">
              Your code receives a <code>params</code> object with the field values
              and should return the result.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
