# Use Rust official image
FROM rust:latest as builder

WORKDIR /app

# Install SQLx CLI for database migrations
RUN cargo install sqlx-cli --no-default-features --features postgres

# Copy dependencies for caching
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo fetch

# Copy the source code
COPY ./ ./
COPY .sqlx /app/.sqlx
COPY .sqlx .sqlx

RUN unset DATABASE_URL
# Build the backend
RUN SQLX_OFFLINE=true cargo build --release
ENV DATABASE_URL=${DATABASE_URL}

# Final runtime image
FROM ubuntu:22.04
WORKDIR /app

COPY --from=builder /app/target/release/axum-test /app/axum-test
COPY --from=builder /app/.sqlx /app/.sqlx

# Add backend application files, including migration files
COPY ./migrations /app/migrations

COPY --from=builder /usr/local/cargo/bin/sqlx /usr/local/bin/sqlx

EXPOSE ${BACKEND_PORT}

CMD ["/app/axum-test"]

