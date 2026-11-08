import { Settings } from "lucide-react";
import type { FC } from "react";
import { browser } from "wxt/browser";
import { useSettings, useStoredState } from "@/components/hooks/useSettings";
import { ActiveSessionCard } from "@/components/popup/ActiveSessionCard";
import { QuickStart } from "@/components/popup/QuickStart";
import { Button } from "@/components/ui/button";

const openOptions = () => {
  void browser.runtime.openOptionsPage();
  window.close();
};

export const Popup: FC = () => {
  const settings = useSettings();
  const state = useStoredState();

  if (settings.isPending || state.isPending) return <div className="h-24 w-[360px]" />;

  const hasToken = Boolean(settings.data?.token);

  return (
    <div className="max-h-[560px] w-[360px] overflow-y-auto p-3">
      <header className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Nowaster</span>
        <Button variant="ghost" size="icon" aria-label="Open settings" onClick={openOptions}>
          <Settings className="h-4 w-4" />
        </Button>
      </header>
      {!hasToken || !settings.data ? (
        <div className="rounded-lg border p-4 text-sm">
          <p className="mb-3 text-muted-foreground">
            Add an API token in the extension settings to start sessions from here.
          </p>
          <Button onClick={openOptions}>Open settings</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {state.data?.activeSession ? (
            <ActiveSessionCard settings={settings.data} session={state.data.activeSession} />
          ) : null}
          <QuickStart settings={settings.data} hasActive={Boolean(state.data?.activeSession)} />
        </div>
      )}
    </div>
  );
};
