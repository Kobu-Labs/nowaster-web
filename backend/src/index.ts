import express from "express";
import cors from "cors";
import { env } from "process";
import { RecordedController } from "@/src/controllers/RecordedSessionController";
import { ScheduledController } from "@/src/controllers/ScheduledSessionController";
import { TagController } from "@/src/controllers/TagController";
import { StatisticsController } from "@/src/controllers/StatisticsController";
import type { ApiResponse } from "@/src/controllers/types";

const app = express();
const port = env.PORT ?? 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/recorded", RecordedController);
app.use("/scheduled", ScheduledController);
app.use("/tags", TagController);
app.use("/statistics", StatisticsController);

app.use((_req, res) => {
  const response: ApiResponse<null> = {
    status: "failure",
    data: null,
    error: "No matching endpoint was found"
  };

  return res.status(404).send(response);
});


app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] API listening on port ${port}`);
  if (app.settings.env === "development") {
    console.log(`[${new Date().toISOString()}] Application running in development mode!`);
  }
  console.log(`[${new Date().toISOString()}] Database used: ${env.DATABASE_URL}`);
});
