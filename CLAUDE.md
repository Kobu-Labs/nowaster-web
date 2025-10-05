# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

**Nowaster** is a time tracking application with a full-stack architecture:

- **Backend** (`backend/`): Rust/Axum API server with PostgreSQL database
- **Frontend** (`next-frontend/`): Next.js 14 application with React, TypeScript, and Tailwind CSS
- **Deployment** (`deploy/`): Docker Compose configuration for containerized deployment

### Backend Architecture (Rust)

The backend follows a modular layered architecture:

```
backend/src/
├── dto/          # Data Transfer Objects for API requests/responses
├── entity/       # Database entity models
├── repository/   # Database access layer
├── service/      # Business logic layer
├── router/       # HTTP route handlers and middleware
└── config/       # Database and application configuration
```

**Key Technologies:**
- Axum for HTTP server
- SQLx for database access
- Clerk for authentication
- Serde for JSON serialization

### Frontend Architecture (Next.js)

App Router structure with organized feature modules:

```
next-frontend/
├── app/          # Next.js app router pages and layouts
├── components/   # Reusable UI components
├── lib/          # Utilities and shared logic
├── api/          # API client and query definitions
├── state/        # State management (Jotai atoms)
├── validation/   # Zod schemas for form validation
└── types/        # TypeScript type definitions
```

**Key Technologies:**
- Next.js 14 with App Router
- React Query (TanStack Query) for server state
- Jotai for client state management
- Clerk for authentication
- ShadCN + Tailwind CSS for styling
- Zod for validation

## Development Commands

### Frontend (next-frontend/)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint code linting
npm run lint:fix     # Fix linting issues automatically
npm run format:write # Format code with Prettier
npm run format:check # Check code formatting
npm run storybook    # Start Storybook development server
```

### Backend (backend/)
```bash
cargo run            # Start development server
cargo build          # Build the project
cargo check          # Check for compilation errors
cargo test           # Run tests
cargo clippy         # Lint with Clippy
cargo fmt            # Format code
```

### Database Operations
```bash
# Run from backend/ directory
sqlx migrate run     # Apply database migrations
sqlx migrate revert  # Revert last migration
```

## Code Conventions

### Frontend
- Use TypeScript with strict type checking
- Follow Next.js App Router conventions
- Component files use PascalCase (e.g., `UserProfile.tsx`)
- Use shadcn consistent styling
- State management: React Query for server state, Jotai for client state
- API calls through centralized client in `api/` directory
- **ALWAYS use absolute imports** (e.g., `@/components/...` instead of `../../../components/...`)
- **PREFER React Query over useEffect** for data fetching and server state management
  - Use `useQuery` for fetching data
  - Use `useMutation` for creating/updating/deleting data
  - Only use `useEffect` for non-server-state side effects (DOM manipulation, subscriptions, etc.)
  - Create custom hooks in `components/hooks/` for reusable query logic
- **React Components**: Always define as `const Component: FC<Props> = (props) => {}`
- **TypeScript**: Always prefer `type` keyword over `interface` for type definitions

### Backend
- Follow Rust naming conventions (snake_case)
- Use structured error handling with custom error types
- Repository pattern for database access
- Service layer for business logic separation
- DTOs for API contract validation

## Testing

Frontend tests use the Storybook ecosystem. Backend uses Rust's built-in test framework with `cargo test`.

## Authentication

Both frontend and backend use Clerk for authentication. The backend validates JWT tokens from Clerk, while the frontend uses Clerk's React components.

## Database

PostgreSQL database with SQLx for type-safe queries. Database schema is managed through SQLx migrations in `backend/migrations/`.
