use rand::Rng;
use sha2::{Digest, Sha256};

/// Generate a cryptographically secure random hex string
///
/// # Arguments
/// * `bytes` - Number of random bytes to generate (resulting hex string will be 2x this length)
///
/// # Example
/// ```
/// let token = generate_random_hex(32); // 64 character hex string
/// ```
pub fn generate_random_hex(bytes: usize) -> String {
    let mut rng = rand::thread_rng();
    let random_bytes: Vec<u8> = (0..bytes).map(|_| rng.gen()).collect();
    hex::encode(random_bytes)
}

/// Generate SHA256 hash of input string
///
/// # Arguments
/// * `input` - String to hash
///
/// # Returns
/// Lowercase hex-encoded SHA256 hash
pub fn sha256_hash(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

/// Generate a CSRF token for OAuth state parameter
/// Returns 32-byte random hex string (64 characters)
pub fn generate_csrf_token() -> String {
    generate_random_hex(32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_random_hex() {
        let hex1 = generate_random_hex(16);
        let hex2 = generate_random_hex(16);

        // Should be 32 characters (16 bytes * 2)
        assert_eq!(hex1.len(), 32);
        assert_eq!(hex2.len(), 32);

        // Should be different
        assert_ne!(hex1, hex2);

        // Should be valid hex
        assert!(hex1.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_sha256_hash() {
        let input = "test_string";
        let hash1 = sha256_hash(input);
        let hash2 = sha256_hash(input);

        // Should be deterministic
        assert_eq!(hash1, hash2);

        // Should be 64 characters (256 bits / 4)
        assert_eq!(hash1.len(), 64);

        // Different input should produce different hash
        let hash3 = sha256_hash("different");
        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_csrf_token() {
        let token1 = generate_csrf_token();
        let token2 = generate_csrf_token();

        assert_eq!(token1.len(), 64);
        assert_ne!(token1, token2);
    }
}
