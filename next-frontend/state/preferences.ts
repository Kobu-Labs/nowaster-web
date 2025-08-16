import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface UserPreferences {
  closeSidebarOnLinkClick: boolean;
}

const defaultPreferences: UserPreferences = {
  closeSidebarOnLinkClick: true,
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