# Ledger — Personal Finance Dashboard

A Next.js app for tracking spending, budgets, and savings rate.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Deploy to Vercel (free)

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/finance-ledger.git
   git push -u origin main
   ```
2. Go to https://vercel.com, sign in with GitHub.
3. Click "Add New Project", select the `finance-ledger` repo.
4. Leave all settings as default (Vercel auto-detects Next.js) and click Deploy.
5. You'll get a live URL like `finance-ledger.vercel.app` that works on any phone or PC browser.

## Current limitations (by design, for now)

- **Storage is per-browser**: data is saved with `localStorage`, so it lives only on
  the device/browser you used to enter it — it will NOT sync across your phone and
  laptop, and each friend using the site would share the same local data unless you
  add real accounts.
- **No login yet**: anyone with the link sees/edits the same data. Fine for solo use
  or a demo; not fine for multiple friends with private data.
- **No TnG eWallet sync**: TnG doesn't offer a public API for reading personal
  transaction history, so data entry is manual or via CSV import (not yet built).

## Suggested next steps

1. Add Supabase (auth + Postgres) so each user has their own private data.
2. Add CSV import mapped to TnG's exported statement format.
3. Add a proper multi-user schema (Accounts/Categories/Transactions/Budgets per user).
