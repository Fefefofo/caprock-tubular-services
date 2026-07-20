# Caprock Tubular Services

Next.js 14 scaffold for oilfield pipe yard inventory, work orders, station
types, role-based access, and browser voice-command capture.

## Stack

- Next.js 14 App Router and TypeScript
- Supabase Auth and Postgres
- Supabase Row Level Security policy stubs
- Browser `MediaRecorder` audio capture
- Next.js Route Handler with a mocked transcription response
- pnpm

## Run locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Supabase project URL and anon key to `.env.local`. The server
   helper reads `SUPABASE_URL` and `SUPABASE_ANON_KEY`; browser auth uses the
   matching `NEXT_PUBLIC_` variables.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open `http://localhost:3000`.

The voice recorder requires microphone permission and a secure context. Local
`localhost` development is accepted by modern browsers.

## Folder structure

```text
src/
  app/
    api/voice-command/route.ts  Mock speech-to-text and command matching
    page.tsx                    Yard operations screen
  components/
    voice-command-capture.tsx   MediaRecorder client flow
  lib/supabase/
    client.ts                   Browser Supabase client
    server.ts                   Server Supabase client and auth cookies
supabase/
  migrations/                   Tables, roles, and RLS policy stubs
```

## Supabase setup

Create a Supabase project, fill in `.env.local`, and apply the SQL migration in
`supabase/migrations`. The migration creates:

- `profiles` with `admin`, `yard_manager`, and `operator` roles
- `inventory` for pipe lots, specifications, counts, status, and location
- `work_orders` for customer jobs, scheduling, assignment, and completion
- `station_types` for inspection, threading, cleaning, storage, and other yard
  stations

The included RLS policies are starting points. Before production, restrict
operator updates to assigned work orders and approved database functions so
clients cannot modify arbitrary protected fields.

## Voice command flow

1. The operator taps the microphone button and speaks into a headset.
2. `MediaRecorder` captures audio in the browser.
3. The client posts the audio blob to `/api/voice-command`.
4. The route validates the file and currently returns a mocked transcription,
   matched command, and confirmation.
5. The operator sees what the system heard and the action it matched.

To make this real, add the chosen speech-to-text provider key as
`SPEECH_TO_TEXT_API_KEY` in `.env.local`, replace the mock block in
`src/app/api/voice-command/route.ts`, validate parsed command arguments, and
write approved actions to Supabase from the server.
