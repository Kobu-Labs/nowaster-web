export type Category = {
  id: string;
  name: string;
  color: string;
  last_used_at?: string;
};

export type Tag = {
  id: string;
  label: string;
  color: string;
  allowedCategories?: Category[];
  last_used_at?: string;
};

/** GET/POST /session/stopwatch payload (ReadStopwatchSessionDto). */
export type StopwatchSession = {
  id: string;
  category: Category | null;
  tags: Pick<Tag, "id" | "label" | "color">[] | null;
  description: string | null;
  startTime: string;
  projectId: string | null;
  taskId: string | null;
};

export type BlockRule = { id: string; pattern: string; createdAt: string };

export type CurrentUser = { id: string; username: string; avatarUrl?: string | null; role: string };

export type Settings = { token: string; apiBase: string };
