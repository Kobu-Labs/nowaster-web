import create from "@/src/repositories/recorded_entity/create";
import read from "@/src/repositories/recorded_entity/read";
import remove from "@/src/repositories/recorded_entity/remove";
import update from "@/src/repositories/recorded_entity/update";

const recordedSessionRepo = {
  create,
  read,
  remove,
  update,
};

export default recordedSessionRepo;
