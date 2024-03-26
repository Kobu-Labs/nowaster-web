import { atom } from "recoil";

export const tagColors = atom<{ [label: string]: string }>({
  key: "session-tags",
  default: {},
});
