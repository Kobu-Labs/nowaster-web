import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { RecordedController } from "@/src/controllers/RecordedSessionController";
import { ScheduledController } from "@/src/controllers/ScheduledSessionController";
import { TagController } from "@/src/controllers/TagController";
import { StatisticsController } from "@/src/controllers/StatisticsController";
import type { ApiResponse } from "@/src/controllers/types";
import { CategoryController } from "@/src/controllers/CategoryController";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/recorded", RecordedController);
app.use("/scheduled", ScheduledController);
app.use("/category", CategoryController);
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


module.exports = app;
