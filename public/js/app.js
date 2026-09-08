// ═══════════════════════════════════════════════
// FLOATING MINI BOOKS (SVG open-book shape)
// ═══════════════════════════════════════════════
function initFloatingPages() {
  const container = document.getElementById('floating-pages');

  // Book-with-bookmark SVG (SVGRepo), recoloured to site palette:
  // body → forest green, spine → dark green, ribbon → gold, letter A → cream
  function makeMiniBook(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- book body — warm parchment (stands out against green bg) -->
      <path fill="#ede4d3" d="M432,8H80C66.766,8,56,18.766,56,32v456c0,13.234,10.766,24,24,24h352
        c13.234,0,24-10.766,24-24V32C456,18.766,445.234,8,432,8z"/>
      <!-- left spine panel — slightly deeper parchment -->
      <path fill="#c8b898" d="M95.781,8H80C66.766,8,56,18.766,56,32v456c0,13.234,10.766,24,24,24h15.781V8z"/>
      <!-- bookmark ribbon — site gold -->
      <path fill="#c8a96e" d="M400,0h-80c-4.418,0-8,3.582-8,8v119.996c0,2.883,1.547,5.543,4.055,6.961
        c2.508,1.422,5.586,1.391,8.063-0.102L360,113.325l35.883,21.531c1.266,0.762,2.695,1.141,4.117,1.141
        c1.359,0,2.719-0.344,3.945-1.039c2.508-1.418,4.055-4.078,4.055-6.961V8C408,3.582,404.418,0,400,0z"/>
      <!-- spine highlight line — mid parchment -->
      <path fill="#b0a080" d="M96,480c-4.422,0-8-3.582-8-8V48c0-4.418,3.578-8,8-8s8,3.582,8,8v424
        C104,476.418,100.422,480,96,480z"/>
      <!-- letter A — site gold -->
      <path fill="#c8a96e" d="M355.781,344h-0.572c-0.071-0.272-0.084-0.545-0.17-0.816L309.76,199.801
        c5.679-0.948,10.021-5.85,10.021-11.801c0-6.629-5.375-12-12-12h-64c-6.625,0-12,5.371-12,12
        c0,5.951,4.343,10.853,10.021,11.801l-45.279,143.383c-0.086,0.271-0.1,0.544-0.17,0.816h-0.572
        c-6.625,0-12,5.371-12,12s5.375,12,12,12h32c6.625,0,12-5.371,12-12c0-5.951-4.342-10.853-10.021-11.801
        L238.665,316h74.231l8.905,28.199c-5.678,0.948-10.021,5.85-10.021,11.801c0,6.629,5.375,12,12,12h32
        c6.625,0,12-5.371,12-12S362.406,344,355.781,344z M248.77,284l26.269-83.184
        c0.086-0.271,0.1-0.544,0.17-0.816h1.144c0.071,0.272,0.084,0.545,0.17,0.816L302.792,284H248.77z"/>
    </svg>`;
  }

  const alpha = 'aaravAARAV'.split('');
  const deva  = ['अ', 'ा', 'र', 'व'];
  const kn    = ['ಅ', 'ಾ', 'ರ', 'ವ'];

  // 12 cols × 8 rows = 96 cells total
  // Books explicitly spread — one per column across 8 of the 12 columns
  const COLS = 12, ROWS = 8;
  const colW  = 90 / COLS;   // 7.5% per column
  const rowH  = 0.95 / ROWS; // ~0.119 per row

  // One fixed duration per column — elements in the same column share a period
  // so their phase offsets never drift apart over time. Different columns vary
  // for visual interest (some lanes fall faster, some slower).
  const colDurs = Array.from({ length: COLS }, () => 9 + Math.random() * 4);

  // Build and shuffle all grid cells
  const cells = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      cells.push({ c, r });
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  // Pull out exactly 8 book cells — one per each of these columns,
  // evenly spaced so books never cluster
  const bookColTargets = [0, 1, 3, 4, 6, 7, 9, 10];
  const bookCells = [];
  const usedBookCols = new Set();
  for (let i = 0; i < cells.length && bookCells.length < 8; i++) {
    if (bookColTargets.includes(cells[i].c) && !usedBookCols.has(cells[i].c)) {
      usedBookCols.add(cells[i].c);
      bookCells.push(cells.splice(i, 1)[0]);
      i--;
    }
  }

  // Remaining 88 cells — split across English, Devanagari, Kannada
  const textTypes = [...Array(40).fill('letter'), ...Array(24).fill('deva'), ...Array(24).fill('kn')];
  for (let i = textTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [textTypes[i], textTypes[j]] = [textTypes[j], textTypes[i]];
  }

  // Final list: 8 books + 88 text = 96
  const items = [
    ...bookCells.map(cell => ({ type: 'book', cell })),
    ...cells.map((cell, i) => ({ type: textTypes[i], cell })),
  ];

  for (const { type, cell } of items) {
    const el = document.createElement('div');
    el.className = 'fp';
    const { c, r } = cell;

    if (type === 'book') {
      const size = Math.round(28 + Math.random() * 16);
      el.innerHTML = makeMiniBook(size);
    } else if (type === 'letter') {
      const letter = alpha[Math.floor(Math.random() * alpha.length)];
      const size   = Math.round(12 + Math.random() * 18);
      const color  = Math.random() > 0.5 ? '#e2c88a' : '#c8a96e';
      el.classList.add('fp-letter');
      el.style.fontSize = `${size}px`;
      el.style.color = color;
      el.textContent = letter;
    } else if (type === 'deva') {
      const ch    = deva[Math.floor(Math.random() * deva.length)];
      const size  = Math.round(15 + Math.random() * 13);
      const color = Math.random() > 0.5 ? '#e2c88a' : '#c8a96e';
      el.classList.add('fp-deva');
      el.style.fontSize = `${size}px`;
      el.style.color = color;
      el.textContent = ch;
    } else {
      const ch    = kn[Math.floor(Math.random() * kn.length)];
      const size  = Math.round(15 + Math.random() * 13);
      const color = Math.random() > 0.5 ? '#e2c88a' : '#c8a96e';
      el.classList.add('fp-kn');
      el.style.fontSize = `${size}px`;
      el.style.color = color;
      el.textContent = ch;
    }

    // X: stay within this column's band
    const left = (3 + c * colW + Math.random() * colW * 0.55).toFixed(1);

    // Y timing: no random jitter on frac — perfectly spaced within each column.
    // All elements in a column share the same duration, so offsets never drift.
    const frac  = 0.02 + r * rowH;
    const dur   = colDurs[c].toFixed(2);
    const delay = (-(frac * colDurs[c])).toFixed(2);

    const r0    = (Math.random() * 20 - 10).toFixed(1);
    const r1    = (+r0 + (Math.random() * 8 - 4)).toFixed(1);
    const rm    = ((+r0 + +r1) / 2).toFixed(1);
    const drift = (5 + Math.random() * 12) * (Math.random() > 0.5 ? 1 : -1);
    const dx1   = (drift * 0.4).toFixed(1);
    const dx2   = drift.toFixed(1);

    el.style.cssText += [
      `left:${left}%`,
      `--dur:${dur}s`,
      `--del:${delay}s`,
      `--r0:${r0}deg`,
      `--r1:${r1}deg`,
      `--rm:${rm}deg`,
      `--dx1:${dx1}px`,
      `--dx2:${dx2}px`,
    ].join(';');

    container.appendChild(el);
  }
}

// ═══════════════════════════════════════════════
// LOCK SCREEN
// ═══════════════════════════════════════════════
let unlockedMembers = '';
let unlockedMessage = '';
let unlockedCode    = '';

async function verifyCode() {
  const code = document.getElementById('code-input').value.trim();
  if (!code) return;

  let data;
  try {
    const res = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    data = await res.json();
  } catch (_) {
    document.getElementById('code-error').textContent = 'Network error. Please check your connection.';
    document.getElementById('code-error').classList.add('visible');
    return;
  }

  if (data.valid) {
    unlockedCode    = code.toUpperCase();
    unlockedMembers = data.members;
    unlockedMessage = data.message;
    localStorage.setItem('bday_code',    unlockedCode);
    localStorage.setItem('bday_members', data.members);
    localStorage.setItem('bday_message', data.message);
    showLetter(data.members, data.message);
  } else {
    const err = document.getElementById('code-error');
    err.classList.add('visible');
    document.getElementById('code-input').classList.add('shake');
    setTimeout(() => document.getElementById('code-input').classList.remove('shake'), 500);
  }
}

// On return visits: skip lock + letter, go straight to main
async function tryAutoUnlock() {
  const code    = localStorage.getItem('bday_code');
  const members = localStorage.getItem('bday_members');
  const message = localStorage.getItem('bday_message');
  if (!code || !members) return false;

  const res  = await fetch('/api/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  if (!data.valid) {
    localStorage.removeItem('bday_code');
    localStorage.removeItem('bday_members');
    localStorage.removeItem('bday_message');
    return false;
  }

  unlockedCode    = code.toUpperCase();
  unlockedMembers = members;
  unlockedMessage = message;
  document.getElementById('lock-screen').style.display = 'none';
  showMain();
  return true;
}

// Letter screen — user must tap to enter (no auto-advance)
function showLetter(members, message) {
  document.getElementById('lock-screen').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('letter-names').textContent  = members;
    document.getElementById('letter-message').textContent = message;

    const ws = document.getElementById('welcome-screen');
    ws.style.display = 'flex';
    setTimeout(() => ws.classList.add('visible'), 50);
  }, 400);
}

function showMain() {
  const main = document.getElementById('main-site');
  main.style.display = 'block';
  setTimeout(() => main.classList.add('visible'), 50);

  // Identity chip
  const nameEl = document.getElementById('identity-name');
  nameEl.textContent = unlockedMembers;
  nameEl.title = unlockedMembers; // full name on hover
  document.getElementById('identity-chip').classList.add('visible');

  buildBookViewer();
  loadGuests();
  loadBooksAndRsvp();
}


// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// PHOTO VIEWER — desktop book flip / mobile gallery
// On phones & small tablets (< 900px): full-bleed
// horizontal scroll-snap card carousel with native
// swipe. On desktop: double-buffer page flip book.
// ═══════════════════════════════════════════════
let currentPage = 0;
let isFlipping  = false;
let topSpread   = 'a'; // desktop only

function buildBookViewer() {
  currentPage = 0;
  buildMobileGallery();
}

// ── MOBILE: horizontal scroll-snap card carousel ─
function buildMobileGallery() {
  currentPage = 0;
  const container = document.getElementById('book-container');
  container.className = '';

  container.innerHTML = `
    <div class="mobile-gallery">
      <div class="gallery-track" id="gallery-track">
        ${MONTHS.map((m, i) => `
          <div class="gallery-card">
            <img class="gallery-img"
              src="${m.img}"
              alt="${m.label}"
              loading="${i === 0 ? 'eager' : 'lazy'}"
            />
            <div class="gallery-overlay">
              <span class="gallery-label">${m.label}</span>
              <span class="gallery-caption">${m.caption}</span>
              <span class="gallery-num">${String(m.num).padStart(2, '0')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const track = document.getElementById('gallery-track');

  // Sync dots + nav as the user swipes
  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = Math.round(track.scrollLeft / track.offsetWidth);
      if (idx !== currentPage && idx >= 0 && idx < MONTHS.length) {
        document.querySelectorAll('.dot')[currentPage]?.classList.remove('active');
        document.querySelectorAll('.dot')[idx]?.classList.add('active');
        currentPage = idx;
        updateNavUI();
      }
    }, 60);
  }, { passive: true });

  // Prev / next buttons
  const prevBtn = document.getElementById('book-prev');
  const nextBtn = document.getElementById('book-next');
  prevBtn.textContent = '←';
  nextBtn.textContent = '→';
  prevBtn.addEventListener('click', () => {
    if (currentPage > 0) galleryScrollTo(currentPage - 1);
  });
  nextBtn.addEventListener('click', () => {
    if (currentPage < MONTHS.length - 1) galleryScrollTo(currentPage + 1);
  });

  // Dots
  const dotsEl = document.getElementById('book-dots');
  dotsEl.innerHTML = '';
  MONTHS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Month ${i + 1}`);
    dot.addEventListener('click', () => galleryScrollTo(i));
    dotsEl.appendChild(dot);
  });

  updateNavUI();
}

// Programmatic scroll — also syncs state immediately
function galleryScrollTo(idx) {
  const track = document.getElementById('gallery-track');
  if (!track) return;
  track.scrollTo({ left: idx * track.offsetWidth, behavior: 'smooth' });
  document.querySelectorAll('.dot')[currentPage]?.classList.remove('active');
  document.querySelectorAll('.dot')[idx]?.classList.add('active');
  currentPage = idx;
  updateNavUI();
}

// ── DESKTOP: double-buffer page-flip book ───────
function buildDesktopBook() {
  const container = document.getElementById('book-container');
  container.className = 'book-outer';
  isFlipping = false;
  topSpread  = 'a';

  const m0 = MONTHS[0];

  container.innerHTML = `
    <div class="book-body">

      <!-- Spread B (behind, pre-staged) -->
      <div class="book-spread" id="spread-b" style="z-index:1">
        <div class="spread-left-pg"><img class="spread-img" id="sb-l" src="${m0.img}" alt="" /></div>
        <div class="book-spine-center"></div>
        <div class="spread-right-pg"><img class="spread-img" id="sb-r" src="${m0.img}" alt="" /></div>
      </div>

      <!-- Spread A (on top, starts active) -->
      <div class="book-spread" id="spread-a" style="z-index:2">
        <div class="spread-left-pg"><img class="spread-img" id="sa-l" src="${m0.img}" alt="" /></div>
        <div class="book-spine-center"></div>
        <div class="spread-right-pg"><img class="spread-img" id="sa-r" src="${m0.img}" alt="" /></div>
      </div>

      <!-- Flap — shown only during animation -->
      <div class="book-flap" id="book-flap" style="display:none">
        <div class="flap-front" id="flap-front"></div>
        <div class="flap-back"  id="flap-back"></div>
      </div>

      <!-- Footer always visible -->
      <div class="spread-footer">
        <span class="spread-label"   id="spread-label">${m0.label}</span>
        <span class="spread-caption" id="spread-caption">${m0.caption}</span>
        <span class="spread-num"     id="spread-num">${String(m0.num).padStart(2,'0')}</span>
      </div>
    </div>
  `;

  document.getElementById('book-prev').addEventListener('click', () => flipPage(currentPage - 1));
  document.getElementById('book-next').addEventListener('click', () => flipPage(currentPage + 1));

  const dotsEl = document.getElementById('book-dots');
  dotsEl.innerHTML = '';
  MONTHS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to month ${i + 1}`);
    dot.addEventListener('click', () => flipPage(i));
    dotsEl.appendChild(dot);
  });

  updateNavUI();
  preloadImages();
}

function preloadImages() {
  // Preload only the next image to avoid downloading all 12 on load
  if (MONTHS[1]) { const img = new Image(); img.src = MONTHS[1].img; }
}

function spreadEls(letter) {
  return {
    el: document.getElementById(`spread-${letter}`),
    l:  document.getElementById(`s${letter}-l`),
    r:  document.getElementById(`s${letter}-r`),
  };
}

function flipPage(newIdx) {
  if (isFlipping || newIdx === currentPage) return;
  if (newIdx < 0 || newIdx >= MONTHS.length) return;

  isFlipping = true;
  const dir       = newIdx > currentPage ? 'next' : 'prev';
  const flap      = document.getElementById('book-flap');
  const flapFront = document.getElementById('flap-front');
  const flapBack  = document.getElementById('flap-back');

  const curLetter = topSpread;
  const nxtLetter = topSpread === 'a' ? 'b' : 'a';
  const cur = spreadEls(curLetter);
  const nxt = spreadEls(nxtLetter);

  const curImg = MONTHS[currentPage].img;
  const nxtImg = MONTHS[newIdx].img;

  nxt.l.src = nxtImg;
  nxt.r.src = nxtImg;
  nxt.el.style.zIndex = '1';
  cur.el.style.zIndex = '2';

  const isNext = dir === 'next';
  flapFront.style.cssText = `
    position:absolute;inset:0;
    background-image:url('${curImg}');
    background-size:200% 100%;
    background-position:${isNext ? 'right' : 'left'} center;
  `;
  flapBack.style.cssText = `
    position:absolute;inset:0;display:none;
    background-image:url('${nxtImg}');
    background-size:200% 100%;
    background-position:${isNext ? 'left' : 'right'} center;
  `;

  const phase1CSS = isNext
    ? `display:block;position:absolute;top:0;right:0;bottom:58px;width:50%;z-index:10;transform-origin:left center;`
    : `display:block;position:absolute;top:0;left:0;bottom:58px;width:50%;z-index:10;transform-origin:right center;`;

  flap.setAttribute('style', phase1CSS + `transform:perspective(1400px) rotateY(0deg);transition:none;`);
  flap.offsetHeight;

  flap.style.transition = 'transform 0.38s cubic-bezier(0.55,0,0.9,0.5)';
  flap.style.transform  = `perspective(1400px) rotateY(${isNext ? '-' : ''}90deg)`;

  setTimeout(() => {
    flapFront.style.display = 'none';
    flapBack.style.display  = 'block';

    const phase2CSS = isNext
      ? `display:block;position:absolute;top:0;left:0;bottom:58px;width:50%;z-index:10;transform-origin:right center;`
      : `display:block;position:absolute;top:0;right:0;bottom:58px;width:50%;z-index:10;transform-origin:left center;`;

    flap.setAttribute('style', phase2CSS + `transform:perspective(1400px) rotateY(${isNext ? '' : '-'}90deg);transition:none;`);
    flap.offsetHeight;

    flap.style.transition = 'transform 0.38s cubic-bezier(0.1,0.5,0.45,1)';
    flap.style.transform  = 'perspective(1400px) rotateY(0deg)';

    setTimeout(() => {
      flap.style.display = 'none';
      nxt.el.style.zIndex = '2';
      cur.el.style.zIndex = '1';
      topSpread = nxtLetter;

      const nm = MONTHS[newIdx];
      document.getElementById('spread-label').textContent   = nm.label;
      document.getElementById('spread-caption').textContent = nm.caption;
      document.getElementById('spread-num').textContent     = String(nm.num).padStart(2,'0');

      document.querySelectorAll('.dot')[currentPage].classList.remove('active');
      document.querySelectorAll('.dot')[newIdx].classList.add('active');

      currentPage = newIdx;
      isFlipping  = false;
      updateNavUI();

      const preloadIdx = dir === 'next' ? newIdx + 1 : newIdx - 1;
      if (preloadIdx >= 0 && preloadIdx < MONTHS.length) {
        cur.l.src = MONTHS[preloadIdx].img;
        cur.r.src = MONTHS[preloadIdx].img;
      }
    }, 400);
  }, 385);
}

function updateNavUI() {
  document.getElementById('book-indicator').textContent =
    `${currentPage + 1} / ${MONTHS.length}`;
  document.getElementById('book-prev').style.opacity =
    currentPage === 0 ? '0.22' : '1';
  document.getElementById('book-next').style.opacity =
    currentPage === MONTHS.length - 1 ? '0.22' : '1';
}

// ═══════════════════════════════════════════════
// BOOKSHELF — visual spine UI
// ═══════════════════════════════════════════════
const SPINE_COLORS = [
  '#4e6b52','#7a5c44','#4a5e7a','#7a6840','#5a4e7a',
  '#3d6b60','#7a4a52','#5e6e3a','#4a5e68','#6e7038',
  '#4e5e52','#68425a','#3e4e62','#5e4840','#3e6248',
  '#726040','#4a6840','#5a3e52','#3a5870','#6a4e38',
];

let selectedBookTitles = new Set();
let shelfViewMode  = 'shelf';
let cachedBooks    = null;
let cachedExisting = null;

// Shared fixed tooltip — created once, reused for all spines
let shelfTip = null;
function getShelfTip() {
  if (!shelfTip) {
    shelfTip = document.createElement('div');
    shelfTip.id = 'shelf-tip';
    document.body.appendChild(shelfTip);
  }
  return shelfTip;
}
const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

let tipTimer = null;
function showTip(btn, text) {
  const tip = getShelfTip();
  tip.textContent = text;
  tip.classList.remove('visible');
  const rect = btn.getBoundingClientRect();
  tip.style.left = `${rect.left + rect.width / 2}px`;
  tip.style.top  = `${rect.top - 8}px`;
  tip.style.transform = 'translateX(-50%) translateY(-100%)';
  requestAnimationFrame(() => tip.classList.add('visible'));

  // On touch: auto-dismiss after 2.5s (no hover-out event to rely on)
  if (isTouchDevice()) {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(hideTip, 2500);
  }
}
function hideTip() {
  clearTimeout(tipTimer);
  getShelfTip().classList.remove('visible');
}

// Dismiss immediately if user scrolls
window.addEventListener('scroll', hideTip, { passive: true });

// Fetches books + any existing RSVP together, then renders both
async function loadBooksAndRsvp() {
  const [booksRes, rsvpRes] = await Promise.all([
    fetch(`/api/books?code=${encodeURIComponent(unlockedCode)}`),
    fetch(`/api/rsvp?code=${encodeURIComponent(unlockedCode)}`)
  ]);
  const books    = await booksRes.json();
  const existing = await rsvpRes.json();

  if (!Array.isArray(books)) {
    document.getElementById('book-loading').textContent = 'Could not load books. Please refresh.';
    return;
  }

  // Always pre-fill name from their invite code — editable but no need to type it
  document.getElementById('rsvp-name').value = unlockedMembers;

  // Pre-populate shelf + form if they've already RSVPed
  if (existing.exists) {
    document.getElementById('rsvp-count').value = existing.guestCount;
    document.getElementById('rsvp-submit').textContent = 'Update RSVP ✦';
    document.getElementById('rsvp-delete').style.display = 'block';
    // Pre-select previously claimed books
    existing.books.forEach(t => selectedBookTitles.add(t));
    // Show success view (they already RSVPed) with Edit button visible
    document.getElementById('rsvp-card').style.display    = 'none';
    document.getElementById('rsvp-success').style.display = 'flex';
    renderSuccessBooks(existing.books);
  }

  cachedBooks    = books;
  cachedExisting = existing;

  document.getElementById('book-loading').style.display = 'none';

  // Inject view toggle once (persists across view switches)
  const wrap = document.getElementById('book-select-wrap');
  if (!document.getElementById('shelf-view-toggle')) {
    const toggleBar = document.createElement('div');
    toggleBar.className = 'shelf-view-toggle';
    toggleBar.id = 'shelf-view-toggle';
    toggleBar.innerHTML = `
      <button class="view-toggle-btn active" data-view="shelf">⊞ Shelf</button>
      <button class="view-toggle-btn" data-view="list">≡ List</button>`;
    wrap.insertBefore(toggleBar, document.getElementById('book-checkboxes'));
    toggleBar.querySelectorAll('.view-toggle-btn').forEach(btn =>
      btn.addEventListener('click', () => switchShelfView(btn.dataset.view))
    );
  }

  const container = document.getElementById('book-checkboxes');
  if (shelfViewMode === 'shelf') buildShelfContent(container);
  else buildListContent(container);

  if (!document.getElementById('selected-summary')) {
    const summary = document.createElement('div');
    summary.className = 'selected-summary';
    summary.id = 'selected-summary';
    container.appendChild(summary);
  }
  if (existing.exists) renderSelectedSummary();
}

function switchShelfView(mode) {
  shelfViewMode = mode;
  document.querySelectorAll('.view-toggle-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === mode)
  );
  const container = document.getElementById('book-checkboxes');
  const summary   = document.getElementById('selected-summary');
  container.innerHTML = '';
  if (mode === 'shelf') buildShelfContent(container);
  else buildListContent(container);
  if (summary) container.appendChild(summary);
  renderSelectedSummary();
}

function buildShelfContent(container) {
  const books = cachedBooks, existing = cachedExisting;
  const stage = document.createElement('div');
  stage.className = 'shelf-stage';

  if (!existing.exists) {
    const hint = document.createElement('p');
    hint.className = 'shelf-hint';
    hint.id = 'shelf-hint';
    hint.textContent = isTouchDevice() ? 'Tap a spine to claim it ✦' : 'Click a spine to claim it ✦';
    stage.appendChild(hint);
  }

  let firstAvailableBtn = null;
  const row = document.createElement('div');
  row.className = 'shelf-row';
  row.id = 'shelf-row';

  books.forEach((b, i) => {
    const ours = existing.exists && existing.books.includes(b.title);
    const unavailable = b.claimed && !ours;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'book-spine-btn' + (unavailable ? ' claimed' : '') + (selectedBookTitles.has(b.title) ? ' selected' : '');
    btn.style.background = SPINE_COLORS[i % SPINE_COLORS.length];
    btn.dataset.title = b.title;
    const shortTitle   = b.title.split(' — ')[0];
    const displayTitle = shortTitle.length > 18 ? shortTitle.slice(0, 16) + '…' : shortTitle;
    btn.innerHTML = `<span class="spine-title">${displayTitle}</span>`;
    if (!unavailable) {
      btn.addEventListener('mouseenter', () => showTip(btn, b.title));
      btn.addEventListener('mouseleave', hideTip);
      btn.addEventListener('focus',      () => showTip(btn, b.title));
      btn.addEventListener('blur',       hideTip);
      btn.addEventListener('click', () => toggleSpine(btn, b.title));
      if (!firstAvailableBtn) firstAvailableBtn = btn;
    }
    row.appendChild(btn);
  });

  if (!existing.exists && firstAvailableBtn) firstAvailableBtn.classList.add('spine-pulse');

  const plank = document.createElement('div');
  plank.className = 'shelf-plank';
  stage.appendChild(row);
  stage.appendChild(plank);
  container.appendChild(stage);
}

function buildListContent(container) {
  const books = cachedBooks, existing = cachedExisting;
  const list = document.createElement('div');
  list.className = 'book-list';
  list.id = 'book-list';

  books.forEach((b, i) => {
    const ours        = existing.exists && existing.books.includes(b.title);
    const unavailable = b.claimed && !ours;
    const selected    = selectedBookTitles.has(b.title);
    const color       = SPINE_COLORS[i % SPINE_COLORS.length];
    const parts       = b.title.split(' — ');
    const title       = parts[0];
    const author      = parts[1] || '';

    const item = document.createElement('div');
    item.className = 'book-list-item' +
      (unavailable ? ' claimed' : '') +
      (selected    ? ' selected' : '');
    item.dataset.title = b.title;

    item.innerHTML = `
      <span class="book-list-strip" style="background:${color}"></span>
      <div class="book-list-info">
        <span class="book-list-title">${escapeHTML(title)}</span>
        ${author ? `<span class="book-list-author">${escapeHTML(author)}</span>` : ''}
      </div>
      <span class="book-list-check">
        <span class="book-list-circle">${unavailable ? '✕' : selected ? '✦' : ''}</span>
      </span>`;

    if (!unavailable) {
      item.addEventListener('click', () => {
        if (selectedBookTitles.has(b.title)) {
          selectedBookTitles.delete(b.title);
          item.classList.remove('selected');
          item.querySelector('.book-list-circle').textContent = '';
        } else {
          if (selectedBookTitles.size >= SHELF_BOOK_LIMIT) { showShelfLimitMsg(); return; }
          selectedBookTitles.add(b.title);
          item.classList.add('selected');
          item.querySelector('.book-list-circle').textContent = '✦';
        }
        renderSelectedSummary();
      });
    }
    list.appendChild(item);
  });

  container.appendChild(list);
}

async function reloadBooks() {
  // Wipe only the built shelf, then re-show the original loading indicator
  document.getElementById('book-checkboxes').innerHTML = '';
  document.getElementById('book-loading').style.display = 'block';
  selectedBookTitles.clear();
  await loadBooksAndRsvp();
}

const SHELF_BOOK_LIMIT = 3;

function dismissShelfHint() {
  // Remove pulse from all spines + fade out hint text on first interaction
  document.querySelectorAll('.spine-pulse').forEach(el => el.classList.remove('spine-pulse'));
  const hint = document.getElementById('shelf-hint');
  if (hint) { hint.classList.add('faded'); setTimeout(() => hint.remove(), 400); }
}

function toggleSpine(btn, title) {
  dismissShelfHint();
  if (selectedBookTitles.has(title)) {
    selectedBookTitles.delete(title);
    btn.classList.remove('selected');
  } else {
    if (selectedBookTitles.size >= SHELF_BOOK_LIMIT) {
      showShelfLimitMsg();
      return;
    }
    selectedBookTitles.add(title);
    btn.classList.add('selected');
  }
  renderSelectedSummary();
}

function showShelfLimitMsg() {
  let msg = document.getElementById('shelf-limit-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.id = 'shelf-limit-msg';
    msg.className = 'shelf-limit-msg';
    document.getElementById('selected-summary').before(msg);
  }
  msg.textContent = `Max ${SHELF_BOOK_LIMIT} shelf books per family — or add your own below ✦`;
  msg.classList.add('visible');
  clearTimeout(msg._timer);
  msg._timer = setTimeout(() => msg.classList.remove('visible'), 3000);
}

function renderSelectedSummary() {
  const summary = document.getElementById('selected-summary');
  if (!summary) return;

  if (selectedBookTitles.size === 0) {
    summary.innerHTML = '';
    return;
  }

  summary.innerHTML =
    `<p class="selected-summary-label">Your picks</p>` +
    [...selectedBookTitles].map(t => {
      const short = t.split(' — ')[0];
      return `<span class="selected-tag" data-title="${escapeAttr(t)}">
        ${escapeHTML(short)}
        <button class="selected-tag-remove" aria-label="Remove">×</button>
      </span>`;
    }).join('');

  // Attach remove listeners — no inline onclick, avoids all escaping issues
  summary.querySelectorAll('.selected-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.closest('.selected-tag').dataset.title;
      deselectBook(title);
    });
  });
}

function escapeAttr(str) {
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function deselectBook(title) {
  selectedBookTitles.delete(title);
  document.querySelectorAll('.book-spine-btn').forEach(btn => {
    if (btn.dataset.title === title) btn.classList.remove('selected');
  });
  document.querySelectorAll('.book-list-item').forEach(item => {
    if (item.dataset.title === title) {
      item.classList.remove('selected');
      const circle = item.querySelector('.book-list-circle');
      if (circle) circle.textContent = '';
    }
  });
  renderSelectedSummary();
}

// ═══════════════════════════════════════════════
// RSVP SUBMIT / EDIT / DELETE
// ═══════════════════════════════════════════════
document.getElementById('rsvp-submit').addEventListener('click', async () => {
  const name    = document.getElementById('rsvp-name').value.trim();
  const count   = parseInt(document.getElementById('rsvp-count').value);
  const ownBook = document.getElementById('own-book').value.trim();
  const chosen  = [...selectedBookTitles];

  if (!name || !count) {
    document.getElementById('rsvp-error').textContent =
      'Please fill in your family name and guest count.';
    return;
  }

  const btn = document.getElementById('rsvp-submit');
  btn.textContent = 'Saving…';
  document.getElementById('rsvp-error').textContent = '';

  let data;
  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: unlockedCode, familyName: name, guestCount: count, books: chosen, ownBook })
    });
    data = await res.json();
  } catch (_) {
    document.getElementById('rsvp-error').textContent = 'Network error. Please check your connection and try again.';
    btn.textContent = 'Confirm RSVP ✦';
    return;
  }

  if (data.success) {
    document.getElementById('rsvp-card').style.display    = 'none';
    document.getElementById('rsvp-success').style.display = 'flex';
    renderSuccessBooks(data.claimed || [...selectedBookTitles, ...(ownBook ? [ownBook] : [])]);
    const warningEl = document.getElementById('success-warning');
    if (data.alreadyTaken && data.alreadyTaken.length) {
      const names = data.alreadyTaken.map(t => t.split(' — ')[0]).join(', ');
      warningEl.textContent = `"${names}" was just claimed by another family — your RSVP is saved but without that book. Tap "Edit my RSVP" to pick another.`;
      warningEl.style.display = 'block';
    } else if (warningEl) {
      warningEl.style.display = 'none';
    }
    launchConfetti();
    loadGuests();
    reloadBooks();
  } else {
    document.getElementById('rsvp-error').textContent = data.error || 'Something went wrong. Please try again.';
    btn.textContent = 'Confirm RSVP ✦';
  }
});

function launchConfetti() {
  const colors = ['#c8a96e','#e2c88a','#3a5a40','#8aab8e','#ede4d3','#f7f1e8','#a07a42'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < 72; i++) {
    const el    = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size  = 5 + Math.random() * 7;
    const isCircle = Math.random() > 0.4;
    const angle = Math.random() * 360;
    const dist  = 180 + Math.random() * 220;
    const cx    = Math.cos(angle * Math.PI / 180) * dist;
    const cy    = Math.sin(angle * Math.PI / 180) * dist - 80;
    const rot   = (Math.random() - 0.5) * 720;
    const delay = Math.random() * 0.3;
    const dur   = 0.9 + Math.random() * 0.6;

    el.style.cssText = `
      position:absolute;
      left:50%; top:55%;
      width:${size}px; height:${isCircle ? size : size * 0.5}px;
      background:${color};
      border-radius:${isCircle ? '50%' : '2px'};
      opacity:0;
      animation: confettiBurst ${dur}s ease-out ${delay}s forwards;
      --cx:${cx}px; --cy:${cy}px; --cr:${rot}deg;
    `;
    container.appendChild(el);
  }
  setTimeout(() => container.remove(), 2500);
}

function renderSuccessBooks(books) {
  const el = document.getElementById('success-books');
  if (!el) return;
  if (!books || books.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML =
    `<p class="success-books-label">Your book${books.length > 1 ? 's' : ''}</p>` +
    books.map(t => `<span class="success-book-tag">${escapeHTML(t.split(' — ')[0])}</span>`).join('');
}

// "Edit my RSVP" — flip from success view back to the form
document.getElementById('rsvp-edit-btn').addEventListener('click', () => {
  document.getElementById('rsvp-success').style.display = 'none';
  document.getElementById('rsvp-card').style.display    = 'block';
  document.getElementById('rsvp-name').value  = unlockedMembers;
  document.getElementById('rsvp-submit').textContent = 'Update RSVP ✦';
  document.getElementById('rsvp-delete').style.display = 'block';
});

// "Cancel my RSVP" — delete and reset to fresh form
document.getElementById('rsvp-delete').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to cancel your RSVP?')) return;

  let data;
  try {
    const res = await fetch('/api/rsvp', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: unlockedCode })
    });
    data = await res.json();
  } catch (_) {
    alert('Network error. Please check your connection and try again.');
    return;
  }

  if (data.success) {
    // Reset form to fresh state
    document.getElementById('rsvp-name').value   = '';
    document.getElementById('rsvp-count').value  = '';
    document.getElementById('own-book').value    = '';
    document.getElementById('rsvp-submit').textContent  = 'Confirm RSVP ✦';
    document.getElementById('rsvp-delete').style.display = 'none';
    document.getElementById('rsvp-card').style.display    = 'block';
    document.getElementById('rsvp-success').style.display = 'none';
    loadGuests();
    reloadBooks();
  }
});


// ═══════════════════════════════════════════════
// GUESTS LIST
// ═══════════════════════════════════════════════
async function loadGuests() {
  const res    = await fetch(`/api/guests?code=${encodeURIComponent(unlockedCode)}`);
  const guests = await res.json();
  const el     = document.getElementById('guests-list');

  if (guests.length === 0) {
    el.innerHTML = '<p class="guests-empty">Be the first to RSVP ✦</p>';
    return;
  }
  const AVATAR_COLORS = ['#4e6b52','#7a5c44','#4a5e7a','#7a6840','#5a4e7a','#3d6b60','#7a4a52','#5e6e3a'];
  function avatarColor(name) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[Math.abs(h)];
  }

  const totalGuests = guests.reduce((s, g) => s + g.count, 0);
  el.innerHTML =
    `<p class="guests-total">${totalGuests} guest${totalGuests !== 1 ? 's' : ''} confirmed ✦</p>` +
    guests.map(g => `
      <div class="guest-row">
        <div class="guest-avatar" style="background:${avatarColor(g.name)}">${escapeHTML(g.name[0].toUpperCase())}</div>
        <span class="guest-name">${escapeHTML(g.name)}</span>
        <span class="guest-count">${g.count} ${g.count === 1 ? 'guest' : 'guests'}</span>
      </div>
    `).join('');
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
initFloatingPages();

document.getElementById('code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyCode();
  document.getElementById('code-error').classList.remove('visible');
});
document.getElementById('code-submit').addEventListener('click', verifyCode);

// Letter screen — tap to enter main site
document.getElementById('letter-enter').addEventListener('click', () => {
  const ws = document.getElementById('welcome-screen');
  ws.style.opacity = '0';
  setTimeout(() => { ws.style.display = 'none'; showMain(); }, 500);
});

// Identity chip reset
document.getElementById('identity-reset').addEventListener('click', () => {
  localStorage.removeItem('bday_code');
  localStorage.removeItem('bday_members');
  localStorage.removeItem('bday_message');
  location.reload();
});

// Auto-unlock returning visitors (skips lock screen + letter)
tryAutoUnlock();

// Scroll reveal
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section-header, .theme-inner, .rsvp-card, .guests-list')
  .forEach(el => revealObserver.observe(el));
