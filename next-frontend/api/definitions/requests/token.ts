export type TokenRequest = {
  create: {
    description?: null | string;
    expiresInDays?: null | number;
    name: string;
  };
};
