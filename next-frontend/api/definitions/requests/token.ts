export type TokenRequest = {
  create: {
    name: string;
    description?: string | null;
    expiresInDays?: number | null;
  };
};
