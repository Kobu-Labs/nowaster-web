export type Ban = {
  id: string;
  userId: string;
  endTime: Date | null;
};

export type GetBansByUserIdData = {
  userId: string;
};

export type CreateBanData = Omit<Ban, "id">;
