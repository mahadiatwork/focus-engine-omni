# Mahadi Personal Agent

The first slice of the personal agent is WhatsApp-first. It keeps reminders, todos, and study logs in Firebase Cloud Firestore, accepts natural-language reminder requests, and uses OpenRouter only for conversational fallback. The old Study Quest site is intentionally not modified.

## Current bot behavior

- `remind me in 10 minutes to ...`
- `remind me tomorrow at 9 am to ...`
- `daily check-in at 10 pm`
- `reminders`, `todos`, `status`, and `help`
- quick reminder actions: Done, Remind in 1 hour, Remind tomorrow
- `todo ...` and `complete todo 1`
- `study udemy 2 videos 45 minutes`
- OpenRouter fallback for questions that are not state-changing commands

## Setup order

1. Create or select a Firebase project, enable Cloud Firestore in Standard edition, and copy its service-account values into `.env.local` as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
2. Copy `.env.example` to `.env.local` and fill in the Meta WhatsApp Cloud API values, `OWNER_WHATSAPP_ID`, and optionally `OPENROUTER_API_KEY`.
3. Authenticate the Firebase CLI, select the project, and deploy the rules and indexes with `npx -y firebase-tools@latest use YOUR_FIREBASE_PROJECT_ID` followed by `npx -y firebase-tools@latest deploy --only firestore`.
4. Run locally with `npm run dev`.
5. Deploy this folder as its own Vercel project and set the same variables in Vercel. Keep `FIREBASE_PRIVATE_KEY` server-only.
6. In Meta, use `https://YOUR_DOMAIN/api/webhooks/whatsapp` as the webhook URL and use the verify token from `WHATSAPP_VERIFY_TOKEN`.

## Important delivery boundary

The reminder delivery route exists at `/api/cron/reminders`, but proactive sending stays disabled until Meta credentials, WhatsApp conversation-window/template rules, and billing behavior are verified. Set `ENABLE_PROACTIVE_MESSAGES=true` only after that review. The first slice is intentionally focused on reliable inbound interaction and persistent data.

The Chat SDK coordination state currently uses in-memory storage because this is a private, single-user bot. Firestore is the durable source of truth for personal reminders, todos, and study logs. If the bot later serves multiple users or needs durable webhook locks, replace the coordination state with a durable adapter before broad release.

