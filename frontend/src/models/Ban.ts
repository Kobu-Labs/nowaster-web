export type Ban = {
  id: string;
  userId: string;
  endTime: Date | null;
};

export type GetBansByUserEmailData = {
  email: string;
};

export type CreateBanData = Omit<Ban, "id">;
