use serde::Deserialize;

#[derive(Deserialize, Debug, Clone)]
pub struct ServerConfig {
    #[serde(rename = "backend_port")]
    pub port: String,
    #[serde(rename = "backend_address")]
    pub address: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct DatabaseConfig {
    #[serde(rename = "database_url")]
    pub connection_url: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct GoogleOAuthConfig {
    #[serde(rename = "google_client_id")]
    pub client_id: String,
    #[serde(rename = "google_client_secret")]
    pub client_secret: String,
    #[serde(rename = "google_redirect_uri")]
    pub redirect_uri: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct GitHubOAuthConfig {
    #[serde(rename = "github_client_id")]
    pub client_id: String,
    #[serde(rename = "github_client_secret")]
    pub client_secret: String,
    #[serde(rename = "github_redirect_uri")]
    pub redirect_uri: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct DiscordOAuthConfig {
    #[serde(rename = "discord_client_id")]
    pub client_id: String,
    #[serde(rename = "discord_client_secret")]
    pub client_secret: String,
    #[serde(rename = "discord_redirect_uri")]
    pub redirect_uri: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct FrontendConfig {
    #[serde(rename = "frontend_url")]
    pub url: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct Config {
    #[serde(flatten)]
    pub server: ServerConfig,
    #[serde(flatten)]
    pub database: DatabaseConfig,
    #[serde(flatten)]
    pub google: GoogleOAuthConfig,
    #[serde(flatten)]
    pub github: GitHubOAuthConfig,
    #[serde(flatten)]
    pub discord: DiscordOAuthConfig,
    #[serde(flatten)]
    pub frontend: FrontendConfig,
}
