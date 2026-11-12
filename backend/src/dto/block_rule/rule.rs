use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::{Validate, ValidationError};

use crate::entity::block_rule::BlockRule;

pub const MAX_PATTERN_LEN: usize = 253;

#[derive(Clone, Debug, Deserialize, Validate)]
pub struct CreateBlockRuleDto {
    #[validate(custom(function = "validate_pattern"))]
    pub pattern: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadBlockRuleDto {
    pub id: Uuid,
    pub pattern: String,
    pub created_at: DateTime<Utc>,
}

impl From<BlockRule> for ReadBlockRuleDto {
    fn from(rule: BlockRule) -> Self {
        Self {
            id: rule.id,
            pattern: rule.pattern,
            created_at: rule.created_at,
        }
    }
}

/// Trims and lowercases a pattern, the form in which it is stored.
pub fn normalize_pattern(raw: &str) -> String {
    raw.trim().to_lowercase()
}

/// Validates a pattern such as `youtube.com` or `example.com/path`.
/// Must be non-empty, at most 253 chars, with no scheme and no whitespace.
pub fn validate_pattern(raw: &str) -> Result<(), ValidationError> {
    let pattern = normalize_pattern(raw);
    if pattern.is_empty() {
        return Err(ValidationError::new("pattern_empty"));
    }
    if pattern.chars().count() > MAX_PATTERN_LEN {
        return Err(ValidationError::new("pattern_too_long"));
    }
    if pattern.chars().any(char::is_whitespace) {
        return Err(ValidationError::new("pattern_contains_whitespace"));
    }
    if pattern.contains("://") {
        return Err(ValidationError::new("pattern_contains_scheme"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_domains_and_paths() {
        assert!(validate_pattern("youtube.com").is_ok());
        assert!(validate_pattern("  Example.com/path ").is_ok());
    }

    #[test]
    fn rejects_empty() {
        assert!(validate_pattern("").is_err());
        assert!(validate_pattern("   ").is_err());
    }

    #[test]
    fn rejects_too_long() {
        assert!(validate_pattern(&"a".repeat(253)).is_ok());
        assert!(validate_pattern(&"a".repeat(254)).is_err());
    }

    #[test]
    fn rejects_scheme_and_spaces() {
        assert!(validate_pattern("https://youtube.com").is_err());
        assert!(validate_pattern("ftp://x.com").is_err());
        assert!(validate_pattern("you tube.com").is_err());
    }

    #[test]
    fn normalizes() {
        assert_eq!(normalize_pattern("  YouTube.COM "), "youtube.com");
    }
}
