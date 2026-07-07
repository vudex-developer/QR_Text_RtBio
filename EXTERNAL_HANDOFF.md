# RTBIO QR Survey App - External Team Handoff

## What This Is

This is an event-ready QR survey and product redemption web app.

Visitors scan a QR code, enter lead information, answer 10 survey questions, and receive a completion code. Field operators log in with one simple password, verify completion codes, mark product redemption complete, edit survey questions, edit event copy, generate QR codes, and export CSV.

## Current Login

- Operator password: `1111`

The operator login protects both the staff redemption screen and admin screen.

## Main URLs

After the app is running:

- Visitor survey: `/#/survey`
- Pad QR display: `/#/qr-display`
- Staff redemption: `/#/staff`
- Admin dashboard: `/#/admin`

## Run Locally

Requirements:

- Node.js 20 or newer

Commands:

```bash
cd rtbio-survey-app
npm start
```

Default address:

```text
http://localhost:4175/
```

For other devices on the same Wi-Fi, run with:

```bash
HOST=0.0.0.0 PORT=4175 npm start
```

Then open:

```text
http://<server-ip>:4175/#/survey
http://<server-ip>:4175/#/qr-display
http://<server-ip>:4175/#/staff
http://<server-ip>:4175/#/admin
```

## Data Storage

The included Node server stores data in:

```text
data/rtbio-db.json
```

This allows multiple phones, tablets, and laptops connected to the same server URL to share the same submissions, redemption status, questions, and event settings.

Important: back up `data/rtbio-db.json` during/after the event.

## Public Internet Deployment

For true external/public use, the app needs to run on a hosted server with persistent storage.

See [URL_DEPLOYMENT_GUIDE.md](./URL_DEPLOYMENT_GUIDE.md) for the deployment-oriented checklist.

Recommended production options:

1. VPS or cloud VM running `npm start`
   - Simple and closest to the current implementation
   - Must keep `data/rtbio-db.json` on persistent disk
   - Use HTTPS and a real domain before printing final QR codes

2. Supabase + Vercel production rebuild
   - Better for long-term operation
   - Use `docs/supabase-schema.sql` as the database starting point
   - Replace the JSON file server APIs with Supabase-backed APIs

For a short event, option 1 is acceptable if the server has persistent disk and is backed up. For long-term customer/lead operations, option 2 is recommended.

## Event Setup Checklist

1. Start the hosted server.
2. Open `/#/admin`.
3. Log in with `1111`.
4. Edit event title, product name, privacy text, and completion text.
5. Edit the 10 survey questions.
6. Open `/#/qr-display` on the event tablet.
7. Download or generate the printed QR from the deployed `/#/survey` URL.
8. Test one full visitor submission.
9. Test code redemption on `/#/staff`.
10. Confirm the record appears in `/#/admin`.
11. Test CSV download.

## Verification

```bash
npm test
npm run check
```

Expected result:

- All tests pass
- Syntax checks exit successfully

## Files Of Interest

- `server.mjs`: Node HTTP server and API routes
- `src/app.js`: Browser UI
- `src/store.js`: Browser storage/API client
- `src/serverData.js`: JSON database logic
- `docs/supabase-schema.sql`: Supabase production schema draft
- `data/rtbio-db.json`: runtime database file, generated after first write
