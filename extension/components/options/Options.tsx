import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { useSettings } from "@/components/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import * as api from "@/lib/api";
import { patternToUrlFilter } from "@/lib/pattern";
import { DEFAULT_API_BASE, normalizeBase, saveSettings, setBlockPatterns } from "@/lib/storage";
import type { Settings } from "@/lib/types";

const ConnectionCard: FC<{ initial: Settings }> = ({ initial }) => {
  const [token, setToken] = useState(initial.token);
  const [apiBase, setApiBase] = useState(initial.apiBase);
  const [reveal, setReveal] = useState(false);

  const save = useMutation({
    mutationFn: () => saveSettings({ token, apiBase }),
  });

  const test = useMutation({
    mutationFn: async () => {
      await saveSettings({ token, apiBase });
      return api.getMe({ token: token.trim(), apiBase: normalizeBase(apiBase) || DEFAULT_API_BASE });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="token" className="text-xs text-muted-foreground">API token</label>
          <Input
            id="token"
            type={reveal ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste a token from Nowaster settings"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={reveal} onCheckedChange={setReveal} aria-label="Show token" />
            Show token
          </label>
          <p className="text-xs text-muted-foreground">
            This token grants full access to your account. Keep it private and revoke it from the web app&apos;s
            Settings, Tokens page if it leaks.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="base" className="text-xs text-muted-foreground">API base URL (override for development)</label>
          <Input id="base" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder={DEFAULT_API_BASE} />
        </div>
        <div className="flex items-center gap-2">
          <Button disabled={save.isPending} onClick={() => save.mutate()}>Save</Button>
          <Button variant="outline" disabled={test.isPending || !token.trim()} onClick={() => test.mutate()}>
            Test connection
          </Button>
        </div>
        {save.isSuccess && !test.isPending && !test.isSuccess ? <p className="text-xs text-muted-foreground">Saved.</p> : null}
        {save.isError ? <p className="text-xs text-red-400">{save.error.message}</p> : null}
        {test.isSuccess ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Connected as {test.data.username}
          </p>
        ) : null}
        {test.isError && !save.isError ? (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <XCircle className="h-4 w-4" /> {test.error.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

const BlockListCard: FC<{ settings: Settings }> = ({ settings }) => {
  const queryClient = useQueryClient();
  const [pattern, setPattern] = useState("");

  const rules = useQuery({
    queryKey: ["block-rules", settings.apiBase, settings.token],
    queryFn: async () => {
      const list = await api.listBlockRules(settings);
      await setBlockPatterns(list.map((r) => r.pattern));
      return list;
    },
    enabled: Boolean(settings.token),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["block-rules"] });

  const add = useMutation({
    mutationFn: async () => {
      if (!patternToUrlFilter(pattern)) throw new Error("Enter a domain such as example.com");
      await api.createBlockRule(settings, pattern.trim());
      setPattern("");
      await refresh();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteBlockRule(settings, id);
      await refresh();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked sites</CardTitle>
        <p className="text-xs text-muted-foreground">
          While a session is running, navigating to these sites shows a focus page instead.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="example.com" aria-label="Site to block" />
          <Button type="submit" disabled={add.isPending || !settings.token}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
        {add.isError ? <p className="text-xs text-red-400">{add.error.message}</p> : null}
        {rules.isError ? <p className="text-xs text-red-400">{rules.error.message}</p> : null}
        <ul className="flex flex-col divide-y rounded-md border">
          {(rules.data ?? []).map((rule) => (
            <li key={rule.id} className="flex items-center justify-between px-3 py-2">
              <span className="truncate text-sm">{rule.pattern}</span>
              <Button variant="ghost" size="icon" aria-label={`Remove ${rule.pattern}`} onClick={() => remove.mutate(rule.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {rules.isSuccess && rules.data.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No blocked sites yet.</li>
          ) : null}
        </ul>
        {remove.isError ? <p className="text-xs text-red-400">{remove.error.message}</p> : null}
      </CardContent>
    </Card>
  );
};

export const Options: FC = () => {
  const settings = useSettings();
  if (!settings.data) return null;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Nowaster settings</h1>
      <ConnectionCard initial={settings.data} />
      <BlockListCard settings={settings.data} />
    </main>
  );
};
