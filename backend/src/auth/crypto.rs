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
