# RTBIO Survey URL Deployment Guide

## Recommendation

For a non-technical external team, deploy this app once and send them one URL.

Recommended operating model:

```text
Visitors: https://your-domain/#/survey
Pad QR screen: https://your-domain/#/qr-display
Operator/Admin: https://your-domain/#/admin
Staff redemption: https://your-domain/#/staff
Password: 1111
```

## Important

This app is not just a static website. It stores:

- visitor lead information
- survey answers
- completion codes
- redemption status
- editable survey questions
- editable event text

So it should be deployed as a Node web service with persistent storage.

Do not deploy only the static files unless you are intentionally using a single-browser demo.

## Easiest Deployment Path

Use a Node web hosting service that supports:

- Node.js 20+
- persistent disk/storage
- public HTTPS URL

The included files are prepared for that:

- `server.mjs`: Node server
- `package.json`: `npm start`
- `Dockerfile`: container deployment
- `render.yaml`: Render-style web service configuration
- `DATA_DIR`: environment variable for persistent data path

## Environment Variables

```text
HOST=0.0.0.0
PORT=4175
DATA_DIR=/path/to/persistent/data
```

If the hosting provider gives its own `PORT`, use that value.

## Health Check

After deployment, check:

```text
https://your-domain/api/health
```

Expected response:

```json
{"ok":true,"service":"rtbio-survey-app"}
```

## Post-Deployment Checklist

1. Open `https://your-domain/#/admin`.
2. Log in with `1111`.
3. Edit event title, product name, privacy text, and survey questions.
4. Open `https://your-domain/#/survey` and submit one test response.
5. Confirm completion code appears.
6. Open `https://your-domain/#/staff`.
7. Search the completion code and mark redemption complete.
8. Open `https://your-domain/#/admin`.
9. Confirm the record appears and CSV download works.
10. Generate/print QR using `https://your-domain/#/survey`.

## Data Backup

Runtime data is stored in:

```text
DATA_DIR/rtbio-db.json
```

Back this file up during and after the event.

## Longer-Term Production Option

For long-term use across many events, move storage to Supabase.

The starter schema is:

```text
docs/supabase-schema.sql
```
