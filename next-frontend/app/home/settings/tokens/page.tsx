import { ApiTokens } from "@/components/pages/settings/tokens/ApiTokens";

export default function TokensSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">API Tokens</h1>
      <p className="text-muted-foreground mb-6">
        Create and manage personal access tokens for API access.
      </p>
      <ApiTokens />
    </div>
  );
}
