import express from "express";
import { env } from "process";
import type { ApiResponse } from "./controllers/types";
import { UserController } from "./controllers/userController";
import { RecordedController } from "./controllers/study_sessions/recorderController";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "./middleware/sessionMiddleware";
import AuthController from "./controllers/authController";
import { ScheduledController } from "./controllers/study_sessions/scheduledController";
import { GroupController } from "./controllers/studyGroupController";
import { BanController } from "./controllers/banController";
import { UserFunctionController } from "./controllers/userFunctionController";

declare module "express-session" {
  interface SessionData { user: { id: string, } }
}

const app = express();
const port = env.PORT ?? 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session());
app.use(cors());

app.use("/user", UserController);
app.use("/ban", BanController);
app.use("/recorded", RecordedController);
app.use("/scheduled", ScheduledController);
app.use("/group", GroupController);
app.use("/auth", AuthController);
app.use("/function", UserFunctionController);

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
