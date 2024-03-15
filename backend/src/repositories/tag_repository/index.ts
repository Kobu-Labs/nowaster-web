import create from "@/src/repositories/tag_repository/create";
import read from "@/src/repositories/tag_repository/read";
import remove from "@/src/repositories/tag_repository/remove";
import update from "@/src/repositories/tag_repository/update";

const tagRepo = {
  create,
  read,
  remove,
  update,
};

export default tagRepo;

