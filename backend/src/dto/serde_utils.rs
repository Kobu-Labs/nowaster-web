use serde::{Deserialize, Deserializer};

/// Custom deserializer for Option<Option<T>> fields.
///
/// This allows distinguishing between three states:
/// - Field not present in JSON → None (uses #[serde(default)])
/// - Field present with null value → Some(None)
/// - Field present with a value → Some(Some(value))
///
/// # Usage
/// ```rust
/// #[derive(Deserialize)]
/// struct MyDto {
///     #[serde(default, deserialize_with = "deserialize_optional_field")]
///     my_field: Option<Option<String>>,
/// }
/// ```
///
/// # Example JSON deserialization:
/// - `{}` → `my_field: None`
/// - `{"my_field": null}` → `my_field: Some(None)`
/// - `{"my_field": "value"}` → `my_field: Some(Some("value"))`
pub fn deserialize_optional_field<'de, D, T>(
    deserializer: D,
) -> Result<Option<Option<T>>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    // Deserialize as Option<T>, then wrap in Some() to get Option<Option<T>>
    Ok(Some(Option::deserialize(deserializer)?))
}
