# Van Stock

Tracks what moves between the warehouse and each of the 9 vans. Two shared logins:

- **Inventory Management** - adjusts item counts for a van with up/down arrows and submits the changes.
- **Supply Chain** - watches those changes come in live, locks them in with "Update completed," and can drag vans between locations (Agoura Hills / Nor Cal / San Diego) to relabel them.

Warehouse-wide inventory is intentionally out of scope - this only tracks the 9 vans as their own mini-warehouses.

## How the numbers work

- Every item, in every van, has a `qty` (the last confirmed count) and a `pending_delta` (net change since the last "Update completed").
- The number shown on screen is always `qty + pending_delta` - the current best-known count.
- Inventory Management's up/down arrows build a delta locally in the browser. Hitting **Submit changes** adds that delta into `pending_delta` in the database (an atomic increment per item, so two people submitting around the same time never overwrite each other).
- Supply Chain polls the database every 4 seconds, so the flashing number is always within a few seconds of live.
- **Update completed** runs one database transaction that logs what changed (`update_history` table) and folds `pending_delta` into `qty`, then zeroes it out. Because it's a single transaction reading the live values at the moment it runs, a submit that lands a split second earlier is still captured - nothing is lost.

## One-time setup

### 1. Push this to GitHub and import it into Vercel
Create a new repo, push this folder, then "Add New Project" in Vercel and import that repo.

### 2. Add a Postgres database
In your Vercel project: **Storage** tab -> **Create Database** -> choose the Postgres/Neon option -> connect it to this project. Vercel will automatically add a `DATABASE_URL` (or `POSTGRES_URL`) environment variable - you don't need to copy anything by hand.

### 3. Set the login passwords and a session secret
In **Project Settings -> Environment Variables**, add:

| Name | Value |
|---|---|
| `IM_PASSWORD` | `Payments123$` |
| `SC_PASSWORD` | `Payments456&` |
| `SESSION_SECRET` | any long random string |

These already match what you asked for - they just live in Vercel's settings instead of the code, so you (or anyone with access to the project) can change either password later without touching a single file. Redeploy after adding them.

### 4. Seed the database (once)
This loads the 9 vans, the 43-item catalog from `Van_Essentials.xlsx`, and a zeroed starting count for every van x item pair.

```bash
npm install -g vercel        # if you don't have the Vercel CLI yet
vercel link                  # connect this folder to your Vercel project
vercel env pull .env         # pulls DATABASE_URL etc. into a local .env file
npm install
npm run seed
```

You'll see `Done.` printed at the end. This is safe to run again later - it won't duplicate anything.

### 5. Visit the site
Your Vercel URL will show the two login choices. Log in with either password and you're in.

## Changing the item catalog or van list later
Edit `lib/catalog.js` (item names/codes, van codes) and run `npm run seed` again - new rows will be added without disturbing existing counts.

## Local development
```bash
npm install
vercel env pull .env
npm run dev
```
