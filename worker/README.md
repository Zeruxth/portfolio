# Forms Worker

Takes the site's forms (contact now, the brand questionnaire later), keeps
every submission in D1 (`submissions`) and emails a notification to
`NOTIFY_TO` with reply-to set to the sender. Served at `api.akiwip.work`.

## Local

```bash
npm install
npm run db:migrate:local
npm run dev            # http://localhost:8790, which `next dev` posts to
```

Sent emails aren't delivered locally; wrangler logs them and writes them to
`.wrangler/tmp/email/`.

## First deploy

```bash
npx wrangler login
npx wrangler d1 create forms            # copy database_id into wrangler.jsonc
npx wrangler email sending enable akiwip.work
npm run db:migrate
npm run deploy
```

## Reading leads until the dashboard exists

```bash
npx wrangler d1 execute forms --remote --command "SELECT created_at, type, email, status, message FROM submissions ORDER BY created_at DESC LIMIT 20"
```

## Leads dashboard

`https://api.akiwip.work/admin`, locked with the `ADMIN_PASSWORD` secret
(any username):

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Locally the password comes from `.dev.vars` (gitignored).

Email goes through Email Routing to the verified address only, which keeps it
on the free plan. Sending to anyone else would need Workers Paid.
