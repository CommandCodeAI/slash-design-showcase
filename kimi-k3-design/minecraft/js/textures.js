/* ============================================================
   textures.js — all textures are generated procedurally on
   canvas at load time. No external image assets needed.
   - 16x16 tile atlas (128x64) for chunk meshes
   - crack overlay stages for mining feedback
   - isometric item icons for inventory/hotbar
   - heart / hunger stat icons
   ============================================================ */
'use strict';

const TILE = 16, ATLAS_COLS = 8, ATLAS_ROWS = 4;

// Tile name → atlas index
const TEX = {
  grass_top: 0, grass_side: 1, dirt: 2, stone: 3, cobble: 4, bedrock: 5,
  sand: 6, gravel: 7, log_side: 8, log_top: 9, leaves: 10, planks: 11,
  water: 12, coal_ore: 13, iron_ore: 14, gold_ore: 15, diamond_ore: 16,
  table_top: 17, table_side: 18, torch: 19, stonebricks: 20, wool: 21,
  glass: 22, table_front: 23,
};

const Textures = {
  atlasCanvas: null,
  atlasTexture: null,
  tileCanvases: [],
  crackTextures: [],
  icons: {},          // "block:ID" | "item:KEY" → dataURL
};

/* ---------- pixel helpers ---------- */
function mkCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}
function fillAll(ctx, color, size = TILE) { ctx.fillStyle = color; ctx.fillRect(0, 0, size, size); }
function speckle(ctx, rand, color, count, size = TILE) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) ctx.fillRect((rand() * size) | 0, (rand() * size) | 0, 1, 1);
}
function blob(ctx, rand, color, cx, cy, r) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y <= r * r + rand() * 1.5) ctx.fillRect(cx + x, cy + y, 1, 1);
  }
}

/* Generic pixel-art renderer: rows of chars → colors */
function drawPixelArt(rows, colors, scale = 1) {
  const c = mkCanvas(rows.length);
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = colors[row[x]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
    }
  });
  if (scale === 1) return c;
  const out = mkCanvas(rows.length * scale);
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(c, 0, 0, out.width, out.height);
  return out;
}

/* ---------- tile painters ---------- */
const TILE_PAINTERS = {
  grass_top(ctx, r) {
    fillAll(ctx, '#64a047');
    speckle(ctx, r, '#548a3c', 70); speckle(ctx, r, '#74b055', 50); speckle(ctx, r, '#82be62', 25);
  },
  grass_side(ctx, r) {
    TILE_PAINTERS.dirt(ctx, r);
    // jagged grass cap hanging over the dirt
    for (let x = 0; x < TILE; x++) {
      const depth = 2 + ((r() * 3) | 0);
      ctx.fillStyle = '#64a047';
      ctx.fillRect(x, 0, 1, depth);
      ctx.fillStyle = '#548a3c';
      if (depth > 2) ctx.fillRect(x, depth - 1, 1, 1);
    }
  },
  dirt(ctx, r) {
    fillAll(ctx, '#8a623d');
    speckle(ctx, r, '#6e4c2e', 60); speckle(ctx, r, '#9d744c', 45); speckle(ctx, r, '#5e3f26', 18);
  },
  stone(ctx, r) {
    fillAll(ctx, '#7d7d7d');
    speckle(ctx, r, '#6a6a6a', 60); speckle(ctx, r, '#909090', 40); speckle(ctx, r, '#5e5e5e', 20);
  },
  cobble(ctx, r) {
    fillAll(ctx, '#545454');
    const tones = ['#7a7a7a', '#828282', '#6e6e6e', '#8c8c8c', '#747474'];
    for (let i = 0; i < 7; i++) {
      const cx = (r() * 14) | 0, cy = (r() * 14) | 0, w = 3 + ((r() * 4) | 0), h = 3 + ((r() * 3) | 0);
      ctx.fillStyle = tones[(r() * tones.length) | 0];
      ctx.fillRect(cx, cy, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.fillRect(cx, cy, w, 1);
    }
    speckle(ctx, r, '#484848', 25);
  },
  bedrock(ctx, r) {
    fillAll(ctx, '#565656');
    speckle(ctx, r, '#2e2e2e', 90); speckle(ctx, r, '#787878', 55); speckle(ctx, r, '#1c1c1c', 40);
  },
  sand(ctx, r) {
    fillAll(ctx, '#dbd3a0');
    speckle(ctx, r, '#c8bf8a', 55); speckle(ctx, r, '#e8e0b4', 40); speckle(ctx, r, '#b8ae7c', 15);
  },
  gravel(ctx, r) {
    fillAll(ctx, '#8a8580');
    const tones = ['#6e6a66', '#8a6f56', '#a09a94', '#7a756f', '#98928c'];
    for (let i = 0; i < 12; i++) blob(ctx, r, tones[(r() * tones.length) | 0], (r() * 16) | 0, (r() * 16) | 0, 1 + ((r() * 2) | 0));
  },
  log_side(ctx, r) {
    fillAll(ctx, '#6e5636');
    for (let x = 0; x < TILE; x += 1 + ((r() * 3) | 0)) {
      ctx.fillStyle = r() > 0.5 ? '#59452c' : '#7d6540';
      const w = 1 + ((r() * 2) | 0);
      ctx.fillRect(x, 0, w, TILE);
    }
    speckle(ctx, r, '#4e3a22', 20);
  },
  log_top(ctx, r) {
    fillAll(ctx, '#b0935e');
    ctx.fillStyle = '#6e5636';
    for (let d = 0; d < 8; d += 2) {               // growth rings
      ctx.fillRect(d, d, TILE - 2 * d, 1); ctx.fillRect(d, TILE - 1 - d, TILE - 2 * d, 1);
      ctx.fillRect(d, d, 1, TILE - 2 * d); ctx.fillRect(TILE - 1 - d, d, 1, TILE - 2 * d);
    }
    speckle(ctx, r, '#9c7f4e', 15);
  },
  leaves(ctx, r) {
    fillAll(ctx, '#4a7a2a');
    speckle(ctx, r, '#3a6420', 85); speckle(ctx, r, '#5a8f36', 45); speckle(ctx, r, '#2f5419', 30);
  },
  planks(ctx, r) {
    fillAll(ctx, '#a0824f');
    ctx.fillStyle = '#6e5633';
    for (let y = 3; y < TILE; y += 4) ctx.fillRect(0, y, TILE, 1);   // board seams
    for (let y = 0; y < TILE; y += 4) {                              // staggered joints
      const jx = ((y * 7 + 3) % 15);
      ctx.fillRect(jx, y, 1, 3);
    }
    speckle(ctx, r, '#8f7144', 30); speckle(ctx, r, '#b08f5a', 20);
  },
  water(ctx, r) {
    fillAll(ctx, '#3f76e4');
    for (let y = 0; y < TILE; y += 4) {
      ctx.fillStyle = r() > 0.5 ? '#5587ec' : '#3568d4';
      const off = (r() * 8) | 0;
      for (let x = 0; x < TILE; x++) if (((x + off) >> 2) % 2 === 0) ctx.fillRect(x, y + ((x >> 3) & 1), 1, 1);
    }
  },
  _ore(ctx, r, base, hi) {
    TILE_PAINTERS.stone(ctx, r);
    for (let i = 0; i < 4; i++) {
      const cx = 2 + ((r() * 12) | 0), cy = 2 + ((r() * 12) | 0);
      blob(ctx, r, base, cx, cy, 1 + ((r() * 1.4) | 0));
      ctx.fillStyle = hi; ctx.fillRect(cx, cy, 1, 1);
    }
  },
  coal_ore(ctx, r) { TILE_PAINTERS._ore(ctx, r, '#232323', '#3f3f3f'); },
  iron_ore(ctx, r) { TILE_PAINTERS._ore(ctx, r, '#c99678', '#ecc0a4'); },
  gold_ore(ctx, r) { TILE_PAINTERS._ore(ctx, r, '#f0cd42', '#fce87a'); },
  diamond_ore(ctx, r) { TILE_PAINTERS._ore(ctx, r, '#4fd8d0', '#8ff5ee'); },
  table_top(ctx, r) {
    TILE_PAINTERS.planks(ctx, r);
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(0, 0, TILE, 1); ctx.fillRect(0, TILE - 1, TILE, 1);
    ctx.fillRect(0, 0, 1, TILE); ctx.fillRect(TILE - 1, 0, 1, TILE);
    ctx.fillStyle = '#7d6540';                                     // tool grid on top
    ctx.fillRect(3, 3, 4, 4); ctx.fillRect(9, 3, 4, 4);
    ctx.fillRect(3, 9, 4, 4); ctx.fillRect(9, 9, 4, 4);
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(4, 4, 2, 2); ctx.fillRect(10, 10, 2, 2);
  },
  table_side(ctx, r) {
    TILE_PAINTERS.planks(ctx, r);
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(3, 5, 10, 8);
    ctx.fillStyle = '#a0824f';
    ctx.fillRect(4, 6, 8, 6);
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(7, 6, 1, 6); ctx.fillRect(4, 8, 8, 1);
  },
  table_front(ctx, r) {
    TILE_PAINTERS.planks(ctx, r);
    ctx.fillStyle = '#8f7144';
    ctx.fillRect(0, 0, TILE, 3);                                   // darker worktop lip
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(0, 2, TILE, 1);
    ctx.fillRect(2, 5, 5, 5); ctx.fillRect(9, 5, 5, 5);
    ctx.fillStyle = '#c8b184';
    ctx.fillRect(3, 6, 3, 3); ctx.fillRect(10, 6, 3, 3);
  },
  torch(ctx, r) {
    // transparent background — atlas material uses alphaTest
    ctx.clearRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#6b4f2a'; ctx.fillRect(7, 6, 2, 10);          // stick
    ctx.fillStyle = '#7d5f36'; ctx.fillRect(7, 6, 1, 10);
    ctx.fillStyle = '#ffd75e'; ctx.fillRect(6, 2, 4, 4);           // flame
    ctx.fillStyle = '#fff2b0'; ctx.fillRect(7, 2, 2, 2);
    ctx.fillStyle = '#e0a83c'; ctx.fillRect(6, 5, 4, 1);
  },
  stonebricks(ctx, r) {
    fillAll(ctx, '#787878');
    speckle(ctx, r, '#6a6a6a', 30); speckle(ctx, r, '#8a8a8a', 25);
    ctx.fillStyle = '#545454';
    ctx.fillRect(0, 3, TILE, 1); ctx.fillRect(0, 7, TILE, 1); ctx.fillRect(0, 11, TILE, 1);
    ctx.fillRect(8, 0, 1, 3); ctx.fillRect(4, 4, 1, 3); ctx.fillRect(12, 4, 1, 3);
    ctx.fillRect(8, 8, 1, 3); ctx.fillRect(2, 12, 1, 4); ctx.fillRect(11, 12, 1, 4);
  },
  wool(ctx, r) {
    fillAll(ctx, '#e8e6e2');
    speckle(ctx, r, '#d4d2ce', 40); speckle(ctx, r, '#f4f2ee', 30);
    ctx.fillStyle = '#c9c7c3';
    for (let y = 5; y < TILE; y += 6) ctx.fillRect(0, y, TILE, 1);
  },
  glass(ctx, r) {
    ctx.clearRect(0, 0, TILE, TILE);
    ctx.fillStyle = 'rgba(223,239,255,0.95)';
    ctx.fillRect(0, 0, TILE, 1); ctx.fillRect(0, TILE - 1, TILE, 1);
    ctx.fillRect(0, 0, 1, TILE); ctx.fillRect(TILE - 1, 0, 1, TILE);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';                      // diagonal shine
    for (let i = 0; i < 6; i++) { ctx.fillRect(3 + i, 10 - i, 1, 1); ctx.fillRect(8 + i, 13 - i, 1, 1); }
  },
};

/* ---------- build the atlas ---------- */
function buildAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE; canvas.height = ATLAS_ROWS * TILE;
  const ctx = canvas.getContext('2d');

  for (const [name, idx] of Object.entries(TEX)) {
    const tileCanvas = mkCanvas(TILE);
    const tctx = tileCanvas.getContext('2d');
    const rand = mulberry32(idx * 7919 + 17);                    // deterministic per tile
    (TILE_PAINTERS[name] || (() => fillAll(tctx, '#ff00ff')))(tctx, rand);
    Textures.tileCanvases[idx] = tileCanvas;
    const col = idx % ATLAS_COLS, row = (idx / ATLAS_COLS) | 0;
    ctx.drawImage(tileCanvas, col * TILE, row * TILE);
  }

  Textures.atlasCanvas = canvas;
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  Textures.atlasTexture = tex;
}

/* UV rect for a tile (slightly inset to prevent bleeding) */
function tileUV(idx) {
  const col = idx % ATLAS_COLS, row = (idx / ATLAS_COLS) | 0;
  const inset = 0.02;
  const u0 = (col + inset) / ATLAS_COLS, u1 = (col + 1 - inset) / ATLAS_COLS;
  const v1 = 1 - row / ATLAS_ROWS - inset / ATLAS_ROWS;
  const v0 = 1 - (row + 1) / ATLAS_ROWS + inset / ATLAS_ROWS;
  return [u0, v0, u1, v1];
}

/* ---------- crack overlays (mining progress) ---------- */
function buildCracks() {
  for (let stage = 0; stage < 5; stage++) {
    const c = mkCanvas(TILE);
    const ctx = c.getContext('2d');
    const rand = mulberry32(stage * 331 + 7);
    ctx.strokeStyle = 'rgba(10,10,10,0.9)';
    ctx.lineWidth = 1;
    const lines = 2 + stage * 3;
    for (let i = 0; i < lines; i++) {
      let x = 4 + rand() * 8, y = 4 + rand() * 8;
      ctx.beginPath(); ctx.moveTo(x, y);
      const segs = 2 + ((rand() * 3) | 0);
      for (let s = 0; s < segs; s++) {
        x += (rand() - 0.5) * 9; y += (rand() - 0.5) * 9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    Textures.crackTextures.push(tex);
  }
}

/* ---------- isometric block icons for the inventory ---------- */
function isoBlockCanvas(topIdx, leftIdx, rightIdx) {
  const S = 40;
  const c = mkCanvas(S);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const top = Textures.tileCanvases[topIdx], left = Textures.tileCanvases[leftIdx], right = Textures.tileCanvases[rightIdx];
  // top face (diamond)
  ctx.setTransform(1, -0.5, 1, 0.5, 4, 12);
  ctx.drawImage(top, 0, 0);
  // left face
  ctx.setTransform(1, 0.5, 0, 1, 4, 12);
  ctx.drawImage(left, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, 0, TILE, TILE);
  // right face
  ctx.setTransform(1, -0.5, 0, 1, 20, 20);
  ctx.drawImage(right, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, 0, TILE, TILE);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
function flatIconCanvas(tileIdx) {
  const c = mkCanvas(32);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(Textures.tileCanvases[tileIdx], 0, 0, 32, 32);
  return c;
}

/* ---------- pixel art for non-block items ---------- */
const ITEM_ART = {
  stick: { c: { s: '#5a4226', S: '#7d5f36' }, m: [
    '..............ss','.............sSS','............sSS.','...........sSS..',
    '..........sSS...','.........sSS....','........sSS.....','.......sSS......',
    '......sSS.......','.....sSS........','....sSS.........','...sSS..........',
    '..sSS...........','.sSS............','sSS.............','s...............'] },
  wood_pickaxe: { c: { h: '#5a4226', H: '#a0824f', s: '#5a4226', S: '#7d5f36' }, m: [
    '....hhhhhhhh....','...hHHHHHHHHh...','..hHHhh..hhHHh..','..hHh..ss..hHh..',
    '..hh...SS...hh..','.......SS.......','......SS........','......SS........',
    '.....SS.........','.....SS.........','....SS..........','....SS..........',
    '...SS...........','...SS...........','................','................'] },
  stone_pickaxe: { c: { h: '#4a4a4a', H: '#8a8a8a', s: '#5a4226', S: '#7d5f36' }, m: [
    '....hhhhhhhh....','...hHHHHHHHHh...','..hHHhh..hhHHh..','..hHh..ss..hHh..',
    '..hh...SS...hh..','.......SS.......','......SS........','......SS........',
    '.....SS.........','.....SS.........','....SS..........','....SS..........',
    '...SS...........','...SS...........','................','................'] },
  wood_axe: { c: { h: '#5a4226', H: '#a0824f', s: '#5a4226', S: '#7d5f36' }, m: [
    '........hhhh....','.......hHHHHh...','......hHHHHHHh..','......hHHHhHHh..',
    '......hHHh.ss...','......hHH.SS....','.......h.SS.....','........SS......',
    '.......SS.......','.......SS.......','......SS........','......SS........',
    '.....SS.........','.....SS.........','................','................'] },
  stone_axe: { c: { h: '#4a4a4a', H: '#8a8a8a', s: '#5a4226', S: '#7d5f36' }, m: [
    '........hhhh....','.......hHHHHh...','......hHHHHHHh..','......hHHHhHHh..',
    '......hHHh.ss...','......hHH.SS....','.......h.SS.....','........SS......',
    '.......SS.......','.......SS.......','......SS........','......SS........',
    '.....SS.........','.....SS.........','................','................'] },
  wood_sword: { c: { b: '#8f7144', B: '#b08f5a', g: '#5a4226', G: '#3e2f1c' }, m: [
    '.............bbb','............bBBb','...........bBBb.','..........bBBb..',
    '.........bBBb...','........bBBb....','...g...bBBb.....','...gg.bBBb......',
    '....ggBBb.......','.....ggb........','....gGGg........','...gGG..g.......',
    '..gGG...........','.gGG............','.g..............','................'] },
  stone_sword: { c: { b: '#6a6a6a', B: '#9a9a9a', g: '#5a4226', G: '#3e2f1c' }, m: [
    '.............bbb','............bBBb','...........bBBb.','..........bBBb..',
    '.........bBBb...','........bBBb....','...g...bBBb.....','...gg.bBBb......',
    '....ggBBb.......','.....ggb........','....gGGg........','...gGG..g.......',
    '..gGG...........','.gGG............','.g..............','................'] },
  wood_shovel: { c: { h: '#5a4226', H: '#a0824f', s: '#5a4226', S: '#7d5f36' }, m: [
    '................','..........hhh...','.........hHHHh..','........hHHHHh..',
    '........hHHHHh..','.........hHHh...','..........sh....','.........SS.....',
    '........SS......','.......SS.......','......SS........','.....SS.........',
    '....SS..........','...SS...........','................','................'] },
  stone_shovel: { c: { h: '#4a4a4a', H: '#8a8a8a', s: '#5a4226', S: '#7d5f36' }, m: [
    '................','..........hhh...','.........hHHHh..','........hHHHHh..',
    '........hHHHHh..','.........hHHh...','..........sh....','.........SS.....',
    '........SS......','.......SS.......','......SS........','.....SS.........',
    '....SS..........','...SS...........','................','................'] },
  diamond_pickaxe: { c: { h: '#2aa8a0', H: '#5de8e0', s: '#5a4226', S: '#7d5f36' }, m: [
    '....hhhhhhhh....','...hHHHHHHHHh...','..hHHhh..hhHHh..','..hHh..ss..hHh..',
    '..hh...SS...hh..','.......SS.......','......SS........','......SS........',
    '.....SS.........','.....SS.........','....SS..........','....SS..........',
    '...SS...........','...SS...........','................','................'] },
  diamond_axe: { c: { h: '#2aa8a0', H: '#5de8e0', s: '#5a4226', S: '#7d5f36' }, m: [
    '........hhhh....','.......hHHHHh...','......hHHHHHHh..','......hHHHhHHh..',
    '......hHHh.ss...','......hHH.SS....','.......h.SS.....','........SS......',
    '.......SS.......','.......SS.......','......SS........','......SS........',
    '.....SS.........','.....SS.........','................','................'] },
  diamond_sword: { c: { b: '#2aa8a0', B: '#5de8e0', g: '#5a4226', G: '#3e2f1c' }, m: [
    '.............bbb','............bBBb','...........bBBb.','..........bBBb..',
    '.........bBBb...','........bBBb....','...g...bBBb.....','...gg.bBBb......',
    '....ggBBb.......','.....ggb........','....gGGg........','...gGG..g.......',
    '..gGG...........','.gGG............','.g..............','................'] },
  diamond_shovel: { c: { h: '#2aa8a0', H: '#5de8e0', s: '#5a4226', S: '#7d5f36' }, m: [
    '................','..........hhh...','.........hHHHh..','........hHHHHh..',
    '........hHHHHh..','.........hHHh...','..........sh....','.........SS.....',
    '........SS......','.......SS.......','......SS........','.....SS.........',
    '....SS..........','...SS...........','................','................'] },
  coal: { c: { k: '#161616', K: '#2e2e2e' }, m: [
    '................','.....kkkk.......','...kkKKKKkk.....','..kKKKKKKKKk....',
    '..kKKkKKKKKk....','.kKKKKKKkKKKk...','.kKKKKKKKKKKk...','.kKKkKKKKKKk....',
    '.kKKKKKKkKKk....','..kKKKKKKKKk....','..kKKkKKKkk.....','....kkKKk.......',
    '................','................','................','................'] },
  apple: { c: { g: '#4f8f2f', s: '#5a4226', r: '#a32020', R: '#d43a2a' }, m: [
    '........g.......','.......sG.......','......s.........','....rrrrrr......',
    '..rrRRRRRRrr....','.rRRRRRRRRRRr...','.rRrRRRRRRRRr...','.rRRRRRRRRRRr...',
    '.rRRRRRRRRRRr...','.rRRRRRRRRRRr...','..rRRRRRRRRr....','..rrRRRRRRrr....',
    '....rrrrrr......','................','................','................'] },
  pork: { c: { p: '#b06048', P: '#d98a68', w: '#f2d8b8' }, m: [
    '................','......pppp......','....ppPPPPpp....','...pPPPPPPPPp...',
    '..pPPPwwPPPPp...','..pPPwwwwPPPp...','..pPPwwPPPPPp...','..pPPPPPPPPp....',
    '...pPPPPPPp.....','.....pppp.......','................','................',
    '................','................','................','................'] },
  diamond: { c: { b: '#2aa8a0', B: '#5de8e0', W: '#c8fffb' }, m: [
    '................','................','....bbbbbb.....','...bBBBBBBb....',
    '..bBWWBBBBBb....','..bBWWBBBBBb....','...bBBBBBBb.....','....bBBBBb......',
    '.....bBBb.......','......bb........','................','................',
    '................','................','................','................'] },
  flesh: { c: { f: '#8a5a3a', F: '#a8744a', g: '#6a7a3a' }, m: [
    '................','................','....fffff.......','...fFFFFFFf.....',
    '..fFFggFFFFf....','..fFgggFFFFf....','..fFFgggFFFf....','..fFFFggFFf.....',
    '...fFFFFFFf.....','....fffff.......','................','................',
    '................','................','................','................'] },
};
ITEM_ART.apple.c.G = '#6fae3f';

/* Build icon dataURLs + canvases for every block + item. Call after blocks.js loads. */
function buildItemIcons() {
  Textures.iconCanvases = {};
  const store = (key, canvas) => {
    Textures.icons[key] = canvas.toDataURL();
    Textures.iconCanvases[key] = canvas;
  };
  for (const [idStr, b] of Object.entries(BLOCKS)) {
    const id = +idStr;
    if (id === BLOCK_ID.AIR) continue;
    if (b.customMesh === 'torch') { store('block:' + id, flatIconCanvas(b.tex.side)); continue; }
    store('block:' + id, isoBlockCanvas(b.tex.top, b.tex.side, b.tex.front !== undefined ? b.tex.front : b.tex.side));
  }
  for (const key of Object.keys(ITEMS)) {
    const art = ITEM_ART[key];
    if (art) store('item:' + key, drawPixelArt(art.m, art.c));
  }
}

/* ---------- heart / hunger stat icons ---------- */
const HEART_ART = { c: { r: '#8a0f0f', R: '#e82323', w: '#ff7a6a', d: '#3a3a3a', D: '#555555' }, m: [
  '.rr...rr.','rRRRrRRRr','rRwRRRRRR','rRRRRRRRR','rRRRRRRRR','.rRRRRRR.','..rRRRR..','...rRR...','....r....'] };
const DRUM_ART = { c: { m: '#6e4526', M: '#96653a', b: '#c9c9c9', B: '#e8e8e8', d: '#3a3a3a', D: '#555555' }, m: [
  '......mm.','.....mMMm','....mMMM.','...mMMm..','..bbmm...','.bBBb....','bBBb.....','bBBb.....','.bb......'] };

function statIcon(art, fill) {
  // fill: 'full' | 'half' | 'empty' — recolor the art accordingly
  const rows = art.m.map(r => r.split(''));
  if (fill !== 'full') {
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const isDark = fill === 'empty' || x >= 5;   // half: right side empty
      if (isDark) rows[y][x] = (ch === ch.toLowerCase()) ? 'd' : 'D';
    }
  }
  return drawPixelArt(rows.map(r => r.join('')), art.c, 2).toDataURL();
}
Textures.heartURL = fill => statIcon(HEART_ART, fill);
Textures.drumURL = fill => statIcon(DRUM_ART, fill);

/* Build everything on script load */
buildAtlas();
buildCracks();
