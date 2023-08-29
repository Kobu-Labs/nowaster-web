import express from "express";
import cors from "cors";
import { env } from "process";
import type { ApiResponse } from "./controllers/types";
import { RecordedController } from "./controllers/RecordedSessionController";
import { ScheduledController } from "./controllers/ScheduledSessionController";
import { TagController } from "./controllers/TagController";
import { StatisticsController } from "./controllers/StatisticsController";

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
});
const Test = 10;
export default Test;
