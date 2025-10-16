# Nowaster

Simple application for tracking your time
![image](https://github.com/user-attachments/assets/ef7637c5-9158-4013-acc3-f4cb99c4c3a6)
![image](https://github.com/user-attachments/assets/47de1a86-2fa8-4888-ad06-e1503db17af9)

## Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env` and configure your environment variables
2. Create `backend/.env.keys` file with JWT keys (see `.env.keys.example` for format)
   - **Note**: The `.env.keys` file is required because the `envy` crate doesn't support multiline environment variables
   - JWT keys must be on a single line with `\n` for newlines
   - JWT keys are loaded directly via `std::env::var()` from this separate file
3. Generate JWT keys if needed:
   ```bash
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem
   ```

### Frontend

1. Copy `next-frontend/.env.example` to `next-frontend/.env.local` and configure your environment variables
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

## Activity

![Alt](https://repobeats.axiom.co/api/embed/7dc8f842034ca4bd3f1b4a98a07866d6aba7432e.svg "Repobeats analytics image")

## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).
