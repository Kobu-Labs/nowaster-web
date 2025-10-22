import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type UserPreferences = {
  closeSidebarOnLinkClick: boolean;
  sidebarBehavior: "floating" | "permanent";
};

const defaultPreferences: UserPreferences = {
  closeSidebarOnLinkClick: true,
  sidebarBehavior: "floating",
};

export const userPreferencesAtom = atomWithStorage<UserPreferences>(
  "user-preferences",
  defaultPreferences,
);

export const closeSidebarOnLinkClickAtom = atom(
  (get) => get(userPreferencesAtom).closeSidebarOnLinkClick,
  (get, set, newValue: boolean) => {
    const currentPrefs = get(userPreferencesAtom);
    set(userPreferencesAtom, {
      ...currentPrefs,
      closeSidebarOnLinkClick: newValue,
    });
  },
);

export const sidebarBehaviorAtom = atom(
  (get) => get(userPreferencesAtom).sidebarBehavior,
  (get, set, newValue: "floating" | "permanent") => {
    const currentPrefs = get(userPreferencesAtom);
    set(userPreferencesAtom, {
      ...currentPrefs,
      sidebarBehavior: newValue,
    });
  },
);
