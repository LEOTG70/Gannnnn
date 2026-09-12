# eFootball Champions Arena

A tournament registration + management website built with Next.js and MongoDB.

## Features
- Public site: browse tournaments, register with team/player details
- Two tournament formats, chosen when you create a tournament:
  - **Single Elimination** — bracket generated straight from approved players (handles byes automatically)
  - **Group Stage + Knockout** — set the number of groups and how many qualify per group; round-robin fixtures are generated automatically, standings update live from results, and the knockout bracket is auto-seeded from group qualifiers
- **Screenshot proof**: when the admin enters a match score, they can optionally attach a screenshot of the result screen. It's stored on the match and shown as a "View proof" link everywhere the match appears (admin and public).
- Admin panel: create tournaments, approve/reject registrations, generate group fixtures / brackets, enter match scores (auto-advances knockout winners, updates group standings live)
- Dark navy / neon-green esports theme

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=some_long_random_secret_string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

Get a free MongoDB URI from https://www.mongodb.com/cloud/atlas (create a free cluster,
add a database user, allow access from anywhere 0.0.0.0/0 for now, copy the connection string).

Create your admin login:
```bash
npm run seed:admin
```

Run locally:
```bash
npm run dev
```
Visit http://localhost:3000 and http://localhost:3000/admin/login

## 2. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Add Environment Variables in Vercel project settings:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy.
5. After first deploy, run the admin seed script once, pointing at your Atlas DB
   (run it locally with the same MONGODB_URI, or add a temporary API route —
   simplest is running `npm run seed:admin` locally, since it just needs to reach MongoDB).

## Project structure
- `app/` — pages and API routes (Next.js App Router)
- `models/` — Mongoose schemas (Tournament, Registration, Match, Admin)
- `lib/` — MongoDB connection + JWT auth helpers
- `components/` — RegisterForm, Bracket (shared by public + admin views)
- `scripts/seedAdmin.js` — creates/updates the admin login

## How the bracket logic works

### Single Elimination
- Only `approved` registrations are included.
- Players are shuffled and padded to the next power of 2 with byes.
- Round 1 byes auto-advance immediately.
- Entering a score in the admin panel marks the match complete and automatically
  places the winner into the correct slot of the next round match.
- When the final match is completed, the tournament status flips to `completed`.

### Group Stage + Knockout
- Admin sets **Number of Groups** and **Qualifiers per Group** when creating the tournament.
- "Generate Groups & Fixtures" splits approved players evenly across groups and
  creates a full round-robin schedule per group (everyone plays everyone once).
- Group matches can end in a draw (3 pts win / 1 pt draw / 0 pts loss), unlike
  knockout matches which must have a winner.
- Standings (Played / Won / Drawn / Lost / Goal Diff / Points) are computed live
  from completed match results — no separate step needed.
- "Generate Knockout Bracket" takes the top N finishers from each group (interleaved
  by rank across groups, so group-mates are spread apart where possible) and seeds
  them into a single-elimination bracket, reusing the same bye/auto-advance logic.
- You can generate the knockout bracket at any point — groups with unfinished
  matches will simply qualify whoever is currently leading.

### Screenshot proof
- The score-entry form (both group fixtures and knockout matches) has an optional
  image upload. It's converted to a data URL in the browser and stored directly on
  the match document — no external storage service needed.
- Anyone viewing the match (admin or public) sees a "📷 View proof" link if one was
  attached.


## Notes
- No payment integration (not needed per current requirements).
- To reset a tournament's bracket you currently need to delete its Match documents
  and set `bracketGenerated: false` directly in MongoDB — ask if you'd like a
  "reset bracket" admin button added.
