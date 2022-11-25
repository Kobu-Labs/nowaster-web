import express from "express";
import { env } from "process";
import type { ApiResponse } from "./controllers/types";
import { UserController } from "./controllers/userController";


const app = express();
const port = env.PORT ?? 6666;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/user", UserController);

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
