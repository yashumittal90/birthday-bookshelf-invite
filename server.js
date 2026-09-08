const express = require('express');
const path    = require('path');
const fs      = require('fs');
const yaml    = require('js-yaml');
const { createClient } = require('@libsql/client');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Load .env for local dev (prod uses platform env vars) ──────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if (k && rest.length && !process.env[k.trim()]) {
      process.env[k.trim()] = rest.join('=').trim();
    }
  });
}

// ── Load config from config.yaml ───────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, 'config.yaml');
let config;
try {
  config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (e) {
  console.error('❌  Failed to load config.yaml:', e.message);
  process.exit(1);
}

const FAMILY_CODES = Object.fromEntries(
  Object.entries(config.family_codes || {}).map(([k, v]) => [k.toUpperCase(), v])
);
const BOOKS = config.books || [];

// ── Turso / LibSQL client ───────────────────────────────────────────────────
if (!process.env.TURSO_DATABASE_URL) {
  console.error('❌  TURSO_DATABASE_URL env var not set');
  process.exit(1);
}

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create tables on first run — idempotent, safe on every cold start
const dbReady = (async () => {
  await db.execute(`CREATE TABLE IF NOT EXISTS rsvps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    invite_code TEXT    NOT NULL,
    family_name TEXT    NOT NULL,
    guest_count INTEGER NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS book_claims (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rsvp_id     INTEGER,
    book_title  TEXT NOT NULL,
    family_name TEXT NOT NULL,
    UNIQUE(book_title)
  )`);
  // Migrations for older DBs
  try { await db.execute('ALTER TABLE rsvps ADD COLUMN invite_code TEXT'); } catch (_) {}
  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS rsvps_invite_code_unique ON rsvps(invite_code)');
})();

// ── Helpers ─────────────────────────────────────────────────────────────────
function isValidCode(code) {
  return !!(code && FAMILY_CODES[code.toUpperCase()]);
}

// Rate limiter — 5 attempts per IP per 15 min
const rateLimitMap = new Map();
const RATE_LIMIT  = 5;
const RATE_WINDOW = 15 * 60 * 1000;
function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Auth middleware
function requireCode(req, res, next) {
  const code = req.query.code || req.body?.inviteCode || req.headers['x-invite-code'];
  if (!isValidCode(code)) return res.status(401).json({ error: 'Valid invite code required' });
  next();
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Verify invite code (rate-limited)
app.post('/api/verify-code', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ valid: false, error: 'Too many attempts. Try again in 15 minutes.' });
  }
  const { code } = req.body;
  const entry = FAMILY_CODES[code?.toUpperCase()];
  if (entry) {
    res.json({ valid: true, members: entry.members, message: entry.message });
  } else {
    res.json({ valid: false });
  }
});

// Get available books
app.get('/api/books', requireCode, async (req, res) => {
  try {
    await dbReady;
    const result = await db.execute('SELECT book_title, family_name FROM book_claims');
    const claimedMap = {};
    result.rows.forEach(r => { claimedMap[r.book_title] = r.family_name; });
    const books = BOOKS.map(b => ({
      title:     b,
      claimed:   !!claimedMap[b],
      claimedBy: claimedMap[b] || null,
    }));
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get existing RSVP by invite code
app.get('/api/rsvp', requireCode, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    await dbReady;
    const rsvp = await db.execute({
      sql:  'SELECT id, guest_count, family_name FROM rsvps WHERE invite_code = ? ORDER BY id DESC LIMIT 1',
      args: [code.toUpperCase()],
    });
    if (!rsvp.rows.length) return res.json({ exists: false });
    const { id, guest_count, family_name } = rsvp.rows[0];
    const claims = await db.execute({
      sql:  'SELECT book_title FROM book_claims WHERE rsvp_id = ?',
      args: [Number(id)],
    });
    res.json({
      exists:     true,
      id:         Number(id),
      guestCount: guest_count,
      familyName: family_name,
      books:      claims.rows.map(r => r.book_title),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit / update RSVP
app.post('/api/rsvp', requireCode, async (req, res) => {
  const { inviteCode, familyName, guestCount, books: selectedBooks, ownBook } = req.body;
  if (!inviteCode || !familyName || !guestCount)
    return res.status(400).json({ error: 'Missing fields' });

  const count = parseInt(guestCount);
  if (isNaN(count) || count < 1 || count > 12)
    return res.status(400).json({ error: 'Guest count must be between 1 and 12.' });

  const shelfPicks = (selectedBooks || []).filter(b => BOOKS.includes(b));
  if (shelfPicks.length > 3)
    return res.status(400).json({ error: 'Max 3 books from the shelf per family.' });

  const sanitizedOwnBook = (ownBook || '').trim().slice(0, 120);
  const code = inviteCode.toUpperCase();

  try {
    await dbReady;
    const tx = await db.transaction('write');
    try {
      const upsert = await tx.execute({
        sql:  `INSERT INTO rsvps (invite_code, family_name, guest_count)
               VALUES (?, ?, ?)
               ON CONFLICT(invite_code) DO UPDATE
                 SET family_name = excluded.family_name,
                     guest_count = excluded.guest_count
               RETURNING id`,
        args: [code, familyName, count],
      });
      const rsvpId = Number(upsert.rows[0].id);
      await tx.execute({ sql: 'DELETE FROM book_claims WHERE rsvp_id = ?', args: [rsvpId] });

      const booksToAdd = [...shelfPicks];
      if (sanitizedOwnBook) booksToAdd.push(sanitizedOwnBook);

      const claimed = [];
      const alreadyTaken = [];
      for (const book of booksToAdd) {
        try {
          await tx.execute({
            sql:  'INSERT INTO book_claims (rsvp_id, book_title, family_name) VALUES (?, ?, ?)',
            args: [rsvpId, book, familyName],
          });
          claimed.push(book);
        } catch (e) {
          if (e.message?.includes('UNIQUE')) {
            // Another family claimed this shelf book between page load and submit
            if (BOOKS.includes(book)) alreadyTaken.push(book);
            else claimed.push(book); // own-book suggestions aren't shelf-constrained
          } else {
            throw e; // real error — let outer catch roll back the transaction
          }
        }
      }

      await tx.commit();
      res.json({ success: true, claimed, alreadyTaken });
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete RSVP by invite code
app.delete('/api/rsvp', requireCode, async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'Missing code' });
  const code = inviteCode.toUpperCase();
  try {
    await dbReady;
    const existing = await db.execute({
      sql: 'SELECT id FROM rsvps WHERE invite_code = ?', args: [code],
    });
    for (const row of existing.rows) {
      await db.execute({ sql: 'DELETE FROM book_claims WHERE rsvp_id = ?', args: [Number(row.id)] });
    }
    await db.execute({ sql: 'DELETE FROM rsvps WHERE invite_code = ?', args: [code] });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Guest list
app.get('/api/guests', requireCode, async (req, res) => {
  try {
    await dbReady;
    const result = await db.execute(
      'SELECT family_name, guest_count, created_at FROM rsvps ORDER BY created_at DESC'
    );
    res.json(result.rows.map(r => ({ name: r.family_name, count: r.guest_count, at: r.created_at })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin dashboard data
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) console.warn('⚠️  ADMIN_KEY env var not set — /api/admin is disabled');

app.get('/api/admin', async (req, res) => {
  const { key } = req.query;
  if (!ADMIN_KEY || key !== ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
  try {
    await dbReady;
    const [rsvpRows, claimRows] = await Promise.all([
      db.execute('SELECT id, invite_code, family_name, guest_count, created_at FROM rsvps ORDER BY created_at ASC'),
      db.execute('SELECT rsvp_id, book_title FROM book_claims'),
    ]);

    const claimsByRsvp = {};
    for (const r of claimRows.rows) {
      const id = Number(r.rsvp_id);
      if (!claimsByRsvp[id]) claimsByRsvp[id] = [];
      claimsByRsvp[id].push(r.book_title);
    }

    const rsvps = rsvpRows.rows.map(r => ({
      id:    Number(r.id),
      code:  r.invite_code,
      name:  r.family_name,
      count: r.guest_count,
      at:    r.created_at,
      books: claimsByRsvp[Number(r.id)] || [],
    }));

    const claimedTitles = new Set(claimRows.rows.map(r => r.book_title));

    res.json({
      totalFamilies: rsvps.length,
      totalGuests:   rsvps.reduce((s, r) => s + r.count, 0),
      rsvps,
      allBooks: BOOKS.map(t => ({ title: t, claimed: claimedTitles.has(t) })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin — delete single RSVP + free its book claims
app.delete('/api/admin/rsvp/:id', async (req, res) => {
  const { key } = req.query;
  if (!ADMIN_KEY || key !== ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await dbReady;
    await db.execute({ sql: 'DELETE FROM book_claims WHERE rsvp_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM rsvps WHERE id = ?',            args: [id] });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
// Export for Vercel serverless; start directly when run with `node server.js`
module.exports = app;

if (require.main === module) {
  dbReady.then(() => {
    app.listen(3000, () => console.log('🎉 Birthday site running on http://localhost:3000'));
  }).catch(e => {
    console.error('❌  DB init failed:', e.message);
    process.exit(1);
  });
}
