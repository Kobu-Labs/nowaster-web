export type RecordedEntity = {
  id: string;
  userId: string;
  category: string;
  description?: string;
  startTime: Date;
};

export type DeleteRecordedEntity = {
  id: string;
};

export type GetByUserIdRecordedEntity = {
  userId: string;
};

export type CreateRecordedEntity = Omit<RecordedEntity, "id">;
