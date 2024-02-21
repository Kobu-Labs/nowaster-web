// TODO 
// read tag by id
// delete a tag
// update a tag

import { Router } from "express";
import { validate } from "../middleware/validation";
import tagRepo from "../repositories/tag_repository";
import { handleOkResp, handleResultErrorResp } from "./utils/handleResponse";
import { createTagSchema, readManyTags } from "../requests/tagRequests";

export const TagController = Router();

// create a new tag
TagController.post("/", validate({ body: createTagSchema }), async (req, res) => {
  const tag = await tagRepo.create(req.body);

  if (tag.isErr) {
    return handleResultErrorResp(500, res, tag.error);
  }

  return handleOkResp(tag.value, res);
});


TagController.get("/", validate({ query: readManyTags }), async (req, res) => {
  const tags = await tagRepo.read.many(req.query);

  if (tags.isErr) {
    return handleResultErrorResp(500, res, tags.error);
  }

  return handleOkResp(tags.value, res);
});
