import create from "./create";
import read from "./read";
import remove from "./remove";
import update from "./update";

const scheduledSessionRepo = {
  create,
  read,
  remove,
  update
};

export default scheduledSessionRepo;