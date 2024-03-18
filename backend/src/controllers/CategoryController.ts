import { Router } from "express";
import {
  handleOkResp,
  handleResultErrorResp,
} from "@/src/controllers/utils/handleResponse";
import { validate } from "@/src/middleware/validation";
import categoryRepo from "@/src/repositories/category";
import { CategoryRequestSchema } from "@kobu-labs/nowaster-js-typing";

export const CategoryController = Router();

// read many categories
CategoryController.get(
  "/",
  validate({ query: CategoryRequestSchema.readMany }),
  async (req, res) => {
    const categories = await categoryRepo.read.many(req.query);

    if (categories.isErr) {
      return handleResultErrorResp(500, res, categories.error);
    }

    return handleOkResp(categories.value, res);
  },
);

// create new study session
CategoryController.post(
  "/",
  validate({ body: CategoryRequestSchema.create }),
  async (req, res) => {
    const category = await categoryRepo.create(req.body);

    if (category.isErr) {
      return handleResultErrorResp(500, res, category.error);
    }
    return handleOkResp(category.value, res);
  },
);

// get category by name
CategoryController.get(
  "/:name",
  validate({ params: CategoryRequestSchema.readByName }),
  async (req, res) => {
    const category = await categoryRepo.read.single(req.params);

    if (category.isErr) {
      return handleResultErrorResp(500, res, category.error);
    }

    return handleOkResp(category.value, res);
  },
);

// update category
CategoryController.put(
  "/",
  validate({ body: CategoryRequestSchema.update }),
  async (req, res) => {
    const category = await categoryRepo.update.single(req.body);

    if (category.isErr) {
      return handleResultErrorResp(500, res, category.error);
    }

    return handleOkResp(category.value, res);
  },
);
