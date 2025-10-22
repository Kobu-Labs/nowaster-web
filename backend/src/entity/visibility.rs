use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Type};
use std::fmt;

/// Bitflag-based visibility system for fine-grained permission control
///
/// Bits:
/// - 0 (1): Friends can see
/// - 1 (2): Groups can see
///
/// Examples:
/// - 0: Private (no one can see)
/// - 1: Friends only
/// - 2: Groups only
/// - 3: Friends and groups
/// - 4: Public
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, Type, FromRow)]
#[sqlx(transparent)]
pub struct VisibilityFlags(pub i32);

impl VisibilityFlags {
    // Permission bits
    const FRIENDS: i32 = 1 << 0; // 0001 = 1
    const GROUPS: i32 = 1 << 1; // 0010 = 2

    /// Creates visibility with no permissions (private)
    pub const fn none() -> Self {
        Self(0)
    }

    /// Creates visibility for friends only
    pub const fn friends() -> Self {
        Self(Self::FRIENDS)
    }

    /// Creates visibility for groups only
    pub const fn groups() -> Self {
        Self(Self::GROUPS)
    }

    /// Creates visibility for friends and groups (but not public)
    pub const fn friends_and_groups() -> Self {
        Self(Self::FRIENDS | Self::GROUPS)
    }

    /// Creates visibility with all permissions
    pub const fn public() -> Self {
        Self(Self::FRIENDS | Self::GROUPS)
    }

    /// Creates visibility from a raw integer value
    pub const fn from_raw(value: i32) -> Self {
        Self(value)
    }

    /// Gets the raw integer value
    pub const fn as_raw(&self) -> i32 {
        self.0
    }

    // Builder pattern methods for fluent interface

    /// Adds friends permission
    pub const fn with_friends(self) -> Self {
        Self(self.0 | Self::FRIENDS)
    }

    /// Adds groups permission
    pub const fn with_groups(self) -> Self {
        Self(self.0 | Self::GROUPS)
    }

    /// Checks if visible to friends
    pub const fn is_visible_to_friends(&self) -> bool {
        (self.0 & Self::FRIENDS) != 0
    }

    /// Checks if visible to groups
    pub const fn is_visible_to_groups(&self) -> bool {
        (self.0 & Self::GROUPS) != 0
    }

    /// Checks if visible to public/everyone
    pub const fn is_public(&self) -> bool {
        (self.0 & Self::public().0) != 0
    }

    /// Checks if completely private (no permissions)
    pub const fn is_private(&self) -> bool {
        self.0 == 0
    }
}

impl From<i32> for VisibilityFlags {
    fn from(val: i32) -> Self {
        VisibilityFlags::from_raw(val)
    }
}

impl From<VisibilityFlags> for i32 {
    fn from(val: VisibilityFlags) -> Self {
        val.as_raw()
    }
}

impl fmt::Display for VisibilityFlags {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_private() {
            write!(f, "Private")
        } else {
            let mut parts = Vec::new();
            if self.is_visible_to_friends() {
                parts.push("Friends");
            }
            if self.is_visible_to_groups() {
                parts.push("Groups");
            }
            if self.is_public() {
                parts.push("Public");
            }
            write!(f, "{}", parts.join(" + "))
        }
    }
}

impl Default for VisibilityFlags {
    fn default() -> Self {
        Self::public() // Default to public for backward compatibility
    }
}
