import type { VisibilityFlags } from "@/api/definitions/models/user";

/**
 * Visibility flags utility functions that match the backend implementation
 *
 * Bits:
 * - 0 (1): Friends can see
 * - 1 (2): Groups can see
 */
export class VisibilityUtils {
  // Permission bits (must match backend exactly)
  private static readonly FRIENDS = Math.trunc(1); // 1
  private static readonly GROUPS = 1 << 1;  // 2

  /**
   * Creates visibility flags for friends only
   */
  static friends(): VisibilityFlags {
    return this.fromRaw(this.FRIENDS);
  }

  /**
   * Converts backend response format to VisibilityFlags
   */
  static fromBackendResponse(response: {
    visible_to_friends: boolean;
    visible_to_groups: boolean;
    visible_to_public: boolean;
  }): VisibilityFlags {
    return this.fromFlags(response.visible_to_friends, response.visible_to_groups);
  }

  /**
   * Creates visibility flags from individual boolean flags
   */
  static fromFlags(friends: boolean, groups: boolean): VisibilityFlags {
    let rawValue = 0;
    if (friends) {rawValue |= this.FRIENDS;}
    if (groups) {rawValue |= this.GROUPS;}
    return this.fromRaw(rawValue);
  }

  /**
   * Converts raw visibility flags number to a structured object
   */
  static fromRaw(rawValue: number): VisibilityFlags {
    const friends = (rawValue & this.FRIENDS) !== 0;
    const groups = (rawValue & this.GROUPS) !== 0;

    return {
      friends,
      groups,
      isPrivate: rawValue === 0,
      isPublic: friends && groups,
      rawValue,
    };
  }

  /**
   * Gets a human-readable description of the visibility settings
   */
  static getDescription(flags: VisibilityFlags): string {
    if (flags.isPrivate) {
      return "Only you can see your activity";
    }
    if (flags.isPublic) {
      return "Everyone can see your activity";
    }
    if (flags.friends && !flags.groups) {
      return "Only your friends can see your activity";
    }
    if (!flags.friends && flags.groups) {
      return "Only group members can see your activity";
    }
    return "Custom visibility settings";
  }

  /**
   * Gets display labels for the UI
   */
  static getLabels() {
    return {
      friends: { description: "Your friends can see your activity", title: "Friends" },
      groups: { description: "Group members can see your activity", title: "Groups" },
      private: { description: "Only you can see your activity", title: "Private" },
      public: { description: "Everyone can see your activity", title: "Public" },
    };
  }

  /**
   * Creates visibility flags for groups only
   */
  static groups(): VisibilityFlags {
    return this.fromRaw(this.GROUPS);
  }

  /**
   * Creates visibility flags for private (no one can see)
   */
  static none(): VisibilityFlags {
    return this.fromRaw(0);
  }

  /**
   * Creates visibility flags for public (both friends and groups)
   */
  static public(): VisibilityFlags {
    return this.fromRaw(this.FRIENDS | this.GROUPS);
  }

  /**
   * Converts VisibilityFlags to backend request format
   */
  static toBackendRequest(flags: VisibilityFlags) {
    return {
      visible_to_friends: flags.friends,
      visible_to_groups: flags.groups,
      visible_to_public: flags.isPublic,
    };
  }
}