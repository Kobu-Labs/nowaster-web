// TODO 
// read tag by id
// delete a tag
// update a tag

import { Router } from "express";
import { validate } from "@/src/middleware/validation";
import { handleOkResp, handleResultErrorResp } from "@/src/controllers/utils/handleResponse";
import tagRepo from "@/src/repositories/tag_repository";
import { TagRequestSchema } from "@kobu-labs/nowaster-js-typing";

export const TagController = Router();

// create a new tag
TagController.post("/", validate({ body: TagRequestSchema.create }), async (req, res) => {
  const tag = await tagRepo.create(req.body);

  if (tag.isErr) {
    return handleResultErrorResp(500, res, tag.error);
  }

  return handleOkResp(tag.value, res);
});


TagController.get("/", validate({ query: TagRequestSchema.readMany }), async (req, res) => {
  const tags = await tagRepo.read.many(req.query);

  if (tags.isErr) {
    return handleResultErrorResp(500, res, tags.error);
  }

  return handleOkResp(tags.value, res);
});
