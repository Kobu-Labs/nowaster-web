import create from "./create";
import read from "./read";
import remove from "./remove";
import update from "./join";
import invite from "./invite";
import kick from "./kickUser";

const groupRepo = {
  create,
  read,
  remove,
  update,
  invite,
  kick,
};

export default groupRepo;
