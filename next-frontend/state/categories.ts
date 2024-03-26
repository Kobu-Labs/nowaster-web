import { atom } from "recoil";

export const categoryColors = atom<{ [label: string]: string }>({
  key: "categories",
  default: {},
});
