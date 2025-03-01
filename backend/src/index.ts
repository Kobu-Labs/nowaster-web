import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { RecordedController } from "@/src/controllers/RecordedSessionController";
import { SessionsController } from "@/src/controllers/ScheduledSessionController";
import { TagController } from "@/src/controllers/TagController";
import { StatisticsController } from "@/src/controllers/StatisticsController";
import type { ApiResponse } from "@/src/controllers/types";
import { CategoryController } from "@/src/controllers/CategoryController";
import { env } from "@/src/env";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/recorded", RecordedController);
app.use("/api/session", SessionsController);
app.use("/api/category", CategoryController);
app.use("/api/tag", TagController);
app.use("/api/statistics", StatisticsController);

app.use((_req, res) => {
  const response: ApiResponse<null> = {
    status: "failure",
    data: null,
    error: "No matching endpoint was found",
  };

  return res.status(404).send(response);
});

app.listen(env.PORT, () => {
  console.log(
    `[${new Date().toISOString()}] API listening on port ${env.PORT}`,
  );
  if (app.settings.env === "development") {
    console.log(
      `[${new Date().toISOString()}] Application running in development mode!`,
    );
  }
  console.log(
    `[${new Date().toISOString()}] Database used: ${env.DATABASE_URL}`,
  );
});
