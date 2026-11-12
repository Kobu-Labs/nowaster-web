import { z } from "zod";
import { BlockRuleSchema } from "../models/block-rule";

const list = z.array(BlockRuleSchema);

const create = BlockRuleSchema;

const remove = z.unknown();

export const BlockRuleResponseSchema = { create, list, remove };
