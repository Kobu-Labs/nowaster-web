import { Router } from "express";
import auth from "../middleware/authMiddleware";
import client from "../repositories/client";
import argon2 from "argon2";
import { loginUserScheme } from "../models/userModel";

const authRouter = Router();

/**
 * This endpoint provides information about the currenct authentication.
 * If the user is authorized it returns the user entity. If there is 
 * invalid cookie or missing cookie, it return 401.
 */
authRouter.get("/", auth(), async (req, res) => {
  const id = req.session.user?.id;

  const user = await client.user.findUnique({
    where: { id },
    select: { id: true, userName: true, email: true, avatar: true }
  });
    
  if (!user) {
    res.status(404).json({ message: "Something went wrong" });
    return;
  }

  res.json({ item: user, message: `User ${user.userName} is authorized` });
});

/**
 * This endpoint after successful password verification add the user and
 * role to session stroge.
 */
authRouter.post("/login", async (req, res) => {
  const result = await loginUserScheme.safeParseAsync(req.body);
  if (!result.success) {
    res.status(400).json(result.error);
    return; 
  }
    
  const { email, hashedPassword } = result.data;
  const user = await client.user.findUnique({ where: { email } });

  if (!user) {
    res.status(404).json({ message: "User does not exists" });
    return;
  }

  const isVerified = await argon2.verify(user.hashedPassword, hashedPassword);

  if (!isVerified) {
    res.status(401).json({ message: "Wrong password" });
    return;
  }

  req.session.user = { id: user.id};
  res.json({ message: "Logged in" });
});


/**
 * Remove the authorized user from session storage.
 */
authRouter.post("/logout", async (req, res) => {
  req.session.destroy(() => undefined);
  res.json({ message: "Logged out" });
});

export default authRouter;