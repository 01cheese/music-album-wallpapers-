// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  mode: 'single',          // 'single' | 'collage'
  artist: null,
  albums: [],
  selectedAlbum: null,
  collageAlbums: [],
  resolution: null,
  resTab: 'desktop',
  style: null,
  usedAlbumIndices: [],
};

const QUICK_ARTISTS = [
  'Radiohead', 'Kendrick Lamar', 'Björk', 'The Beatles', 'Daft Punk',
  'Frank Ocean', 'David Bowie', 'Pink Floyd', 'Tyler the Creator',
  'Arcade Fire', 'Portishead', 'Aphex Twin', 'Massive Attack', 'Nirvana',
  'Arctic Monkeys', 'Tame Impala', 'FKA Twigs', 'Bon Iver', 'Kanye West',
  'The Strokes', 'LCD Soundsystem', 'Boards of Canada', 'Burial', 'James Blake',
];

const RESOLUTIONS_DESKTOP = [
  { label: 'FHD',  sublabel: '1920×1080', w: 1920, h: 1080,  ratio: '16:9'  },
  { label: '2K',   sublabel: '2560×1440', w: 2560, h: 1440,  ratio: '16:9'  },
  { label: '4K',   sublabel: '3840×2160', w: 3840, h: 2160,  ratio: '16:9'  },
  { label: '21:9', sublabel: '2560×1080', w: 2560, h: 1080,  ratio: '21:9'  },
  { label: '16:10',sublabel: '2560×1600', w: 2560, h: 1600,  ratio: '16:10' },
  { label: '1:1',  sublabel: '2048×2048', w: 2048, h: 2048,  ratio: '1:1'   },
];

const RESOLUTIONS_PHONE = [
  { label: 'Android',   sublabel: '1080×1920', w: 1080, h: 1920, ratio: '9:16'  },
  { label: 'iPhone 15', sublabel: '1179×2556', w: 1179, h: 2556, ratio: '9:19'  },
  { label: 'Pro Max',   sublabel: '1290×2796', w: 1290, h: 2796, ratio: '9:19'  },
  { label: 'SE',        sublabel: '750×1334',  w:  750, h: 1334, ratio: '9:16'  },
  { label: 'iPad',      sublabel: '2048×2732', w: 2048, h: 2732, ratio: '3:4'   },
];

const SINGLE_STYLES = [
  { id: 'centered',   label: 'CENTERED'   },
  { id: 'offset',     label: 'OFFSET'     },
  { id: 'blurred-bg', label: 'BLUR BG'    },
  { id: 'tiled',      label: 'TILED'      },
  { id: 'split',      label: 'SPLIT'      },
  { id: 'minimal',    label: 'MINIMAL'    },
  { id: 'duotone',    label: 'DUOTONE'    },
  { id: 'vignette',   label: 'VIGNETTE'   },
];

const COLLAGE_STYLES = [
  { id: 'tiles',     label: 'TILES'     },
  { id: 'grid',      label: 'GRID'      },
  { id: 'mosaic',    label: 'MOSAIC'    },
  { id: 'strips',    label: 'STRIPS'    },
  { id: 'diagonal',  label: 'DIAGONAL'  },
  { id: 'scattered', label: 'SCATTERED' },
  { id: 'polaroid',  label: 'POLAROID'  },
];

const PALETTES = [
  { bg: '#0a0a0a', text: '#f0f0f0', accent: '#e8ff3c' },
  { bg: '#0d0d1a', text: '#e8e8ff', accent: '#7c5cff' },
  { bg: '#1a0a00', text: '#fff0e0', accent: '#ff6b35' },
  { bg: '#001a0a', text: '#e0fff0', accent: '#00ff88' },
  { bg: '#1a001a', text: '#ffe0ff', accent: '#ff3cff' },
  { bg: '#f0f0f0', text: '#0a0a0a', accent: '#ff3c6e' },
  { bg: '#fff8e7', text: '#1a1400', accent: '#f5a623' },
  { bg: '#0a1628', text: '#c8d8f0', accent: '#4fc3f7' },
  { bg: '#1c0a1c', text: '#f0c8f0', accent: '#e040fb' },
  { bg: '#0f1a10', text: '#d0f0d0', accent: '#40e080' },
];

const imgCache = new Map();
let _autoProceedTimer = null;

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

function init() {
  // Quick chips
  const qc = document.getElementById('quick-artists');
  QUICK_ARTISTS.forEach(a => {
    const chip = document.createElement('div');
    chip.className = 'quick-chip';
    chip.textContent = a;
    chip.onclick = () => {
      document.getElementById('artist-input').value = a;
      searchArtist(a);
    };
    qc.appendChild(chip);
  });

  // Resolution UI
  buildResUI();

  // Style chips
  buildStyleChips();

  // Default style
  selectStyle(2);

  // Dynamic search
  const input = document.getElementById('artist-input');
  let debounceTimer;
  input.addEventListener('input', e => {
    const val = e.target.value.trim();
    document.getElementById('search-clear').classList.toggle('visible', val.length > 0);
    clearTimeout(debounceTimer);
    if (val.length < 2) {
      document.getElementById('artist-results').innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => searchArtist(val), 320);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      searchArtist(input.value.trim());
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// MODE TOGGLE
// ═══════════════════════════════════════════════════════════════

function setMode(mode) {
  state.mode = mode;

  // Sync header toggle
  document.getElementById('mode-single').classList.toggle('active', mode === 'single');
  document.getElementById('mode-collage').classList.toggle('active', mode === 'collage');

  // Sync step-3 toggle
  document.getElementById('s3-mode-single')?.classList.toggle('active', mode === 'single');
  document.getElementById('s3-mode-collage')?.classList.toggle('active', mode === 'collage');

  // Album grid classes
  document.getElementById('collage-hint').style.display  = mode === 'collage' ? 'block' : 'none';
  document.getElementById('collage-counter').style.display = mode === 'collage' ? 'flex' : 'none';
  document.getElementById('btn-select-all').style.display  = mode === 'collage' ? 'flex' : 'none';
  document.getElementById('albums-grid').classList.toggle('collage-mode', mode === 'collage');

  buildStyleChips();
  updateProceedButton();

  if (mode === 'collage') {
    state.collageAlbums = [];
    document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
    updateCollageCounter();
    state.selectedAlbum = null;
    document.getElementById('btn-proceed').disabled = true;
  }
}

// Called from step-3 mode toggle — redirects back to album step if needed
function setModeStep3(mode) {
  if (mode === state.mode) return;
  if (mode === 'collage' && state.collageAlbums.length < 2) {
    setMode('collage');
    goStep(2);
    showToast('SELECT 2+ ALBUMS FOR COLLAGE');
    return;
  }
  setMode(mode);
  buildStyleChips();
  livePreview();
}

function buildStyleChips() {
  const styles = state.mode === 'collage' ? COLLAGE_STYLES : SINGLE_STYLES;
  const sr = document.getElementById('style-row');
  sr.innerHTML = '';
  styles.forEach((s, i) => {
    const chip = document.createElement('div');
    chip.className = 'style-chip';
    chip.dataset.index = i;
    chip.textContent = s.label;
    chip.onclick = () => selectStyle(i);
    sr.appendChild(chip);
  });
  selectStyle(state.mode === 'collage' ? 0 : 2);
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function goStep(n) {
  document.querySelectorAll('.section').forEach((s, i) => {
    s.classList.toggle('active', i + 1 === n);
  });
  document.querySelectorAll('.step-tab').forEach((t, i) => {
    t.classList.remove('active', 'done');
    if (i + 1 === n) t.classList.add('active');
    if (i + 1 < n)  t.classList.add('done');
  });

  // Clear preview when navigating back to step 1
  if (n === 1) clearPreview();
}

function clearPreview() {
  document.getElementById('preview-placeholder').style.display = 'flex';
  document.getElementById('preview-wrap').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
// ARTIST SEARCH
// ═══════════════════════════════════════════════════════════════

async function searchArtist(query) {
  query = (query || document.getElementById('artist-input').value).trim();
  if (!query) return;

  const container = document.getElementById('artist-results');
  container.innerHTML = buildSkeletons(8);

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=16`);
    const data = await res.json();

    if (!data.artists || data.artists.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No artists found</p></div>`;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'results-grid';

    data.artists.forEach(artist => {
      const card = document.createElement('div');
      card.className = 'artist-card';
      const picSrc = artist.picture || '';
      card.innerHTML = picSrc
        ? `<img src="${esc(picSrc)}" alt="${esc(artist.name)}" loading="lazy" />`
        : `<div class="placeholder-art">♪</div>`;
      card.innerHTML += `
        <div class="artist-card-name" title="${esc(artist.name)}">${esc(artist.name)}</div>
        <div class="artist-card-sub">${esc(artist.type || 'Artist')}</div>
      `;
      card.onclick = () => loadAlbums(artist);
      grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Connection error</p></div>`;
    console.error(e);
  }
}

function randomArtist() {
  const r = QUICK_ARTISTS[Math.floor(Math.random() * QUICK_ARTISTS.length)];
  document.getElementById('artist-input').value = r;
  document.getElementById('search-clear').classList.add('visible');
  searchArtist(r);
}

function clearSearch() {
  const input = document.getElementById('artist-input');
  input.value = '';
  document.getElementById('search-clear').classList.remove('visible');
  document.getElementById('artist-results').innerHTML = '';
  input.focus();
}

function buildSkeletons(n) {
  let html = '<div class="skeleton-grid">';
  for (let i = 0; i < n; i++) {
    html += `<div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line-sm"></div>
    </div>`;
  }
  return html + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// ALBUMS
// ═══════════════════════════════════════════════════════════════

async function loadAlbums(artist) {
  state.artist = artist;
  state.selectedAlbum = null;
  state.collageAlbums = [];
  state.usedAlbumIndices = [];
  clearTimeout(_autoProceedTimer);
  clearPreview();

  goStep(2);
  document.getElementById('artist-display-name').textContent = artist.name;
  document.getElementById('btn-proceed').disabled = true;
  updateCollageCounter();

  const grid = document.getElementById('albums-grid');
  grid.innerHTML = buildSkeletons(12);
  grid.classList.toggle('collage-mode', state.mode === 'collage');

  try {
    const res = await fetch(`/api/artist/${artist.id}/albums`);
    const data = await res.json();

    if (!data.albums || data.albums.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">💿</div><p>No albums found</p></div>`;
      return;
    }

    function coverFingerprint(url) {
      if (!url) return null;
      const m = url.match(/\/cover\/([a-f0-9]+)\//);
      return m ? m[1] : url;
    }

    const seenCovers = new Set();
    const deduped = data.albums.filter(album => {
      const fp = coverFingerprint(album.cover);
      if (!fp || seenCovers.has(fp)) return false;
      seenCovers.add(fp);
      return true;
    });

    state.albums = deduped;
    grid.innerHTML = '';
    deduped.forEach((album, idx) => grid.appendChild(createAlbumCard(album, idx)));
    loadCoversLazy(deduped);

  } catch(e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><p>Error loading albums</p></div>`;
    console.error(e);
  }
}

function createAlbumCard(album, idx) {
  const card = document.createElement('div');
  card.className = 'album-card';
  card.id = `album-card-${idx}`;
  card.innerHTML = `
    <img src="${album.cover}" alt="${album.title}" />
    <div class="check-badge">✓</div>
    <div class="collage-num" id="cnum-${idx}"></div>
    <div class="album-card-info">
      <div class="album-card-title" title="${esc(album.title)}">${esc(album.title)}</div>
      <div class="album-card-year">${album.year || '—'}</div>
    </div>
  `;
  card.onclick = () => {
    if (state.mode === 'collage') toggleCollageAlbum(idx);
    else selectSingleAlbum(idx);
  };
  return card;
}

// ── Cover lazy loading ───────────────────────────────────────

async function loadCoversLazy(albums) {
  const BATCH = 6;
  for (let i = 0; i < albums.length; i += BATCH) {
    const batch = albums.slice(i, i + BATCH);
    await Promise.allSettled(batch.map((album, bi) => loadCover(album, i + bi)));
    await sleep(80);
  }
}

async function loadCover(album, idx) {
  if (!album.cover) return;
  try {
    const coverUrl = album.cover.replace('/250x250-', '/500x500-');
    const img = await loadImage(coverUrl);
    album._coverUrl = coverUrl;
    album._img = img;
    imgCache.set(album.id, img);
    const card = document.getElementById(`album-card-${idx}`);
    if (card) {
      const imgEl = card.querySelector('img');
      if (imgEl) imgEl.src = coverUrl;
    }
  } catch(e) { /* silent */ }
}

// ── Single album selection with auto-proceed ─────────────────

function selectSingleAlbum(idx) {
  clearTimeout(_autoProceedTimer);
  document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`album-card-${idx}`)?.classList.add('selected');
  state.selectedAlbum = state.albums[idx];
  document.getElementById('btn-proceed').disabled = false;

  // Auto-proceed after short delay — cancel if another album tapped
  _autoProceedTimer = setTimeout(() => proceed(), 500);
}

// ── Collage album toggle ──────────────────────────────────────

function toggleCollageAlbum(idx) {
  const album = state.albums[idx];
  const existingPos = state.collageAlbums.findIndex(a => a.idx === idx);

  if (existingPos >= 0) {
    state.collageAlbums.splice(existingPos, 1);
    document.getElementById(`album-card-${idx}`)?.classList.remove('selected');
  } else {
    state.collageAlbums.push({ idx, album });
    document.getElementById(`album-card-${idx}`)?.classList.add('selected');
  }

  state.collageAlbums.forEach((item, pos) => {
    const num = document.getElementById(`cnum-${item.idx}`);
    if (num) num.textContent = pos + 1;
  });
  document.querySelectorAll('.collage-num').forEach(el => {
    const idx2 = parseInt(el.id.replace('cnum-',''));
    if (!state.collageAlbums.find(a => a.idx === idx2)) el.textContent = '';
  });

  updateCollageCounter();
  updateProceedButton();
}

function updateCollageCounter() {
  const countEl = document.getElementById('collage-count');
  if (countEl) countEl.textContent = state.collageAlbums.length;
}

function toggleSelectAll() {
  if (state.mode !== 'collage') return;
  const maxN = state.albums.length;

  if (state.collageAlbums.length === maxN) {
    state.collageAlbums = [];
    document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.collage-num').forEach(el => el.textContent = '');
    document.getElementById('btn-select-all').textContent = 'SELECT ALL';
  } else {
    state.collageAlbums = [];
    document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
    for (let i = 0; i < maxN; i++) {
      state.collageAlbums.push({ idx: i, album: state.albums[i] });
      document.getElementById(`album-card-${i}`)?.classList.add('selected');
      const num = document.getElementById(`cnum-${i}`);
      if (num) num.textContent = i + 1;
    }
    document.getElementById('btn-select-all').textContent = 'DESELECT ALL';
  }

  updateCollageCounter();
  updateProceedButton();
}

function updateProceedButton() {
  const btn = document.getElementById('btn-proceed');
  if (state.mode === 'single') {
    btn.disabled = !state.selectedAlbum;
    btn.textContent = 'NEXT →';
  } else {
    btn.disabled = state.collageAlbums.length < 2;
    btn.textContent = state.collageAlbums.length < 2
      ? 'SELECT 2+ →'
      : `COLLAGE (${state.collageAlbums.length}) →`;
  }
}

function proceed() {
  if (state.mode === 'single' && !state.selectedAlbum) return;
  if (state.mode === 'collage' && state.collageAlbums.length < 2) return;
  goStep(3);
  // Auto-generate on arrival
  setTimeout(() => generateWallpaper(false), 80);
}

// ── Shuffle / Random ─────────────────────────────────────────

function shuffleAlbum() {
  if (state.albums.length === 0) return;

  if (state.mode === 'collage') {
    // Pick a random set of 4–6 albums
    const count = Math.min(state.albums.length, 4 + Math.floor(Math.random() * 3));
    const shuffled = [...state.albums.map((_, i) => i)].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, count);

    state.collageAlbums = [];
    document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.collage-num').forEach(el => el.textContent = '');

    picks.forEach((idx, pos) => {
      state.collageAlbums.push({ idx, album: state.albums[idx] });
      document.getElementById(`album-card-${idx}`)?.classList.add('selected');
      const num = document.getElementById(`cnum-${idx}`);
      if (num) num.textContent = pos + 1;
    });

    updateCollageCounter();
    updateProceedButton();
    showToast(`RANDOM COLLAGE — ${count} ALBUMS`);
    return;
  }

  // Single mode
  if (state.usedAlbumIndices.length >= state.albums.length) {
    state.usedAlbumIndices = [];
    showToast('RESHUFFLED — STARTING OVER');
  }
  const unused = state.albums.map((_, i) => i).filter(i => !state.usedAlbumIndices.includes(i));
  const pick = unused[Math.floor(Math.random() * unused.length)];
  state.usedAlbumIndices.push(pick);
  clearTimeout(_autoProceedTimer);
  document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`album-card-${pick}`)?.classList.add('selected');
  state.selectedAlbum = state.albums[pick];
  document.getElementById('btn-proceed').disabled = false;
  document.getElementById(`album-card-${pick}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast(`PICKED: ${state.albums[pick].title}`);
}

// ═══════════════════════════════════════════════════════════════
// RESOLUTION UI
// ═══════════════════════════════════════════════════════════════

function buildResUI() {
  switchResTab('desktop');
}

function switchResTab(tab) {
  state.resTab = tab;

  document.querySelectorAll('.res-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`rtab-${tab}`)?.classList.add('active');

  const presetsWrap = document.getElementById('res-presets');
  const customWrap  = document.getElementById('res-custom');

  if (tab === 'custom') {
    presetsWrap.style.display = 'none';
    customWrap.style.display  = 'flex';
    return;
  }

  presetsWrap.style.display = 'flex';
  customWrap.style.display  = 'none';

  const list = tab === 'desktop' ? RESOLUTIONS_DESKTOP : RESOLUTIONS_PHONE;
  presetsWrap.innerHTML = '';

  list.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className = 'res-preset-btn';
    btn.innerHTML = `${r.label}<span class="res-sub">${r.sublabel}</span>`;

    const isSelected = state.resolution
      ? (state.resolution.w === r.w && state.resolution.h === r.h)
      : i === 0;

    if (isSelected) btn.classList.add('selected');

    btn.onclick = () => selectResPreset(r, btn);
    presetsWrap.appendChild(btn);
  });

  // Auto-select first if none selected for this tab
  if (!state.resolution) {
    selectResPreset(list[0], presetsWrap.querySelector('.res-preset-btn'));
  } else {
    updateResDisplay();
  }
}

function selectResPreset(res, btn) {
  state.resolution = res;
  document.querySelectorAll('.res-preset-btn').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
  updateResDisplay();
  livePreview();
}

function updateResDisplay() {
  const el = document.getElementById('res-current');
  if (el && state.resolution) {
    el.textContent = `${state.resolution.w} × ${state.resolution.h}`;
  }
}

function applyCustomRes() {
  const w = parseInt(document.getElementById('custom-w').value) || 1920;
  const h = parseInt(document.getElementById('custom-h').value) || 1080;
  const cw = Math.max(400, Math.min(7680, w));
  const ch = Math.max(400, Math.min(7680, h));
  state.resolution = { label: 'CUSTOM', sublabel: `${cw}×${ch}`, w: cw, h: ch, ratio: 'custom' };
  updateResDisplay();
  showToast(`CUSTOM: ${cw}×${ch}`);
  livePreview();
}

// ═══════════════════════════════════════════════════════════════
// STYLE SELECTION
// ═══════════════════════════════════════════════════════════════

function selectStyle(i) {
  document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.style-chip[data-index="${i}"]`)?.classList.add('selected');
  const styles = state.mode === 'collage' ? COLLAGE_STYLES : SINGLE_STYLES;
  state.style = styles[i];
  livePreview();
}

// ═══════════════════════════════════════════════════════════════
// COLOR PICKERS
// ═══════════════════════════════════════════════════════════════

function updateSwatch(type) {
  const val = document.getElementById(`color-${type}`).value;
  document.getElementById(`swatch-${type}`).style.background = val;
  livePreview();
}

function randomColors() {
  const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  ['bg', 'text', 'accent'].forEach(k => {
    document.getElementById(`color-${k}`).value = p[k];
    document.getElementById(`swatch-${k}`).style.background = p[k];
  });
  showToast('NEW PALETTE');
  livePreview();
}

// ─── LIVE PREVIEW ─────────────────────────────────────────────
let _liveDebounce;
function livePreview() {
  if (!document.getElementById('step-3').classList.contains('active')) return;
  if (document.getElementById('preview-wrap').style.display === 'none') return;
  clearTimeout(_liveDebounce);
  _liveDebounce = setTimeout(() => generateWallpaper(true), 200);
}

// ═══════════════════════════════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════════════════════════════

async function generateWallpaper(silent = false) {
  // Ensure we have a resolution
  if (!state.resolution) {
    selectResPreset(RESOLUTIONS_DESKTOP[0], null);
  }

  const res    = state.resolution;
  const style  = state.style;
  const bg     = document.getElementById('color-bg').value;
  const fg     = document.getElementById('color-text').value;
  const accent = document.getElementById('color-accent').value;

  if (!silent) showLoading('GENERATING…');

  try {
    const canvas = document.getElementById('preview-canvas');
    const ctx    = canvas.getContext('2d');

    const maxW  = Math.min(res.w, 1080);
    const scale = maxW / res.w;
    canvas.width  = Math.round(res.w * scale);
    canvas.height = Math.round(res.h * scale);

    if (state.mode === 'single') {
      if (!state.selectedAlbum) {
        if (!silent) hideLoading();
        return;
      }
      const img = await getImg(state.selectedAlbum);
      drawWallpaper(ctx, canvas.width, canvas.height, img, style.id, bg, fg, accent,
                    state.selectedAlbum, state.artist);
    } else {
      if (state.collageAlbums.length < 2) {
        if (!silent) hideLoading();
        return;
      }
      const entries = await Promise.all(
        state.collageAlbums.map(async item => ({
          album: item.album,
          img:   await getImg(item.album),
        }))
      );
      drawCollage(ctx, canvas.width, canvas.height, entries, style.id, bg, fg, accent, state.artist);
    }

    const dimLabel = state.mode === 'single'
      ? `${res.w}×${res.h}  ${style.label}`
      : `${res.w}×${res.h}  COLLAGE ${style.label}  ${state.collageAlbums.length} ALBUMS`;

    document.getElementById('preview-dim-label').textContent = dimLabel;
    document.getElementById('preview-placeholder').style.display = 'none';
    document.getElementById('preview-wrap').style.display = 'block';

  } catch(e) {
    console.error(e);
    if (!silent) showToast('ERROR GENERATING');
  } finally {
    if (!silent) hideLoading();
  }
}

async function downloadWallpaper() {
  if (!state.resolution) return;
  const res    = state.resolution;
  const style  = state.style;
  const bg     = document.getElementById('color-bg').value;
  const fg     = document.getElementById('color-text').value;
  const accent = document.getElementById('color-accent').value;

  showLoading('RENDERING HIGH-RES…');

  try {
    const off    = document.createElement('canvas');
    off.width    = res.w;
    off.height   = res.h;
    const offCtx = off.getContext('2d');

    if (state.mode === 'single') {
      const img = await getImg(state.selectedAlbum);
      drawWallpaper(offCtx, res.w, res.h, img, style.id, bg, fg, accent,
                    state.selectedAlbum, state.artist);
    } else {
      const entries = await Promise.all(
        state.collageAlbums.map(async item => ({
          album: item.album,
          img:   await getImg(item.album),
        }))
      );
      drawCollage(offCtx, res.w, res.h, entries, style.id, bg, fg, accent, state.artist);
    }

    hideLoading();

    const suffix = state.mode === 'collage'
      ? `collage_${state.collageAlbums.length}`
      : `${state.selectedAlbum.title}`;

    const a  = document.createElement('a');
    a.download = `wallmaker_${state.artist.name}_${suffix}_${res.w}x${res.h}.png`
                   .replace(/[^a-z0-9_\-.]/gi, '_');
    a.href = off.toDataURL('image/png');
    a.click();
    showToast('DOWNLOADED!');
  } catch(e) {
    hideLoading();
    console.error(e);
    showToast('ERROR DOWNLOADING');
  }
}

async function getImg(album) {
  if (!album) return null;
  if (album._img) return album._img;
  if (imgCache.has(album.id)) return imgCache.get(album.id);
  const coverUrl = (album._coverUrl || album.cover || '').replace('/250x250-', '/500x500-');
  if (!coverUrl) return null;
  try {
    const img = await loadImage(coverUrl);
    album._coverUrl = coverUrl;
    album._img = img;
    imgCache.set(album.id, img);
    return img;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// DRAW — SINGLE STYLES
// ═══════════════════════════════════════════════════════════════

function drawWallpaper(ctx, W, H, img, styleId, bg, fg, accent, album, artist) {
  ctx.clearRect(0, 0, W, H);
  switch(styleId) {
    case 'centered':   drawCentered(ctx, W, H, img, bg, fg, accent, album, artist);  break;
    case 'offset':     drawOffset(ctx, W, H, img, bg, fg, accent, album, artist);    break;
    case 'blurred-bg': drawBlurredBg(ctx, W, H, img, bg, fg, accent, album, artist); break;
    case 'tiled':      drawTiled(ctx, W, H, img, bg, fg, accent, album, artist);     break;
    case 'split':      drawSplit(ctx, W, H, img, bg, fg, accent, album, artist);     break;
    case 'minimal':    drawMinimal(ctx, W, H, img, bg, fg, accent, album, artist);   break;
    case 'duotone':    drawDuotone(ctx, W, H, img, bg, fg, accent, album, artist);   break;
    case 'vignette':   drawVignette(ctx, W, H, img, bg, fg, accent, album, artist);  break;
    default:           drawCentered(ctx, W, H, img, bg, fg, accent, album, artist);
  }
}

// ── CENTERED ──
function drawCentered(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = hexAlpha(fg, 0.03);
  ctx.lineWidth = 1;
  for(let x = 0; x < W; x += W/24) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y = 0; y < H; y += H/14) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  const size = Math.min(W, H) * 0.47;
  const cx = W/2, cy = H/2 - H*0.04;
  if (img) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur  = size * 0.15;
    ctx.shadowOffsetY = size * 0.05;
    ctx.drawImage(img, cx - size/2, cy - size/2, size, size);
    ctx.restore();
  } else {
    drawPlaceholder(ctx, cx-size/2, cy-size/2, size, size, accent);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(cx - size/2, cy + size/2 + 14, size, 3);

  const ts = clamp(W * 0.034, 18, 52);
  const ss = clamp(W * 0.016, 10, 22);
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(album.title.toUpperCase(), cx, cy + size/2 + 40 + ts);
  ctx.fillStyle = hexAlpha(fg, 0.45);
  ctx.font = `500 ${ss}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), cx, cy + size/2 + 40 + ts + ss + 8);
  const year = (album.year || album['first-release-date'] || '').slice(0,4);
  if (year) {
    ctx.fillStyle = hexAlpha(accent, 0.7);
    ctx.font = `700 ${ss}px 'Montserrat', sans-serif`;
    ctx.fillText(year, cx, cy + size/2 + 40 + ts + ss*2 + 18);
  }
}

// ── OFFSET ──
function drawOffset(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = hexAlpha(accent, 0.07);
  ctx.fillRect(W*0.56, 0, W*0.44, H);

  const size = Math.min(W,H) * 0.52;
  const x = W*0.07, y = (H-size)/2;
  if (img) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size*0.1; ctx.shadowOffsetX = 20;
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  } else { drawPlaceholder(ctx, x, y, size, size, accent); }

  const tx = W*0.64;
  const ts = clamp(W*0.052, 20, 72);
  const ss = clamp(W*0.018, 10, 26);
  ctx.save();
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, album.title.toUpperCase(), W*0.29);
  const startY = H/2 - (lines.length*ts*1.05)/2;
  lines.forEach((l,i) => ctx.fillText(l, tx, startY + i*ts*1.05));
  ctx.fillStyle = hexAlpha(fg, 0.4);
  ctx.font = `500 ${ss}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), tx, startY + lines.length*ts*1.05 + ss + 12);
  ctx.fillStyle = accent;
  ctx.fillRect(tx, startY - 22, Math.min(100, W*0.08), 4);
  ctx.restore();

  const year = (album.year || '').slice(0,4);
  ctx.fillStyle = hexAlpha(fg, 0.2);
  ctx.font = `600 ${clamp(W*0.013,9,17)}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(year, W-24, H-24);
}

// ── BLURRED BG ──
function drawBlurredBg(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.save();
    ctx.globalAlpha = 0.33;
    const sc = Math.max(W/img.width, H/img.height)*1.1;
    ctx.drawImage(img, (W-img.width*sc)/2, (H-img.height*sc)/2, img.width*sc, img.height*sc);
    ctx.restore();
    ctx.fillStyle = hexAlpha(bg, 0.52);
    ctx.fillRect(0, 0, W, H);
  }
  const size = Math.min(W,H)*0.44;
  const cx = W/2, cy = H/2 - H*0.05;
  if (img) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = size*0.2;
    ctx.drawImage(img, cx-size/2, cy-size/2, size, size);
    ctx.restore();
  } else { drawPlaceholder(ctx, cx-size/2, cy-size/2, size, size, accent); }

  const ts = clamp(W*0.031, 16, 44);
  const ss = clamp(W*0.015, 9, 20);
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(album.title.toUpperCase(), cx, cy+size/2+ts+20);
  ctx.fillStyle = hexAlpha(fg, 0.5);
  ctx.font = `500 ${ss}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), cx, cy+size/2+ts+ss+30);
}

// ── TILED ──
function drawTiled(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (img) {
    const cols = 4, tileW = W/cols;
    for(let r=0; r<Math.ceil(H/tileW)+1; r++) {
      for(let c=0; c<cols; c++) {
        ctx.save();
        ctx.globalAlpha = (r+c)%2===0 ? 0.22 : 0.1;
        ctx.drawImage(img, c*tileW, r*tileW, tileW, tileW);
        ctx.restore();
      }
    }
  }
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.6);
  grad.addColorStop(0, hexAlpha(bg, 0.1));
  grad.addColorStop(1, hexAlpha(bg, 0.82));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const size = Math.min(W,H)*0.38;
  const cx = W/2, cy = H/2 - H*0.05;
  if (img) {
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.8)';
    ctx.shadowBlur=size*0.15;
    ctx.drawImage(img, cx-size/2, cy-size/2, size, size);
    ctx.restore();
  } else { drawPlaceholder(ctx, cx-size/2, cy-size/2, size, size, accent); }

  const ts = clamp(W*0.034, 16, 46);
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(album.title.toUpperCase(), cx, cy+size/2+ts+20);
  ctx.fillStyle = hexAlpha(accent, 0.9);
  ctx.font = `600 ${clamp(W*0.016,9,20)}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), cx, cy+size/2+ts+40);
}

// ── SPLIT ──
function drawSplit(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W/2, H);
  if (img) {
    ctx.drawImage(img, W/2, 0, W/2, H);
    ctx.fillStyle = hexAlpha(bg, 0.42);
    ctx.fillRect(W/2, 0, W/2, H);
  } else {
    ctx.fillStyle = hexAlpha(accent, 0.12);
    ctx.fillRect(W/2, 0, W/2, H);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(W/2 - 2, 0, 4, H);

  const ts = clamp(W*0.053, 20, 72);
  ctx.save();
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'right';
  const lines = wrapText(ctx, album.title.toUpperCase(), W*0.38);
  const startY = H/2 - (lines.length*ts*1.05)/2;
  lines.forEach((l,i) => ctx.fillText(l, W/2-32, startY + i*ts*1.05));
  ctx.fillStyle = hexAlpha(fg, 0.4);
  ctx.font = `500 ${clamp(W*0.018,9,22)}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), W/2-32, startY+lines.length*ts*1.05+18+16);
  ctx.restore();

  if (img) {
    const size = Math.min(W*0.33, H*0.52);
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.5)';
    ctx.shadowBlur=28;
    ctx.drawImage(img, W*0.75-size/2, H/2-size/2, size, size);
    ctx.restore();
  }
  const year = (album.year || '').slice(0,4);
  ctx.fillStyle = hexAlpha(fg, 0.2);
  ctx.font = `600 ${clamp(W*0.013,8,16)}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(year, W-22, H-22);
}

// ── MINIMAL ──
function drawMinimal(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 3);

  const size = Math.min(W,H)*0.28;
  const mg = W*0.08, coverY = H*0.18;
  if (img) ctx.drawImage(img, mg, coverY, size, size);
  else drawPlaceholder(ctx, mg, coverY, size, size, accent);

  const ts = clamp(W*0.068, 28, 96);
  ctx.save();
  ctx.fillStyle = fg;
  ctx.globalAlpha = 0.92;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, album.title.toUpperCase(), W*0.82);
  lines.forEach((l,i) => ctx.fillText(l, mg, H*0.55 + i*ts*0.93));
  ctx.restore();

  const ss = clamp(W*0.02, 10, 26);
  ctx.fillStyle = hexAlpha(fg, 0.38);
  ctx.font = `400 ${ss}px 'Montserrat', sans-serif`;
  ctx.fillText(`${artist.name.toUpperCase()}  ·  ${(album.year||'').slice(0,4)}`,
    mg, H*0.55 + lines.length*ts*0.93 + ss + 12);

  ctx.fillStyle = hexAlpha(accent, 0.35);
  ctx.fillRect(mg, H-36, W-mg*2, 1);
}

// ── DUOTONE ──
function drawDuotone(ctx, W, H, img, bg, fg, accent, album, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (img) {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const oc = off.getContext('2d');
    const sc = Math.max(W/img.width, H/img.height);
    oc.drawImage(img, (W-img.width*sc)/2, (H-img.height*sc)/2, img.width*sc, img.height*sc);
    const id = oc.getImageData(0,0,W,H);
    const d = id.data;
    const c1 = hexToRgb(bg), c2 = hexToRgb(accent);
    for(let i=0;i<d.length;i+=4) {
      const g = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114)/255;
      d[i]   = Math.round(c1.r + (c2.r-c1.r)*g);
      d[i+1] = Math.round(c1.g + (c2.g-c1.g)*g);
      d[i+2] = Math.round(c1.b + (c2.b-c1.b)*g);
    }
    oc.putImageData(id, 0, 0);
    ctx.drawImage(off, 0, 0);
  }
  const size = Math.min(W,H)*0.38;
  const cx=W/2, cy=H/2-H*0.06;
  if (img) {
    ctx.save();
    ctx.globalAlpha=0.85;
    ctx.shadowColor='rgba(0,0,0,0.5)';
    ctx.shadowBlur=40;
    ctx.drawImage(img, cx-size/2, cy-size/2, size, size);
    ctx.restore();
  }
  const ts = clamp(W*0.031, 16, 42);
  const ss = clamp(W*0.015, 9, 20);
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(album.title.toUpperCase(), cx, cy+size/2+ts+20);
  ctx.fillStyle = hexAlpha(fg, 0.55);
  ctx.font = `500 ${ss}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), cx, cy+size/2+ts+ss+30);
}

// ── VIGNETTE ──
function drawVignette(ctx, W, H, img, bg, fg, accent, album, artist) {
  if (img) {
    const sc = Math.max(W/img.width, H/img.height);
    ctx.drawImage(img, (W-img.width*sc)/2, (H-img.height*sc)/2, img.width*sc, img.height*sc);
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);
  }
  const grad = ctx.createRadialGradient(W/2, H/2, H*0.14, W/2, H/2, H*0.82);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
  const btm = ctx.createLinearGradient(0, H*0.55, 0, H);
  btm.addColorStop(0, 'rgba(0,0,0,0)');
  btm.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = btm; ctx.fillRect(0,0,W,H);

  const ts = clamp(W*0.046, 20, 62);
  const ss = clamp(W*0.018, 10, 22);
  ctx.fillStyle = fg;
  ctx.font = `900 ${ts}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(album.title.toUpperCase(), W/2, H-H*0.12);
  ctx.fillStyle = hexAlpha(fg, 0.55);
  ctx.font = `500 ${ss}px 'Montserrat', sans-serif`;
  ctx.fillText(artist.name.toUpperCase(), W/2, H-H*0.12+ss+14);
  const tw = ctx.measureText(album.title.toUpperCase()).width;
  ctx.fillStyle = accent;
  ctx.fillRect(W/2 - Math.min(tw/2, W*0.3), H-H*0.12-ts-6, Math.min(tw, W*0.6), 3);
}

// ── PLACEHOLDER ──
function drawPlaceholder(ctx, x, y, w, h, accent) {
  const g = ctx.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,'#141428'); g.addColorStop(1,'#1a1a3a');
  ctx.fillStyle = g; ctx.fillRect(x,y,w,h);
  ctx.fillStyle = hexAlpha(accent, 0.14); ctx.fillRect(x,y,w,h);
  ctx.fillStyle = hexAlpha(accent, 0.6);
  ctx.font = `${Math.min(w*0.28,72)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('♪', x+w/2, y+h/2 + Math.min(w*0.09,24));
}

// ═══════════════════════════════════════════════════════════════
// DRAW — COLLAGE STYLES
// ═══════════════════════════════════════════════════════════════

function drawCollage(ctx, W, H, entries, styleId, bg, fg, accent, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  switch(styleId) {
    case 'tiles':     drawCollageTiles(ctx, W, H, entries, bg, fg, accent, artist);    break;
    case 'grid':      drawCollageGrid(ctx, W, H, entries, bg, fg, accent, artist);     break;
    case 'mosaic':    drawCollageMosaic(ctx, W, H, entries, bg, fg, accent, artist);   break;
    case 'strips':    drawCollageStrips(ctx, W, H, entries, bg, fg, accent, artist);   break;
    case 'diagonal':  drawCollageDiagonal(ctx, W, H, entries, bg, fg, accent, artist); break;
    case 'scattered': drawCollageScattered(ctx, W, H, entries, bg, fg, accent, artist);break;
    case 'polaroid':  drawCollagePolaroid(ctx, W, H, entries, bg, fg, accent, artist); break;
    default:          drawCollageTiles(ctx, W, H, entries, bg, fg, accent, artist);
  }
}

// ── COLLAGE: TILES ──
function drawCollageTiles(ctx, W, H, entries, bg, fg, accent, artist) {
  const n = entries.length;
  if (n === 0) return;
  if (n === 1) { _drawTileCell(ctx, entries[0], 0, 0, W, H); return; }

  const ratioLabel = state.resolution?.ratio || '16:9';
  const [baseC, baseR] = ratioLabel.split(':').map(Number);

  let mult = 1;
  while (baseC * mult * baseR * mult < Math.max(64, n * 3)) mult++;

  const cols = baseC * mult;
  const rows = baseR * mult;
  const cellW = W / cols;

  const filled = Array(rows).fill(0).map(() => Array(cols).fill(false));
  const blocks = [];
  let emptyCells = cols * rows;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (filled[y][x]) continue;
      let maxS = 1;
      const limit = Math.min(cols - x, rows - y);
      while (maxS < limit) {
        let canExpand = true;
        const checkS = maxS + 1;
        for (let i = 0; i < checkS; i++) {
          if (filled[y + checkS - 1][x + i] || filled[y + i][x + checkS - 1]) {
            canExpand = false; break;
          }
        }
        if (!canExpand) break;
        maxS++;
      }
      let needed = Math.max(0, n - blocks.length);
      while (maxS > 1) {
        if (emptyCells - (maxS * maxS) >= needed - 1) break;
        maxS--;
      }
      let S = maxS;
      if (maxS > 1) {
        const roll = Math.random();
        if (roll < 0.35) S = maxS;
        else if (roll < 0.75) S = Math.max(1, Math.floor(maxS / 2));
        else S = 1;
      }
      S = Math.max(1, Math.min(S, maxS));
      for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) filled[y+dy][x+dx] = true;
      blocks.push({ x, y, s: S });
      emptyCells -= S * S;
    }
  }

  blocks.sort((a, b) => b.s - a.s);
  blocks.forEach((block, i) => {
    const entry = entries[i % n];
    const px = Math.floor(block.x * cellW);
    const py = Math.floor(block.y * cellW);
    const size = Math.ceil(block.s * cellW) + 1;
    _drawTileCell(ctx, entry, px, py, size, size);
  });

  const fs = clamp(W * 0.011, 9, 15);
  ctx.font = `700 ${fs}px 'Montserrat', sans-serif`;
  const label = artist.name.toUpperCase();
  const tw = ctx.measureText(label).width;
  const pad = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(W - tw - pad * 2, H - fs * 2.4, tw + pad * 2, fs * 2.4);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textAlign = 'right';
  ctx.fillText(label, W - pad, H - fs * 0.45);
}

function _drawTileCell(ctx, entry, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (entry && entry.img) {
    const sc = Math.max(w / entry.img.width, h / entry.img.height);
    const dw = entry.img.width  * sc;
    const dh = entry.img.height * sc;
    ctx.drawImage(entry.img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#0e0e1a');
    g.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(232,255,60,0.25)';
    ctx.font = `${Math.min(w, h) * 0.3}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('♪', x + w / 2, y + h / 2 + Math.min(w, h) * 0.08);
  }
  ctx.restore();
}

// ── COLLAGE: GRID ──
function drawCollageGrid(ctx, W, H, entries, bg, fg, accent, artist) {
  const n = entries.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const gap = 4;
  const cellW = (W - gap * (cols - 1)) / cols;
  const cellH = (H - gap * (rows - 1)) / rows;

  entries.forEach((e, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (cellW + gap);
    const y = row * (cellH + gap);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cellW, cellH);
    ctx.clip();
    if (e.img) {
      const sc = Math.max(cellW / e.img.width, cellH / e.img.height);
      ctx.drawImage(e.img, x + (cellW - e.img.width*sc)/2, y + (cellH - e.img.height*sc)/2, e.img.width*sc, e.img.height*sc);
    } else drawPlaceholder(ctx, x, y, cellW, cellH, accent);
    ctx.restore();
  });

  ctx.fillStyle = hexAlpha(fg, 0.15);
  ctx.font = `700 ${clamp(W*0.012,9,16)}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(artist.name.toUpperCase(), W - 14, H - 12);
}

// ── COLLAGE: MOSAIC ──
function drawCollageMosaic(ctx, W, H, entries, bg, fg, accent, artist) {
  const n = entries.length;
  if (n < 2) { if (entries[0]) _drawTileCell(ctx, entries[0], 0, 0, W, H); return; }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const gap = 3;

  if (n === 2) {
    [entries[0], entries[1]].forEach((e, i) => {
      const x = i * (W/2 + gap/2), w = W/2 - gap/2;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, w, H); ctx.clip();
      if (e.img) { const sc = Math.max(w/e.img.width, H/e.img.height); ctx.drawImage(e.img, x+(w-e.img.width*sc)/2, (H-e.img.height*sc)/2, e.img.width*sc, e.img.height*sc); }
      else drawPlaceholder(ctx, x, 0, w, H, accent);
      ctx.restore();
    });
  } else {
    const mainW = W * 0.55, sideW = W - mainW - gap;
    const sideH = (H - gap * (n - 2)) / (n - 1);
    [entries[0]].forEach(e => {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, mainW, H); ctx.clip();
      if (e.img) { const sc = Math.max(mainW/e.img.width, H/e.img.height); ctx.drawImage(e.img, (mainW-e.img.width*sc)/2, (H-e.img.height*sc)/2, e.img.width*sc, e.img.height*sc); }
      else drawPlaceholder(ctx, 0, 0, mainW, H, accent);
      ctx.restore();
    });
    entries.slice(1).forEach((e, i) => {
      const x = mainW + gap, y = i * (sideH + gap);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, sideW, sideH); ctx.clip();
      if (e.img) { const sc = Math.max(sideW/e.img.width, sideH/e.img.height); ctx.drawImage(e.img, x+(sideW-e.img.width*sc)/2, y+(sideH-e.img.height*sc)/2, e.img.width*sc, e.img.height*sc); }
      else drawPlaceholder(ctx, x, y, sideW, sideH, accent);
      ctx.restore();
    });
  }

  ctx.fillStyle = hexAlpha(bg, 0.5);
  ctx.fillRect(0, H - 32, W, 32);
  ctx.fillStyle = hexAlpha(fg, 0.5);
  ctx.font = `700 ${clamp(W*0.013,9,17)}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(artist.name.toUpperCase(), W/2, H - 10);
}

// ── COLLAGE: STRIPS ──
function drawCollageStrips(ctx, W, H, entries, bg, fg, accent, artist) {
  const n = entries.length;
  const stripW = W / n;
  entries.forEach((e, i) => {
    const x = i * stripW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, stripW, H);
    ctx.clip();
    if (e.img) {
      const sc = Math.max(stripW / e.img.width, H / e.img.height) * 1.05;
      ctx.drawImage(e.img, x + (stripW - e.img.width*sc)/2, (H - e.img.height*sc)/2, e.img.width*sc, e.img.height*sc);
    } else drawPlaceholder(ctx, x, 0, stripW, H, accent);
    ctx.restore();
    if (i < n-1) {
      ctx.strokeStyle = hexAlpha(bg, 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + stripW, 0); ctx.lineTo(x + stripW, H); ctx.stroke();
    }
  });

  ctx.fillStyle = hexAlpha(bg, 0.45);
  ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = hexAlpha(fg, 0.55);
  ctx.font = `700 ${clamp(W*0.013,9,17)}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(artist.name.toUpperCase(), W/2, H - 12);
}

// ── COLLAGE: DIAGONAL ──
function drawCollageDiagonal(ctx, W, H, entries, bg, fg, accent, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const n = entries.length;
  const bandW = W / (n * 0.7);
  const gap = 4;

  entries.forEach((e, i) => {
    const cx = (W / n) * (i + 0.5);
    ctx.save();
    ctx.beginPath();
    const skew = H * 0.3;
    const hw   = bandW * 0.5;
    ctx.moveTo(cx - hw + skew/2, 0);
    ctx.lineTo(cx + hw + skew/2, 0);
    ctx.lineTo(cx + hw - skew/2, H);
    ctx.lineTo(cx - hw - skew/2, H);
    ctx.closePath();
    ctx.clip();

    if (e.img) {
      const sc = Math.max(bandW / e.img.width, H / e.img.height) * 1.1;
      ctx.drawImage(e.img, cx - e.img.width*sc/2, (H - e.img.height*sc)/2, e.img.width*sc, e.img.height*sc);
    } else drawPlaceholder(ctx, cx - bandW/2 - skew/2, 0, bandW + skew, H, accent);

    ctx.restore();
    if (i < n-1) {
      ctx.save();
      ctx.strokeStyle = hexAlpha(accent, 0.5);
      ctx.lineWidth = gap;
      ctx.beginPath();
      const nx = (W/n) * (i+1);
      ctx.moveTo(nx + skew/2, 0);
      ctx.lineTo(nx - skew/2, H);
      ctx.stroke();
      ctx.restore();
    }
  });

  ctx.fillStyle = hexAlpha(bg, 0.45);
  ctx.fillRect(0, H - clamp(H*0.07, 28, 54), W, clamp(H*0.07, 28, 54));
  const fs = clamp(W*0.016, 10, 20);
  ctx.fillStyle = hexAlpha(fg, 0.6);
  ctx.font = `700 ${fs}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(artist.name.toUpperCase(), W/2, H - clamp(H*0.015,6,14));
}

// ── COLLAGE: SCATTERED ──
function drawCollageScattered(ctx, W, H, entries, bg, fg, accent, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  const n = entries.length;
  const size = Math.min(W, H) * (n <= 4 ? 0.35 : 0.28);
  const cx = W/2, cy = H/2;

  entries.forEach((e, i) => {
    const angle  = (i / n) * Math.PI * 2 - Math.PI/2;
    const radius = n === 1 ? 0 : Math.min(W,H) * (n <= 3 ? 0.18 : 0.24);
    const ex = cx + Math.cos(angle) * radius;
    const ey = cy + Math.sin(angle) * radius;
    const rot = ((i % 2 === 0) ? 1 : -1) * (3 + Math.sin(i*1.5) * 4) * Math.PI/180;

    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 20;
    ctx.shadowOffsetY = 6;

    const s2 = size * (i === 0 ? 1 : 0.88);
    if (e.img) ctx.drawImage(e.img, -s2/2, -s2/2, s2, s2);
    else drawPlaceholder(ctx, -s2/2, -s2/2, s2, s2, accent);
    ctx.strokeStyle = hexAlpha(fg, 0.08);
    ctx.lineWidth = 2;
    ctx.strokeRect(-s2/2, -s2/2, s2, s2);
    ctx.restore();
  });

  const fs = clamp(W*0.02, 10, 24);
  ctx.fillStyle = hexAlpha(fg, 0.3);
  ctx.font = `700 ${fs}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(artist.name.toUpperCase(), W/2, H - 20);
}

// ── COLLAGE: POLAROID ──
function drawCollagePolaroid(ctx, W, H, entries, bg, fg, accent, artist) {
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  const n = entries.length;
  const photoW = Math.min(W/(n+0.5)*0.95, H*0.55);
  const photoH = photoW * 1.22;
  const imgH   = photoW;
  const labH   = photoH - imgH;

  const totalW = n * photoW + (n-1) * photoW * 0.06;
  const startX = (W - totalW) / 2;
  const baseY  = (H - photoH) / 2;

  entries.forEach((e, i) => {
    const x   = startX + i * (photoW + photoW * 0.06);
    const rot = ((i % 2 === 0) ? 1 : -1) * (2 + i * 0.8) * Math.PI / 180;
    const y   = baseY + (i % 2 === 0 ? 0 : photoW * 0.04);

    ctx.save();
    ctx.translate(x + photoW/2, y + photoH/2);
    ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur  = 16;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(-photoW/2, -photoH/2, photoW, photoH);

    if (e.img) drawFitCoverRect(ctx, e.img, -photoW/2, -photoH/2, photoW, imgH);
    else drawPlaceholder(ctx, -photoW/2, -photoH/2, photoW, imgH, accent);

    const fs = clamp(photoW * 0.07, 7, 13);
    ctx.fillStyle = '#333';
    ctx.font = `600 ${fs}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'center';
    const label = e.album.title.substring(0, 14) + (e.album.title.length > 14 ? '…' : '');
    ctx.fillText(label, 0, -photoH/2 + imgH + labH * 0.55);
    ctx.fillStyle = '#999';
    ctx.font = `400 ${fs*0.8}px 'Montserrat', sans-serif`;
    ctx.fillText(e.album.year || '', 0, -photoH/2 + imgH + labH * 0.85);
    ctx.restore();
  });

  const fs = clamp(W*0.016, 9, 18);
  ctx.fillStyle = hexAlpha(fg, 0.28);
  ctx.font = `700 ${fs}px 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(artist.name.toUpperCase(), W/2, H - 18);
}

// ── Cover helpers ──
function drawFitCover(ctx, img, x, y, w, h) {
  const sc = Math.max(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawFitCoverRect(ctx, img, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  drawFitCover(ctx, img, x, y, w, h);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = () => rej(new Error('Image load failed'));
    img.src = src;
  });
}

function hexAlpha(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(128,128,128,${alpha})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return {r:0,g:0,b:0};
  return {
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16),
  };
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(w => {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = w + ' ';
    } else { line = test; }
  });
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function sleep(ms)             { return new Promise(r => setTimeout(r, ms)); }
function esc(s)                { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showLoading(text) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('show');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════
init();