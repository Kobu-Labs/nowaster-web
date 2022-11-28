import { Router } from "express";
import auth from "../middleware/authMiddleware";

const todoRouter = Router();

todoRouter.get("/", (_, res) => {
  res.json({ message: "This route is not protected at all" });
});

todoRouter.get("/protected", auth(), (_, res) => {
  res.json({ message: "This route has just authentication" });
});

export default todoRouter;