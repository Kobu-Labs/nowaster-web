import create from "@/src/repositories/category/create";
import read from "@/src/repositories/category/read";
import update from "@/src/repositories/category/update";


const categoryRepo = {
  read,
  create,
  update,
};

export default categoryRepo;
