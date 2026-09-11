# Baby's First Chapter — Birthday Invite Site

A personalised, invite-code-gated birthday party site built for a baby's first birthday. Guests enter a unique family code, read a personal welcome note, browse a twelve-month photo book, RSVP, and claim a book from the shelf to write a note inside.

**Live demo:** [bookshelf.yashumittal.com](https://bookshelf.yashumittal.com) — use the code `DEMO01`

---

## Features

- Invite-code gate with per-family welcome letters
- Twelve-month photo slideshow (swap in your own photos)
- Book shelf with real-time claim tracking — no two families claim the same book
- RSVP form with guest count and book selection (max 3 per family)
- Atomic write transactions prevent double-claims on concurrent submits
- Admin dashboard at `/admin.html`
- Deployable to Vercel (serverless) in one command

---

## Tech stack

- **Backend:** Node.js + Express
- **Database:** [Turso](https://turso.tech) (cloud SQLite via `@libsql/client`)
- **Config:** `config.yaml` — invite codes, family messages, and book list all live here
- **Frontend:** Vanilla JS, no framework
- **Deploy:** Vercel (serverless)

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/yashumittal90/birthday-bookshelf-invite.git
cd birthday-bookshelf-invite
npm install
```

### 2. Create a Turso database

```bash
# Install the Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Log in and create a DB
turso auth login
turso db create demo-birthday-invite

# Get the URL and auth token
turso db show demo-birthday-invite --url
turso db tokens create demo-birthday-invite
```

### 3. Configure environment

```bash
cp .env.example .env
# Fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, and ADMIN_KEY
```

### 4. Customise

Edit **`config.yaml`** to set your invite codes, family names, personal messages, and book list.

Edit **`public/index.html`** to update the baby's name, event date, time, and venue.

Edit **`public/js/months.js`** to set photo captions and point `img` to your own photos (replace the picsum.photos URLs with `/images/month0.jpg` etc. and add your photos to `public/images/`).

### 5. Run locally

```bash
node server.js
# → http://localhost:3000
```

Demo invite codes (from `config.yaml`): `DEMO01`, `DEMO02`, `DEMO03`, `DEMO04`, `DEMO05`

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set the three environment variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_KEY`) in the Vercel project settings → Environment Variables.

---

## Admin panel

Visit `/admin.html` and enter your `ADMIN_KEY`. Shows all RSVPs, guest counts, and which books have been claimed. Lets you delete individual RSVPs if needed.

---

## Customisation checklist

- [ ] `config.yaml` — add your real invite codes + family messages
- [ ] `public/index.html` — baby's name, event date, time, venue, parent names
- [ ] `public/js/months.js` — photo captions and image paths
- [ ] `public/images/` — add `month0.jpg` through `month12.jpg` (your actual photos)
- [ ] `.env` — Turso credentials + ADMIN_KEY
- [ ] Vercel env vars — same three as above

---

## License

MIT — feel free to use, adapt, and share.
