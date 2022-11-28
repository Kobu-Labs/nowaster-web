import create from "./create";
import read from "./read";
import remove from "./remove";
import update from "./update";

const recordedSessionRepo = {
  create,
  read,
  remove,
  update
};

export default recordedSessionRepo;
