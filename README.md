# AI Group Chat

A full-stack, AI-powered group chat application built with:

- Frontend: Next.js (App Router) + React + TypeScript
- Backend: FastAPI (Python)
- Database/Auth/Realtime: Supabase
- LLM layer: OpenAI-compatible API (Groq/OpenAI via environment config)

Users can create or join groups, chat in real time, mention AI inside group chat, and get private message explanations. The backend also includes a school-fee JSON knowledge override for certain queries.

## Features

- Email/password authentication (Supabase Auth)
- Group management:
  - Create group with generated invite code
  - Join group by invite code
  - Leave group
  - Admin transfer on leave (RPC-driven)
- Real-time group chat using Supabase Realtime
- Presence and typing indicators
- Unread count per group via RPC
- AI in chat:
  - `@AI` or `/ai` in group chat sends question to FastAPI
  - AI reply is inserted back into group messages
- Private AI explain popup:
  - Explain any user message without posting into group chat
- School data override:
  - School fee-related questions are answered from local JSON dataset before LLM call

## Monorepo Structure

```text
ai-group-chat/
  backend/            # FastAPI API server
    app/
      api/
      core/
      schemas/
      services/
      data/
  frontend/           # Next.js app
    src/
      app/
      lib/
```

## Architecture

```text
Next.js Client
  |  (Supabase Auth + Realtime + DB queries)
  |  (HTTP for AI)
  v
FastAPI Backend (/ai/reply, /ai/explain)
  |\
  | +-> School JSON override (local data)
  |
  +-> OpenAI-compatible LLM API (Groq/OpenAI)
  |
  +-> Supabase Admin REST insert for AI messages

Supabase
  - auth.users
  - profiles
  - groups
  - group_members
  - group_invites
  - messages
  - RPCs (custom SQL functions)
```

## Tech Stack

Frontend
- Next.js 16
- React 19
- TypeScript
- Supabase JS client

Backend
- FastAPI
- Uvicorn
- HTTPX
- Pydantic
- python-dotenv

## Prerequisites

- Node.js 20+
- Python 3.10+
- Supabase project
- LLM API key (Groq or OpenAI-compatible provider)

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_AI_API_BASE=http://127.0.0.1:8000
```

### Backend (`backend/.env`)

```env
APP_ENV=dev

# LLM provider config
LLM_PROVIDER=groq
LLM_API_KEY=...
LLM_MODEL=llama-3.3-70b-versatile
LLM_BASE_URL=https://api.groq.com/openai/v1

# Supabase admin config
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional
AI_USER_ID=00000000-0000-0000-0000-000000000001
SCHOOL_DATA_PATH=app/data/school_data.json
```

## Setup and Run

## 1) Backend Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend health check:
- `GET http://127.0.0.1:8000/health`

## 2) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open:
- `http://localhost:3000`

## API Endpoints (FastAPI)

### `POST /ai/reply`

- Purpose: Public AI response for group chat
- Behavior:
  - Checks school-data override first
  - Else calls LLM
  - Inserts AI reply into Supabase `messages`
- Request body:

```json
{
  "group_id": "uuid",
  "user_question": "Summarize today discussion",
  "context": [
    { "role": "user", "content": "...", "sender_id": "...", "created_at": "..." }
  ]
}
```

- Response:

```json
{ "reply": "..." }
```

### `POST /ai/explain`

- Purpose: Private explanation (popup)
- Behavior:
  - Calls LLM
  - Does not insert any message into DB
- Request/response shape: same as `/ai/reply`

## Supabase Requirements

This project expects these tables/entities:

- `profiles`
- `groups`
- `group_members`
- `group_invites`
- `messages`

Expected custom RPC functions used by frontend:

- `my_groups_with_unread`
- `join_group_by_invite(p_invite text)`
- `transfer_admin_and_leave(p_group_id uuid, p_new_admin_user_id uuid)`

Typical DB automation expected by app logic:

- Profile row creation on signup
- Auto add group creator as admin member on group creation

## User Flow

1. Sign up or log in
2. Create a group or join with invite code
3. Open group chat
4. Send normal messages
5. Use `@AI` or `/ai` for AI-generated group reply
6. Click `Explain` on a message for private AI explanation
7. Leave group (admin must assign new admin first)

## Known Notes

- The group chat page file currently contains multiple historical/commented code versions; the final active implementation is at the bottom of the file.
- The frontend Supabase client file is currently named `client.ts.ts`.
- CORS in backend currently allows specific local origins; update `allow_origins` in production.

## Security Checklist Before GitHub Upload

1. Rotate any exposed keys immediately (Supabase service role, anon key, LLM key).
2. Ensure real secrets are not committed.
3. Keep `.env` and `.env.local` in ignored files.
4. Use separate dev/staging/prod credentials.

## Future Improvements

- Add Docker setup for one-command local startup
- Add tests (frontend and backend)
- Add CI pipeline (lint + type check + test)
- Add database schema/migration files to repository
- Clean historical commented code from long frontend files

## License

No license file is currently included. Add a `LICENSE` file before open-source distribution.
