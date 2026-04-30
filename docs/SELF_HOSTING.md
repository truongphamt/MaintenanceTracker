# Self-hosting on a Raspberry Pi

This document captures the migration path from managed Supabase (free tier) to
a self-hosted Supabase stack running on a Raspberry Pi at home. It is a future
runbook; nothing in the app depends on it today.

## Why this is possible without rewriting the app

Supabase is open source. Postgres, GoTrue (auth), PostgREST (auto-generated
REST API), Realtime, and Storage all run as Docker containers, including on
ARM64 (Pi 4/5). The same `@supabase/supabase-js` client is used against either
flavor; switching only changes the URL and anon key.

The frontend reaches storage through `src/services/dataService.ts`, which
defines a `DataService` interface. Today only `LocalDataService` (localStorage)
implements it. When we add `SupabaseDataService`, every component continues to
go through the same interface, so the swap is one file.

## Hardware

| Component | Recommended | Notes |
|---|---|---|
| Pi model | Pi 5, 8 GB | Pi 4 with 4 GB works for a single household |
| Storage | External SSD over USB 3.0 | Never run Postgres on the SD card; it will wear out |
| Network | Wired Ethernet | Reduces latency and avoids Wi-Fi flakiness |
| Power | Official 27 W USB-C PSU | Underpowered supplies cause Postgres corruption under load |

## Stack on the Pi

1. Raspberry Pi OS (64-bit) - required for the ARM64 Docker images.
2. Docker Engine + Docker Compose plugin.
3. The official `supabase/docker` Compose stack (clone from
   <https://github.com/supabase/supabase>, `cd docker`).
4. Reverse proxy for HTTPS - either Caddy (auto-TLS via Let's Encrypt) or a
   Cloudflare Tunnel (no port forwarding required).
5. Optional: Tailscale so phones/laptops can reach the Pi over a private
   network without exposing it to the public internet.

## Migration steps (when the day comes)

```bash
# 1. On the laptop, dump everything from managed Supabase
pg_dump --no-owner --no-acl \
  "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  > backup.sql

# 2. rsync the storage bucket to the Pi
# (assumes you've configured the supabase CLI or used the Storage API)
supabase storage cp -r supabase://attachments ./attachments-backup
rsync -av attachments-backup/ pi@homepi:/srv/supabase/storage/attachments/

# 3. On the Pi, bring up the self-hosted stack
cd ~/supabase/docker
docker compose up -d

# 4. Restore the dump into the Pi's Postgres
docker compose exec -T db psql -U postgres -d postgres < backup.sql

# 5. Re-apply migrations from the repo to confirm parity
#    (when Supabase CLI is wired into the project)
supabase db push --db-url postgresql://postgres:[PI_PASSWORD]@homepi:5432/postgres

# 6. Generate a new anon key on the Pi (printed by the Compose stack on first
#    start) and update .env.local / production env vars
```

After step 6 the React app starts hitting the Pi instead of Supabase Cloud.
Nothing in the source needs to change.

## What the existing code already does to make this smooth

- All persistence flows through `src/services/dataService.ts` (no component
  imports `localStorage` directly anymore).
- `.env.example` documents `VITE_DATA_BACKEND`, `VITE_SUPABASE_URL`, and
  `VITE_SUPABASE_ANON_KEY` so the cutover is a config change, not a code
  change.
- IDs for new items are generated client-side (see `generateId` in
  `src/utils.ts`), which means no synchronous "read it back to find the new
  row" trick that would break under any networked backend.

## What still needs to happen before the Pi path is real

1. Pick auth method (magic link recommended) and add Supabase Auth.
2. Define the Postgres schema as `supabase/migrations/0001_init.sql` with
   row-level security policies enforcing `user_id = auth.uid()`.
3. Implement `SupabaseDataService` and select between it and
   `LocalDataService` based on `import.meta.env.VITE_DATA_BACKEND`.
4. Migrate attachments from base64 strings into Supabase Storage; replace
   `Attachment.dataUrl` with a path + signed-URL fetch.
5. Add a one-time "import data from this browser" button so existing
   localStorage state moves to the cloud on first sign-in.

Items 1-5 are the work that turns the Pi path from "documented" into
"exercised."
