# Authentication System Design - Migration from Clerk

**Version:** 1.0
**Date:** 2026-01-15
**Status:** Design Phase

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Token Management](#token-management)
6. [Session Management](#session-management)
7. [Role-Based Access Control](#role-based-access-control)
8. [Admin Impersonation](#admin-impersonation)
9. [Frontend Implementation](#frontend-implementation)
10. [Backend Implementation](#backend-implementation)
11. [Security Considerations](#security-considerations)
12. [Migration Plan](#migration-plan)
13. [Technology Stack](#technology-stack)

---

## Overview

### Goals

- **Replace Clerk** with self-hosted authentication system
- **OAuth Support**: Google, GitHub, Discord
- **Performance**: Fast authentication with minimal overhead
- **Persistence**: Long-lived sessions (30 days)
- **Security**: Industry-standard token management
- **Admin Features**: User impersonation for debugging
- **Simplicity**: OAuth-only, no email/password

### Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth Methods** | OAuth only (Google, GitHub, Discord) | Simpler codebase, no password management |
| **Token Strategy** | Refresh token rotation | Best performance/security balance |
| **Session Storage** | PostgreSQL for refresh tokens | Leverages existing infrastructure |
| **Role Model** | Global roles only (Admin/User) | Community roles deferred to authorization layer |
| **Impersonation Audit** | No logging | Trust admins, simplest implementation |
| **User Migration** | Fresh start | Clean slate with new auth system |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OAuth Buttons│  │ Auth Context │  │ API Client   │      │
│  │ (Sign In)    │→ │ (Tokens)     │→ │ (Interceptor)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ 1. OAuth redirect              │ 3. API requests
             │                                │    + Access Token
             ↓                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      Rust/Axum Backend                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OAuth Flow                                          │   │
│  │  1. Redirect to provider (Google/GitHub/Discord)    │   │
│  │  2. Handle callback                                  │   │
│  │  3. Exchange code for provider access token          │   │
│  │  4. Fetch user profile                               │   │
│  │  5. Create/update user in database                   │   │
│  │  6. Generate access + refresh tokens                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JWT Middleware                                      │   │
│  │  - Validate access token signature                   │   │
│  │  - Extract user_id + role from claims                │   │
│  │  - Inject Actor into request                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Token Refresh Endpoint                              │   │
│  │  - Validate refresh token from database              │   │
│  │  - Issue new access + refresh tokens                 │   │
│  │  - Rotate refresh token (invalidate old)             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
                  ┌──────────────────────┐
                  │   PostgreSQL         │
                  │  - users             │
                  │  - oauth_accounts    │
                  │  - refresh_tokens    │
                  │  - impersonations    │
                  └──────────────────────┘
```

### Request Flow

#### Authentication Request (Protected Endpoint)
```
Client Request
    ↓
[1] Extract Authorization header (Bearer <access_token>)
    ↓
[2] Verify JWT signature using RS256 + public key
    ↓
[3] Decode claims (user_id, role, exp)
    ↓
[4] Check expiration (if expired → 401, client must refresh)
    ↓
[5] Inject Actor { user_id, role } into request
    ↓
[6] Execute endpoint handler
```

**Performance**: Steps 1-5 are pure cryptography + in-memory operations. **No database queries on every request.**

#### Token Refresh Flow
```
Client (access token expired)
    ↓
[1] Call POST /auth/refresh with refresh_token
    ↓
[2] Database query: Lookup refresh token
    ↓
[3] Validate: not expired, not revoked
    ↓
[4] Generate new access token (15 min)
    ↓
[5] Generate new refresh token (30 days)
    ↓
[6] Invalidate old refresh token
    ↓
[7] Return { access_token, refresh_token }
```

**Frequency**: Once per 15 minutes of active use. Most requests use cached access token.

---

## Database Schema

### Tables

#### 1. `users` (Updated)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Profile
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(512),
    email VARCHAR(255) UNIQUE, -- From OAuth provider

    -- Authorization
    role user_role NOT NULL DEFAULT 'user',

    -- Privacy
    visibility_flags INT NOT NULL DEFAULT 0,

    -- Metadata
    last_login_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**Migration Note**: Current `users` table uses Clerk ID (VARCHAR). New table uses UUID. Fresh start means existing users re-register.

#### 2. `oauth_accounts` (New)
```sql
CREATE TYPE oauth_provider AS ENUM ('google', 'github', 'discord');

CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    provider oauth_provider NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL, -- Provider's unique ID
    provider_email VARCHAR(255),

    -- OAuth tokens (optional, for future API access)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider_email ON oauth_accounts(provider, provider_email);
```

**Purpose**: Links user accounts to OAuth providers. Supports multiple OAuth accounts per user (e.g., link both GitHub and Google).

#### 3. `refresh_tokens` (New)
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of token

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,

    -- Revocation
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),

    -- Metadata
    user_agent VARCHAR(512),
    ip_address INET
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Security Notes**:
- Store SHA256 hash of refresh token, not plaintext
- Cleanup job: Delete expired tokens daily
- Limit: Max 5 active refresh tokens per user (revoke oldest on new login)

#### 4. `impersonation_sessions` (New)
```sql
CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    impersonated_user_id UUID NOT NULL REFERENCES users(id),

    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,

    CHECK (admin_user_id != impersonated_user_id)
);

CREATE INDEX idx_impersonation_admin ON impersonation_sessions(admin_user_id);
CREATE INDEX idx_impersonation_active ON impersonation_sessions(admin_user_id)
    WHERE ended_at IS NULL;
```

**Purpose**: Track active impersonation sessions. Admin can have max 1 active impersonation at a time.

---

## Authentication Flow

### OAuth Flow (Detailed)

#### Step 1: User Clicks "Sign in with Google"

**Frontend** (`/sign-in` page):
```typescript
// User clicks OAuth button
<button onClick={() => window.location.href = '/api/auth/oauth/google'}>
  Sign in with Google
</button>
```

#### Step 2: Backend Redirects to Provider

**Backend** (`GET /api/auth/oauth/{provider}`):
```rust
// Generate OAuth authorization URL
// Redirect user to provider with:
// - client_id
// - redirect_uri = https://yourdomain.com/api/auth/callback/{provider}
// - scope = profile email
// - state = random CSRF token (stored in cookie)
```

#### Step 3: User Authorizes on Provider

User logs in to Google/GitHub/Discord and grants permissions.

#### Step 4: Provider Redirects Back with Code

**Provider redirects to**: `https://yourdomain.com/api/auth/callback/google?code=XXX&state=YYY`

#### Step 5: Backend Exchanges Code for Tokens

**Backend** (`GET /api/auth/callback/{provider}`):
```rust
async fn oauth_callback(provider: Provider, code: String, state: String) -> Result<Response> {
    // 1. Validate CSRF state
    // 2. Exchange code for access token (POST to provider)
    // 3. Fetch user profile (GET provider's user info endpoint)
    let profile = fetch_user_profile(access_token).await?;

    // 4. Upsert user in database
    let user = get_or_create_user(profile).await?;

    // 5. Generate tokens
    let access_token = generate_access_token(&user)?; // 15 min
    let refresh_token = generate_refresh_token(&user).await?; // 30 days

    // 6. Set tokens in HTTP-only cookies
    // 7. Redirect to frontend /home
    redirect_to_frontend_with_tokens()
}
```

#### Step 6: Frontend Stores Tokens

**Frontend**: Receives cookies with `access_token` and `refresh_token`. Stores in HTTP-only cookies (secure, SameSite=Lax).

**Alternative**: Return tokens in URL hash fragment → frontend stores in memory/localStorage.

---

### Provider-Specific Details

#### Google OAuth
- **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **User Info**: `https://www.googleapis.com/oauth2/v2/userinfo`
- **Scopes**: `openid profile email`
- **User ID Field**: `sub`

#### GitHub OAuth
- **Authorization URL**: `https://github.com/login/oauth/authorize`
- **Token URL**: `https://github.com/login/oauth/access_token`
- **User Info**: `https://api.github.com/user`
- **Scopes**: `read:user user:email`
- **User ID Field**: `id`
- **Note**: Fetch email separately from `/user/emails` if not public

#### Discord OAuth
- **Authorization URL**: `https://discord.com/api/oauth2/authorize`
- **Token URL**: `https://discord.com/api/oauth2/token`
- **User Info**: `https://discord.com/api/users/@me`
- **Scopes**: `identify email`
- **User ID Field**: `id`

---

## Token Management

### Token Types

#### Access Token (JWT)

**Purpose**: Short-lived token for API authentication
**Lifetime**: 15 minutes
**Storage**: Memory (frontend) or HTTP-only cookie
**Format**: JWT (RS256 signature)

**Claims**:
```json
{
  "sub": "user-uuid",           // Subject (user ID)
  "role": "admin",              // User role
  "iat": 1705334400,            // Issued at
  "exp": 1705335300,            // Expires at (iat + 15 min)
  "iss": "nowaster-api",        // Issuer
  "aud": "nowaster-web",        // Audience
  "impersonating": "user-uuid"  // Optional: if admin impersonating
}
```

#### Refresh Token

**Purpose**: Long-lived token to obtain new access tokens
**Lifetime**: 30 days
**Storage**: HTTP-only cookie (backend issues)
**Format**: Cryptographically random string (32 bytes)

**Example**: `a3f8c2e1d4b7a9f2c5e8d1b4a7c0e3f6b9d2e5a8c1f4b7e0d3a6c9f2e5b8d1a4`

**Database Storage**: SHA256 hash only

---

### Token Generation (Backend)

#### Access Token Generation

```rust
use jsonwebtoken::{encode, Header, EncodingKey, Algorithm};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,        // user_id
    role: String,       // "admin" | "user"
    iat: i64,           // issued_at timestamp
    exp: i64,           // expiry timestamp
    iss: String,        // "nowaster-api"
    aud: String,        // "nowaster-web"
    #[serde(skip_serializing_if = "Option::is_none")]
    impersonating: Option<String>, // impersonated user_id
}

fn generate_access_token(user: &User, impersonating: Option<Uuid>) -> Result<String> {
    let now = Utc::now().timestamp();
    let claims = Claims {
        sub: user.id.to_string(),
        role: user.role.to_string(),
        iat: now,
        exp: now + 900, // 15 minutes
        iss: "nowaster-api".to_string(),
        aud: "nowaster-web".to_string(),
        impersonating: impersonating.map(|id| id.to_string()),
    };

    let header = Header::new(Algorithm::RS256);
    encode(&header, &claims, &PRIVATE_KEY)
}
```

**Key Management**:
- Generate RSA key pair on startup or load from file
- Private key (RS256): Sign tokens
- Public key: Distribute to frontend for validation (optional)

#### Refresh Token Generation

```rust
use rand::Rng;
use sha2::{Sha256, Digest};

async fn generate_refresh_token(user_id: Uuid, user_agent: &str, ip: IpAddr) -> Result<String> {
    // 1. Generate cryptographically random token
    let token = generate_random_token(32); // 32 bytes = 256 bits

    // 2. Hash token for storage
    let token_hash = sha256_hash(&token);

    // 3. Store in database
    let expires_at = Utc::now() + Duration::days(30);
    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        user_id, token_hash, expires_at, user_agent, ip
    ).execute(&pool).await?;

    // 4. Return plaintext token (only time we have it)
    Ok(token)
}

fn generate_random_token(bytes: usize) -> String {
    let mut rng = rand::thread_rng();
    let random_bytes: Vec<u8> = (0..bytes).map(|_| rng.gen()).collect();
    hex::encode(random_bytes)
}

fn sha256_hash(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}
```

---

### Token Validation (Backend)

#### Access Token Validation (Middleware)

```rust
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};

async fn jwt_auth_middleware(mut req: Request, next: Next) -> Result<Response, StatusCode> {
    // 1. Extract token from header
    let token = req.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // 2. Validate and decode JWT
    let validation = Validation::new(Algorithm::RS256);
    let token_data = decode::<Claims>(token, &PUBLIC_KEY, &validation)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // 3. Extract user info
    let user_id = Uuid::parse_str(&token_data.claims.sub)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    let role = UserRole::from_str(&token_data.claims.role)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // 4. Check for impersonation
    let impersonating = token_data.claims.impersonating
        .and_then(|id| Uuid::parse_str(&id).ok());

    // 5. Create Actor and inject into request
    let actor = Actor { user_id, role, impersonating };
    req.extensions_mut().insert(actor);

    // 6. Continue to handler
    Ok(next.run(req).await)
}
```

**Performance**: ~1-2ms per request (just cryptography, no DB).

#### Refresh Token Validation

```rust
async fn validate_refresh_token(token: &str, pool: &PgPool) -> Result<User> {
    // 1. Hash the incoming token
    let token_hash = sha256_hash(token);

    // 2. Query database
    let record = sqlx::query!(
        r#"
        SELECT user_id, expires_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
        "#,
        token_hash
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AuthError::InvalidRefreshToken)?;

    // 3. Check expiration
    if record.expires_at < Utc::now() {
        return Err(AuthError::RefreshTokenExpired);
    }

    // 4. Check revocation
    if record.revoked_at.is_some() {
        return Err(AuthError::RefreshTokenRevoked);
    }

    // 5. Fetch user
    let user = get_user_by_id(record.user_id, pool).await?;
    Ok(user)
}
```

---

### Token Refresh Endpoint

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```json
{
  "refresh_token": "a3f8c2e1d4b7a9f2c5e8d1b4a7c0e3f6b9d2e5a8c1f4b7e0d3a6c9f2e5b8d1a4"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new-refresh-token-here",
  "expires_in": 900
}
```

**Flow**:
1. Validate old refresh token
2. Mark old token as used (`last_used_at`)
3. Generate new access token (15 min)
4. Generate new refresh token (30 days)
5. Revoke old refresh token
6. Return both tokens

**Rotation**: Each refresh invalidates the old token → protects against token theft.

---

## Session Management

### Frontend Token Storage

**Option 1: HTTP-Only Cookies (Recommended)**

**Backend sets cookies**:
```rust
let cookie = Cookie::build("access_token", access_token)
    .http_only(true)           // Prevent XSS access
    .secure(true)              // HTTPS only
    .same_site(SameSite::Lax)  // CSRF protection
    .path("/")
    .max_age(Duration::minutes(15))
    .finish();
```

**Frontend**: Cookies automatically sent with requests. No JavaScript needed.

**Pros**: XSS-safe, simple
**Cons**: CSRF risk (mitigated by SameSite), harder to access in JS

**Option 2: Memory Storage**

**Frontend stores in React state**:
```typescript
const [accessToken, setAccessToken] = useState<string | null>(null);
const [refreshToken, setRefreshToken] = useState<string | null>(null);
```

**Pros**: Easy to access in JS
**Cons**: Lost on page refresh (must refresh tokens on mount), vulnerable to XSS

**Hybrid Approach** (Best):
- Access token in memory (auto-refresh on app load)
- Refresh token in HTTP-only cookie
- On app mount: Call `/api/auth/refresh` to get new access token

---

### Token Refresh Strategy (Frontend)

**Auto-refresh before expiration**:

```typescript
import { useEffect, useRef } from 'react';

function useTokenRefresh(accessToken: string | null) {
  const refreshTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!accessToken) return;

    // Decode JWT to get expiry (without verification)
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to ms
    const now = Date.now();

    // Refresh 1 minute before expiry
    const refreshAt = expiresAt - 60000;
    const timeout = refreshAt - now;

    if (timeout > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        const newTokens = await refreshAccessToken();
        // Update tokens in state/context
      }, timeout);
    }

    return () => clearTimeout(refreshTimerRef.current);
  }, [accessToken]);
}
```

**Fallback**: On 401 response, try refreshing token once before logging out.

---

### Session Cleanup

**Database cleanup job** (run daily via cron or background worker):

```rust
async fn cleanup_expired_tokens(pool: &PgPool) -> Result<()> {
    // Delete expired refresh tokens
    sqlx::query!(
        "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
    ).execute(pool).await?;

    // Delete revoked tokens older than 30 days (audit trail)
    sqlx::query!(
        "DELETE FROM refresh_tokens
         WHERE revoked_at IS NOT NULL
         AND revoked_at < NOW() - INTERVAL '30 days'"
    ).execute(pool).await?;

    Ok(())
}
```

**Trigger**: Run via Tokio interval or external cron job.

---

## Role-Based Access Control

### Role Model

**Two global roles**:
- `User` (default): Standard user permissions
- `Admin`: Full system access

**Database enum**:
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
```

**Rust enum**:
```rust
#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role")]
pub enum UserRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "admin")]
    Admin,
}
```

---

### Actor Extractor (Current)

Keep the existing `Actor` struct from Clerk implementation:

```rust
pub struct Actor {
    pub user_id: Uuid,
    pub role: UserRole,
    pub impersonating: Option<Uuid>, // NEW: for admin impersonation
}

impl Actor {
    pub fn is_admin(&self) -> bool {
        matches!(self.role, UserRole::Admin)
    }

    pub fn effective_user_id(&self) -> Uuid {
        self.impersonating.unwrap_or(self.user_id)
    }
}
```

**JWT middleware injects Actor** into request extensions (same pattern as Clerk).

---

### Admin-Only Endpoints

Keep existing `AdminUser` extractor:

```rust
pub struct AdminUser(pub Actor);

#[async_trait]
impl<S> FromRequestParts<S> for AdminUser {
    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Response> {
        let actor = parts.extensions.get::<Actor>()
            .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Not authenticated").into_response())?;

        if !actor.is_admin() {
            return Err((StatusCode::FORBIDDEN, "Admin access required").into_response());
        }

        Ok(AdminUser(actor.clone()))
    }
}
```

**Usage**:
```rust
async fn admin_only_endpoint(AdminUser(actor): AdminUser) -> Response {
    // Only admins can reach this
}
```

---

## Admin Impersonation

### Use Case

Admin needs to debug issue as specific user → impersonate user without knowing their password.

### Flow

#### 1. Start Impersonation

**Endpoint**: `POST /api/admin/impersonate`

**Request**:
```json
{
  "user_id": "target-user-uuid"
}
```

**Response**:
```json
{
  "access_token": "impersonation-jwt-with-special-claim",
  "impersonated_user": {
    "id": "target-user-uuid",
    "username": "target_username"
  }
}
```

**Backend**:
```rust
async fn start_impersonation(
    AdminUser(admin): AdminUser,
    Json(req): Json<ImpersonateRequest>,
    pool: Extension<PgPool>,
) -> Result<Json<TokenResponse>> {
    // 1. Verify target user exists
    let target_user = get_user_by_id(req.user_id, &pool).await?;

    // 2. Create impersonation session
    sqlx::query!(
        "INSERT INTO impersonation_sessions (admin_user_id, impersonated_user_id)
         VALUES ($1, $2)",
        admin.user_id, target_user.id
    ).execute(&pool).await?;

    // 3. Generate special access token
    let access_token = generate_access_token_with_impersonation(
        &admin,           // Token still has admin's user_id
        target_user.id    // But includes "impersonating" claim
    )?;

    Ok(Json(TokenResponse {
        access_token,
        impersonated_user: target_user,
    }))
}

fn generate_access_token_with_impersonation(
    admin: &Actor,
    target_user_id: Uuid,
) -> Result<String> {
    let claims = Claims {
        sub: admin.user_id.to_string(),  // Admin's ID (for audit)
        role: "admin".to_string(),        // Keep admin role
        impersonating: Some(target_user_id.to_string()), // NEW CLAIM
        // ... other claims
    };
    encode(&Header::new(Algorithm::RS256), &claims, &PRIVATE_KEY)
}
```

#### 2. Use Impersonation Token

**Frontend**: Admin uses returned `access_token` in API calls.

**Backend middleware**: Extracts `impersonating` claim and uses it for authorization checks:

```rust
// In endpoint handlers, use effective_user_id()
async fn get_my_sessions(actor: Actor, pool: Extension<PgPool>) -> Result<Json<Vec<Session>>> {
    let user_id = actor.effective_user_id(); // Returns impersonated user if set
    let sessions = fetch_user_sessions(user_id, &pool).await?;
    Ok(Json(sessions))
}
```

#### 3. Stop Impersonation

**Endpoint**: `POST /api/admin/stop-impersonate`

**Backend**:
```rust
async fn stop_impersonation(
    AdminUser(admin): AdminUser,
    pool: Extension<PgPool>,
) -> Result<StatusCode> {
    sqlx::query!(
        "UPDATE impersonation_sessions
         SET ended_at = NOW()
         WHERE admin_user_id = $1 AND ended_at IS NULL",
        admin.user_id
    ).execute(&pool).await?;

    Ok(StatusCode::NO_CONTENT)
}
```

**Frontend**: Discards impersonation token, returns to admin's normal token.

---

### Security Considerations

1. **Who can impersonate**: Only users with `role = 'admin'`
2. **Audit trail**: Basic (start/stop timestamps in `impersonation_sessions` table)
3. **Token expiry**: Impersonation tokens expire after 15 min (same as normal access tokens)
4. **One at a time**: Admin can have max 1 active impersonation
5. **Cannot impersonate other admins**: Optional check in `start_impersonation`

---

## Frontend Implementation

### Tech Stack

- **OAuth Client**: `oauth4webapi` (lightweight, spec-compliant)
- **HTTP Client**: Keep existing Axios setup
- **State Management**: React Context for auth state
- **Storage**: HTTP-only cookies for refresh token, memory for access token

---

### Auth Context

**Create auth provider** (`app/providers/AuthProvider.tsx`):

```typescript
'use client';

import { createContext, useContext, useState, useEffect, FC, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (provider: 'google' | 'github' | 'discord') => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const router = useRouter();

  // Auto-refresh token on mount
  useEffect(() => {
    refreshToken();
  }, []);

  // Auto-refresh before expiry
  useEffect(() => {
    if (!accessToken) return;

    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const timeout = expiresAt - Date.now() - 60000; // 1 min before expiry

    if (timeout > 0) {
      const timer = setTimeout(() => refreshToken(), timeout);
      return () => clearTimeout(timer);
    }
  }, [accessToken]);

  const login = (provider: 'google' | 'github' | 'discord') => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const refreshToken = async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Send cookies
      });

      if (!res.ok) throw new Error('Refresh failed');

      const data = await res.json();
      setAccessToken(data.access_token);
      setUser(data.user);
      setIsImpersonating(!!data.impersonating);
    } catch (err) {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setAccessToken(null);
    router.push('/sign-in');
  };

  const impersonate = async (userId: string) => {
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await res.json();
    setAccessToken(data.access_token);
    setIsImpersonating(true);
  };

  const stopImpersonation = () => {
    setIsImpersonating(false);
    refreshToken(); // Get normal token back
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      login,
      logout,
      refreshToken,
      impersonate,
      stopImpersonation,
      isImpersonating,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

### Axios Interceptor (Update Existing)

**Replace Clerk's `getToken()` with context** (`app/home/providers.tsx`):

```typescript
'use client';

import { useEffect, FC, ReactNode } from 'react';
import { setupAxiosInterceptors } from '@/api/baseApi';
import { useAuth } from './AuthProvider';

export const AxiosInterceptorWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();

  useEffect(() => {
    setupAxiosInterceptors(() => accessToken);
  }, [accessToken]);

  return <>{children}</>;
};
```

**No change needed** in `api/baseApi.ts` (already uses callback pattern).

---

### Sign-In Page

**Simplified OAuth buttons** (`app/sign-in/page.tsx`):

```typescript
'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { FaGoogle, FaGithub, FaDiscord } from 'react-icons/fa';

export default function SignInPage() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Sign in to Nowaster</h1>

        <div className="space-y-3">
          <Button
            onClick={() => login('google')}
            variant="outline"
            className="w-full"
          >
            <FaGoogle className="mr-2" />
            Continue with Google
          </Button>

          <Button
            onClick={() => login('github')}
            variant="outline"
            className="w-full"
          >
            <FaGithub className="mr-2" />
            Continue with GitHub
          </Button>

          <Button
            onClick={() => login('discord')}
            variant="outline"
            className="w-full"
          >
            <FaDiscord className="mr-2" />
            Continue with Discord
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**No sign-up page needed** (OAuth handles registration).

---

### Middleware (Update)

**Replace Clerk middleware** (`middleware.ts`):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/sign-in') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Protected routes - check for access token
  const accessToken = req.cookies.get('access_token')?.value;

  if (!accessToken && pathname.startsWith('/home')) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### Protected Route Layout (Update)

**Simplify** (`app/home/layout.tsx`):

```typescript
'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, FC, ReactNode } from 'react';

export default function HomeLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

---

## Backend Implementation

### Tech Stack

- **OAuth Client**: `oauth2` crate (Rust)
- **JWT**: `jsonwebtoken` crate (RS256)
- **HTTP Client**: `reqwest` (for provider API calls)
- **Database**: `sqlx` (existing)

---

### Project Structure

```
backend/src/
├── auth/
│   ├── mod.rs              # Auth module exports
│   ├── oauth.rs            # OAuth flow handlers
│   ├── tokens.rs           # JWT generation/validation
│   ├── middleware.rs       # JWT auth middleware
│   └── providers/          # OAuth provider configs
│       ├── google.rs
│       ├── github.rs
│       └── discord.rs
├── router/
│   ├── auth.rs             # Auth routes
│   └── admin.rs            # Admin routes (impersonation)
├── service/
│   └── auth_service.rs     # Business logic
└── repository/
    ├── oauth_repository.rs
    └── token_repository.rs
```

---

### OAuth Configuration

**Centralized config** (`auth/providers/mod.rs`):

```rust
use oauth2::{ClientId, ClientSecret, AuthUrl, TokenUrl, RedirectUrl};

pub struct OAuthProvider {
    pub client_id: ClientId,
    pub client_secret: ClientSecret,
    pub auth_url: AuthUrl,
    pub token_url: TokenUrl,
    pub redirect_url: RedirectUrl,
    pub scopes: Vec<String>,
}

impl OAuthProvider {
    pub fn google(config: &Config) -> Self {
        Self {
            client_id: ClientId::new(config.google_client_id.clone()),
            client_secret: ClientSecret::new(config.google_client_secret.clone()),
            auth_url: AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).unwrap(),
            token_url: TokenUrl::new("https://oauth2.googleapis.com/token".to_string()).unwrap(),
            redirect_url: RedirectUrl::new(format!("{}/api/auth/callback/google", config.base_url)).unwrap(),
            scopes: vec!["openid".into(), "profile".into(), "email".into()],
        }
    }

    // Similar for GitHub and Discord...
}
```

---

### OAuth Routes

**Auth router** (`router/auth.rs`):

```rust
use axum::{Router, routing::{get, post}};

pub fn auth_router() -> Router {
    Router::new()
        .route("/oauth/:provider", get(oauth_authorize))
        .route("/callback/:provider", get(oauth_callback))
        .route("/refresh", post(refresh_token_handler))
        .route("/logout", post(logout_handler))
        .route("/me", get(get_current_user))
}

// Handlers
async fn oauth_authorize(
    Path(provider): Path<String>,
    State(oauth_providers): State<OAuthProviders>,
) -> Result<Redirect> {
    let provider = oauth_providers.get(&provider)?;

    // Generate CSRF state token
    let state = generate_csrf_token();

    // Build authorization URL
    let (auth_url, _) = provider.client
        .authorize_url(|| state.clone())
        .add_scopes(provider.scopes.iter().map(|s| Scope::new(s.clone())))
        .url();

    // Set state cookie
    let mut response = Redirect::to(auth_url.as_str());
    response.headers_mut().insert(
        SET_COOKIE,
        format!("oauth_state={}; HttpOnly; Secure; SameSite=Lax; Max-Age=600", state).parse().unwrap(),
    );

    Ok(response)
}

async fn oauth_callback(
    Path(provider_name): Path<String>,
    Query(params): Query<CallbackParams>,
    State(app): State<AppState>,
    jar: CookieJar,
) -> Result<Redirect> {
    // 1. Validate CSRF state
    let stored_state = jar.get("oauth_state")
        .ok_or(AuthError::InvalidState)?
        .value();
    if stored_state != params.state {
        return Err(AuthError::InvalidState);
    }

    // 2. Exchange code for token
    let provider = app.oauth_providers.get(&provider_name)?;
    let token_response = provider.client
        .exchange_code(AuthorizationCode::new(params.code))
        .request_async(async_http_client)
        .await?;

    // 3. Fetch user profile
    let profile = fetch_user_profile(&provider_name, token_response.access_token()).await?;

    // 4. Create or update user
    let user = app.auth_service.get_or_create_user_from_oauth(profile).await?;

    // 5. Generate tokens
    let access_token = generate_access_token(&user)?;
    let refresh_token = generate_refresh_token(user.id, &app.pool).await?;

    // 6. Set cookies
    let jar = jar
        .add(create_cookie("access_token", &access_token, 900))
        .add(create_cookie("refresh_token", &refresh_token, 2592000))
        .remove(Cookie::named("oauth_state"));

    // 7. Redirect to frontend
    Ok((jar, Redirect::to("/home")))
}
```

---

### JWT Middleware

**JWT auth layer** (`auth/middleware.rs`):

```rust
use axum::{extract::Request, middleware::Next, response::Response, http::StatusCode};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

pub async fn jwt_auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract token from Authorization header or cookie
    let token = extract_token(&req)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Decode and validate JWT
    let validation = Validation::new(Algorithm::RS256);
    let token_data = decode::<Claims>(&token, &DECODING_KEY, &validation)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Create Actor from claims
    let actor = Actor {
        user_id: Uuid::parse_str(&token_data.claims.sub)
            .map_err(|_| StatusCode::UNAUTHORIZED)?,
        role: UserRole::from_str(&token_data.claims.role)
            .unwrap_or(UserRole::User),
        impersonating: token_data.claims.impersonating
            .and_then(|id| Uuid::parse_str(&id).ok()),
    };

    // Inject into request
    req.extensions_mut().insert(actor);

    Ok(next.run(req).await)
}

fn extract_token(req: &Request) -> Option<String> {
    // Try Authorization header first
    if let Some(auth_header) = req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                return Some(token.to_string());
            }
        }
    }

    // Fallback to cookie
    // (extract from Cookie header)
    None
}
```

**Apply to protected routes** (`router/root.rs`):

```rust
use axum::{Router, middleware};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Public routes
        .nest("/api/auth", auth_router())

        // Protected routes
        .nest("/api/session", session_router())
        .nest("/api/tag", tag_router())
        .nest("/api/feed", feed_router())
        .layer(middleware::from_fn(jwt_auth_middleware)) // Apply JWT middleware

        .with_state(state)
}
```

---

### Token Service

**Token generation** (`auth/tokens.rs`):

```rust
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation, Algorithm};
use once_cell::sync::Lazy;
use std::fs;

// Load RSA keys on startup
static ENCODING_KEY: Lazy<EncodingKey> = Lazy::new(|| {
    let private_key = fs::read("keys/private.pem").expect("Failed to read private key");
    EncodingKey::from_rsa_pem(&private_key).expect("Invalid private key")
});

static DECODING_KEY: Lazy<DecodingKey> = Lazy::new(|| {
    let public_key = fs::read("keys/public.pem").expect("Failed to read public key");
    DecodingKey::from_rsa_pem(&public_key).expect("Invalid public key")
});

pub fn generate_access_token(user: &User, impersonating: Option<Uuid>) -> Result<String> {
    let now = Utc::now().timestamp();
    let claims = Claims {
        sub: user.id.to_string(),
        role: user.role.to_string(),
        iat: now,
        exp: now + 900, // 15 minutes
        iss: "nowaster-api".to_string(),
        aud: "nowaster-web".to_string(),
        impersonating: impersonating.map(|id| id.to_string()),
    };

    encode(&Header::new(Algorithm::RS256), &claims, &ENCODING_KEY)
        .map_err(|e| AuthError::TokenGeneration(e.to_string()))
}

pub async fn generate_refresh_token(
    user_id: Uuid,
    user_agent: &str,
    ip: IpAddr,
    pool: &PgPool,
) -> Result<String> {
    // Generate random token
    let token = generate_random_hex(32);
    let token_hash = sha256(&token);

    // Store in database
    let expires_at = Utc::now() + Duration::days(30);
    sqlx::query!(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)",
        user_id, token_hash, expires_at, user_agent, ip
    ).execute(pool).await?;

    Ok(token)
}
```

---

### Key Generation

**Generate RSA key pair** (run once during setup):

```bash
# Generate private key
openssl genrsa -out backend/keys/private.pem 2048

# Extract public key
openssl rsa -in backend/keys/private.pem -pubout -out backend/keys/public.pem
```

**Add to `.gitignore`**:
```
backend/keys/private.pem
```

**Production**: Store private key in environment variable or secret manager.

---

## Security Considerations

### 1. Token Security

**Access Token (JWT)**:
- ✅ Short-lived (15 min) → limits damage if stolen
- ✅ Signed with RS256 → cannot be forged
- ✅ Stateless → no database lookups
- ❌ Cannot be revoked early (acceptable trade-off for performance)

**Refresh Token**:
- ✅ Stored as SHA256 hash → database leak doesn't expose tokens
- ✅ Rotation on use → stolen token becomes invalid
- ✅ Can be revoked in database
- ✅ Tied to IP/user agent → detect suspicious activity

### 2. OAuth Security

**CSRF Protection**:
- Generate random `state` parameter
- Store in HTTP-only cookie
- Validate on callback

**PKCE** (optional enhancement):
- Add Proof Key for Code Exchange for public clients
- Prevents authorization code interception

### 3. Cookie Security

**Flags**:
- `HttpOnly` → Prevent XSS access
- `Secure` → HTTPS only
- `SameSite=Lax` → CSRF protection
- `Max-Age` → Auto-expiry

### 4. Rate Limiting

**Recommended limits**:
- `/api/auth/oauth/*`: 5 requests/min per IP
- `/api/auth/refresh`: 10 requests/min per user
- `/api/admin/impersonate`: 3 requests/min per admin

**Implementation**: Use `tower-governor` middleware.

### 5. Audit Logging

**Log security events**:
- Failed login attempts (3+ failures → alert)
- Refresh token rotations
- Impersonation start/stop
- Admin actions

**Storage**: Separate `audit_log` table or external service (e.g., Loki).

### 6. Database Security

**Encryption**:
- Refresh token hashes (SHA256)
- Consider encrypting `oauth_accounts.access_token` if storing provider tokens

**Access Control**:
- Database user has minimal permissions
- No `DROP TABLE` or `CREATE USER` privileges

---

## Migration Plan

### Phase 1: Preparation (Week 1)

**Backend**:
1. Create database migrations for new tables:
   - `oauth_accounts`
   - `refresh_tokens`
   - `impersonation_sessions`
2. Update `users` table:
   - Add `email` column
   - Keep existing `id` column (Clerk IDs) for reference
3. Generate RSA key pair for JWT signing
4. Install dependencies:
   - `oauth2 = "4.4"`
   - `jsonwebtoken = "9"`
   - `rand = "0.8"`
   - `sha2 = "0.10"`

**Frontend**:
1. Install dependencies:
   - Remove `@clerk/nextjs`, `@clerk/elements`, `svix`
   - Add `oauth4webapi` (optional, can use direct API calls)
2. Create new auth context provider
3. Build sign-in page with OAuth buttons

### Phase 2: Backend Implementation (Week 2-3)

1. Implement OAuth providers (Google, GitHub, Discord)
2. Build OAuth flow endpoints (`/oauth/:provider`, `/callback/:provider`)
3. Implement JWT generation and validation
4. Create JWT auth middleware
5. Build token refresh endpoint
6. Implement admin impersonation endpoints
7. Add rate limiting and security middleware

### Phase 3: Frontend Implementation (Week 3-4)

1. Build AuthProvider context
2. Update Axios interceptor to use new auth
3. Simplify sign-in page (remove Clerk components)
4. Remove sign-up page (OAuth handles it)
5. Update middleware to use new auth check
6. Build admin impersonation UI (if needed)
7. Add logout functionality

### Phase 4: Testing (Week 4)

1. Test OAuth flows for all providers
2. Test token refresh mechanism
3. Test protected routes
4. Test admin impersonation
5. Load test with concurrent users
6. Security audit:
   - Test CSRF protection
   - Test token expiry
   - Test rate limits

### Phase 5: Deployment (Week 5)

**Option 1: Fresh Start (Recommended)**

1. Announce migration date to users (1 week notice)
2. Deploy new auth system
3. Remove Clerk integration
4. Users re-register via OAuth
5. (Optional) Manual admin action to link old data by email

**Option 2: Parallel Migration**

1. Deploy new auth alongside Clerk
2. Add migration banner for users
3. Allow users to link OAuth to existing Clerk account
4. Gradually sunset Clerk over 2-4 weeks

**Option 3: Email-Based Linking**

1. On first OAuth login, check if email matches existing user
2. If match found, link OAuth account to existing user record
3. Preserves user data without manual intervention

### Phase 6: Cleanup

1. Remove Clerk environment variables
2. Remove Clerk webhooks
3. Archive old `users` table or rename ID column
4. Monitor error logs for 1-2 weeks
5. Remove Clerk dependencies from package.json/Cargo.toml

---

## Technology Stack

### Backend (Rust)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `oauth2` | 4.4 | OAuth 2.0 client |
| `jsonwebtoken` | 9 | JWT encode/decode |
| `reqwest` | 0.11 | HTTP client for provider APIs |
| `rand` | 0.8 | Cryptographic random generation |
| `sha2` | 0.10 | SHA256 hashing |
| `tower-governor` | 0.3 | Rate limiting middleware |
| `axum-extra` | 0.9 | Cookie handling |

**Remove**:
- `clerk-rs` (0.4.1)

### Frontend (Next.js)

| Dependency | Version | Purpose |
|------------|---------|---------|
| (None required) | - | OAuth via backend redirect |
| (Optional) `oauth4webapi` | Latest | OAuth 2.0 utilities |

**Remove**:
- `@clerk/nextjs` (^6.32.2)
- `@clerk/elements` (^0.23.65)
- `svix` (^1.76.1)

### Database (PostgreSQL)

**New Tables**:
- `oauth_accounts` → Link users to OAuth providers
- `refresh_tokens` → Store refresh token hashes
- `impersonation_sessions` → Track admin impersonations

**Updated Tables**:
- `users` → Add `email` column

---

## Environment Variables

### Backend (`.env`)

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OAuth - Discord
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Base URL for OAuth redirects
BASE_URL=https://yourdomain.com

# JWT Keys (or load from file)
JWT_PRIVATE_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem

# Remove these:
# CLERK_SECRET_KEY=xxx
```

### Frontend (`.env.local`)

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001

# Remove these:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=xxx
# CLERK_SECRET_KEY=xxx
```

---

## API Reference

### Authentication Endpoints

#### `GET /api/auth/oauth/:provider`
**Description**: Initiate OAuth flow
**Providers**: `google`, `github`, `discord`
**Response**: Redirect to provider authorization page

#### `GET /api/auth/callback/:provider`
**Description**: OAuth callback handler
**Query Params**: `code`, `state`
**Response**: Redirect to `/home` with auth cookies

#### `POST /api/auth/refresh`
**Description**: Refresh access token
**Request**: Cookie with `refresh_token` or JSON body
**Response**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "new-token",
  "expires_in": 900,
  "user": { "id": "...", "username": "...", "role": "user" }
}
```

#### `POST /api/auth/logout`
**Description**: Revoke refresh token and clear cookies
**Response**: 204 No Content

#### `GET /api/auth/me`
**Description**: Get current authenticated user
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "id": "uuid",
  "username": "johndoe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "avatarUrl": "https://..."
}
```

---

### Admin Endpoints

#### `POST /api/admin/impersonate`
**Description**: Start impersonating a user
**Requires**: Admin role
**Request**:
```json
{
  "user_id": "target-user-uuid"
}
```
**Response**:
```json
{
  "access_token": "impersonation-jwt",
  "impersonated_user": {
    "id": "...",
    "username": "..."
  }
}
```

#### `POST /api/admin/stop-impersonate`
**Description**: Stop current impersonation
**Requires**: Admin role
**Response**: 204 No Content

#### `GET /api/admin/sessions`
**Description**: List all active sessions (optional)
**Requires**: Admin role
**Response**:
```json
{
  "sessions": [
    {
      "user_id": "...",
      "created_at": "2026-01-15T12:00:00Z",
      "last_used_at": "2026-01-15T14:30:00Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

---

## Performance Benchmarks

### Expected Performance

**Access Token Validation** (per request):
- Time: 1-2ms
- CPU: Minimal (just RSA signature verification)
- Memory: ~1KB per token
- Database: 0 queries

**Refresh Token Rotation** (every 15 min):
- Time: 10-50ms
- Database: 2 queries (SELECT + INSERT)
- Network: 0

**OAuth Flow** (initial login):
- Time: 500ms - 2s (depends on provider)
- Database: 2-3 queries (upsert user + create refresh token)
- Network: 2 requests to provider

### Scalability

**Single backend instance**:
- 10,000+ concurrent users
- 100,000+ requests/hour

**Horizontal scaling**:
- Stateless design → add more backend instances
- No shared state (JWT validation is local)
- Refresh tokens in PostgreSQL (shared across instances)

**Database load**:
- 1 write per user per 15 minutes (refresh token rotation)
- Minimal read load (only on refresh endpoint)

---

## Appendix

### A. Database Migrations

**Migration 001: Create oauth_accounts**

```sql
-- backend/migrations/XXXX_create_oauth_accounts.sql
CREATE TYPE oauth_provider AS ENUM ('google', 'github', 'discord');

CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    provider oauth_provider NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),

    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider_email ON oauth_accounts(provider, provider_email);
```

**Migration 002: Create refresh_tokens**

```sql
-- backend/migrations/XXXX_create_refresh_tokens.sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,

    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),

    user_agent VARCHAR(512),
    ip_address INET
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Migration 003: Create impersonation_sessions**

```sql
-- backend/migrations/XXXX_create_impersonation_sessions.sql
CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    impersonated_user_id UUID NOT NULL REFERENCES users(id),

    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,

    CHECK (admin_user_id != impersonated_user_id)
);

CREATE INDEX idx_impersonation_admin ON impersonation_sessions(admin_user_id);
CREATE INDEX idx_impersonation_active ON impersonation_sessions(admin_user_id)
    WHERE ended_at IS NULL;
```

**Migration 004: Update users table**

```sql
-- backend/migrations/XXXX_update_users_add_email.sql
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
CREATE INDEX idx_users_email ON users(email);
```

---

### B. OAuth Provider Setup

#### Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable "Google+ API"
4. Navigate to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret

#### GitHub

1. Go to https://github.com/settings/developers
2. "New OAuth App"
3. Application name: "Nowaster"
4. Homepage URL: `https://yourdomain.com`
5. Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`
6. Copy Client ID and generate Client Secret

#### Discord

1. Go to https://discord.com/developers/applications
2. "New Application"
3. Navigate to "OAuth2" → "General"
4. Add redirect: `https://yourdomain.com/api/auth/callback/discord`
5. Copy Client ID and Client Secret
6. Under "OAuth2" → "Scopes", ensure `identify` and `email` are checked

---

### C. Testing Checklist

#### Unit Tests
- [ ] JWT generation and validation
- [ ] Refresh token hashing
- [ ] OAuth state generation
- [ ] Token expiry logic

#### Integration Tests
- [ ] Complete OAuth flow (Google)
- [ ] Complete OAuth flow (GitHub)
- [ ] Complete OAuth flow (Discord)
- [ ] Token refresh endpoint
- [ ] Logout endpoint
- [ ] Protected endpoint access
- [ ] Admin impersonation flow

#### Security Tests
- [ ] CSRF protection (invalid state)
- [ ] Expired access token rejection
- [ ] Expired refresh token rejection
- [ ] Revoked refresh token rejection
- [ ] Non-admin impersonation attempt (403)
- [ ] Rate limiting enforcement

#### Load Tests
- [ ] 1000 concurrent authenticated requests
- [ ] Token refresh under load
- [ ] OAuth callback handling

---

### D. Rollback Plan

If migration fails:

1. **Immediate**: Revert to previous deployment with Clerk
2. **Database**: Migrations are additive (new tables), no data loss
3. **Users**: Re-authenticate with Clerk
4. **Cleanup**: Drop new tables if needed:
   ```sql
   DROP TABLE impersonation_sessions;
   DROP TABLE refresh_tokens;
   DROP TABLE oauth_accounts;
   DROP TYPE oauth_provider;
   ```

---

## Conclusion

This design provides a **performant, secure, self-hosted authentication system** to replace Clerk with:

- ✅ **OAuth support** for Google, GitHub, Discord
- ✅ **Fast authentication** (1-2ms per request)
- ✅ **Long-lived sessions** (30-day refresh tokens)
- ✅ **Role-based access control** (admin/user)
- ✅ **Admin impersonation** for debugging
- ✅ **Industry-standard security** (JWT RS256, refresh token rotation)
- ✅ **No 3rd party dependencies** (self-hosted)

**Next Steps**:
1. Review and approve design
2. Set up OAuth apps with providers
3. Generate RSA keys
4. Begin Phase 1 implementation

---

**Document Version**: 1.0
**Last Updated**: 2026-01-15
**Authors**: System Design Team
**Status**: Ready for Implementation
