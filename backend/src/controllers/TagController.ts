// TODO 
// read tag by id
// read all tags
// delete a tag
// update a tag

import { Router } from "express";
import { validate } from "../middleware/validation";
import { createTagSchema } from "../validation/tagValidation";
import tagRepo from "../repositories/tag_repository";
import { handleOkResp, handleResultErrorResp } from "./utils/handleResponse";

export const TagController = Router();

// create a new tag
TagController.post("/", validate({ body: createTagSchema }), async (req, res) => {
  const tag = await tagRepo.create(req.body);

  if (tag.isErr) {
    return handleResultErrorResp(500, res, tag.error);
  }

  return handleOkResp(tag.value, res);
});
