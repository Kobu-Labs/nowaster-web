import create from "./create";
import read from "./read";
import remove from "./remove";
import update from "./join";
import invite from "./invite";
import kick from "./kickUser";
import leave from "./leave";

const groupRepo = {
  create,
  read,
  remove,
  update,
  invite,
  kick,
  leave,
};

export default groupRepo;
