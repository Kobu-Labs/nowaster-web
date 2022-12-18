export type ScheduledEntity = {
  id: string;
  userId: string;
  category: string;
  description?: string;
  startTime: Date;
  endTime: Date;
};

export type GetByUserScheduledEntityData = {
  userId: string;
};

export type CreateScheduledEntity = Omit<ScheduledEntity, "id">;
