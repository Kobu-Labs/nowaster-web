import create from "@/src/repositories/scheduled_entity/create";
import read from "@/src/repositories/scheduled_entity/read";
import remove from "@/src/repositories/scheduled_entity/remove";
import update from "@/src/repositories/scheduled_entity/update";


const scheduledSessionRepo = {
  create,
  read,
  remove,
  update
};

export default scheduledSessionRepo;
