use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::entity::visibility::VisibilityFlags;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateVisibilityDto {
    pub visibility_flags: VisibilityFlags,
}

/// Convenience wrapper for frontend that allows setting visibility using
/// a more user-friendly interface
#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateVisibilitySettingsDto {
    pub visible_to_friends: bool,
    pub visible_to_groups: bool,
    pub visible_to_public: bool,
}

impl From<UpdateVisibilitySettingsDto> for UpdateVisibilityDto {
    fn from(settings: UpdateVisibilitySettingsDto) -> Self {
        let mut flags = VisibilityFlags::none();

        if settings.visible_to_friends {
            flags = flags.with_friends();
        }
        if settings.visible_to_groups {
            flags = flags.with_groups();
        }
        if settings.visible_to_public {
            flags = VisibilityFlags::public()
        }

        Self {
            visibility_flags: flags,
        }
    }
}

impl From<UpdateVisibilityDto> for UpdateVisibilitySettingsDto {
    fn from(dto: UpdateVisibilityDto) -> Self {
        Self {
            visible_to_friends: dto.visibility_flags.is_visible_to_friends(),
            visible_to_groups: dto.visibility_flags.is_visible_to_groups(),
            visible_to_public: dto.visibility_flags.is_public(),
        }
    }
}
