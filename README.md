# Van Inventory Movement

POS360 Supply Chain Ops tool for logging what gets loaded from the warehouse into each of the vans. It tracks **additions only**: vans are no longer treated as mini-warehouses with their own stock counts.

## How it works

- **Landing page:** enter the Inventory Management password to go to the loading screen.
- **Cog (upper right):** enter the Supply Chain password to go to the Supply Chain screen.
- A login lasts 12 hours, so returning to the landing page during that time skips the password.

### Categories
Items are grouped into Drawers & Mounts (1xxx), Printers (2xxx), Payment Terminals (3xxx PAX), Hardware & Network (other 3xxx), 360 Systems (9xxx) and Atypical. Atypical holds the items from InventorySnapshot.xlsx that weren't in the app before (imported automatically once, see `lib/schema.js`).

- Filter buttons on Load Van and Items are multi-select. With none on, everything except Atypical shows.
- Atypical items only show when their button is on, or when searching (search always covers every item).
- Atypical items stay off the printed audit sheets.
- New items get a category picked from their leading number, which can be changed when adding or later in the Items tab.

### Inventory Management
- Pick a van, tap **+** for each item loaded into it, then **Send**. **Clear** wipes the unsent taps if you make a mistake.
- **History** shows everything confirmed as loaded into that van over a date range.
- **All Vans** shows totals loaded into every van over a date range.
- **Print Audit Sheet / Print Multiple** prints blank count sheets (every item with an empty Count box) for one or more vans. Also available on the Supply Chain Incoming tab.

### Supply Chain
- **Incoming** watches additions arrive live (refreshes every 4 seconds) and shows which vans have something waiting. **Update completed** logs them as loaded and clears the list.
- **Update all vans & print summary** confirms every waiting van at once and opens a printable Van Load Summary of exactly what was confirmed.
- **Locations:** drag vans between Agoura Hills, Nor Cal and San Diego.
- **Items:** add or remove catalog items. Two items can share an inventory code after a warning prompt; shared codes show in yellow on the item lists (Load Van, Incoming, Items) so they can be double-checked.
- **Reports:** view what was loaded into each van over a date range, and export it as CSV.

## How the numbers work

- Each van x item row has a `pending_delta`: additions sent by Inventory Management that Supply Chain hasn't confirmed yet. Sends are atomic increments, so two people sending at once never overwrite each other.
- **Update completed** runs one database transaction that writes the pending additions to `update_history` (the movement log) and resets them to zero. Anything sent a split second before the click is still captured.
- The old `qty` column is no longer read or written.

## Setup

### Environment variables (Vercel -> Project Settings -> Environment Variables)

| Name | Value |
|---|---|
| `IM_PASSWORD` | Inventory Management password |
| `SC_PASSWORD` | Supply Chain password |
| `SESSION_SECRET` | a long random string (signs the login cookies) |
| `SETUP_KEY` | any value; protects `/api/setup` and `/api/rename-vans` |
| `DATABASE_URL` | added automatically when you connect Vercel Postgres/Neon |

Passwords are never stored in the code. If any of the first three are missing, login is disabled and shows an error. After changing them, redeploy.

### Database
Visit `/api/setup?key=YOUR_SETUP_KEY` once (safe to re-run), or run `npm run seed` locally after `vercel env pull .env`.

## Changing the item catalog or van list
Use the **Items** tab in Supply Chain, or edit `lib/catalog.js` and re-run setup. New rows are added without disturbing existing history.

## Local development
```bash
npm install
vercel env pull .env
npm run dev
```
