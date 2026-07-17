/* ============================================================
   inventory.js — inventory model, hotbar, crafting (2x2 + 3x3),
   click/drag stack handling, creative palette, serialization.
   Stack shape: { block: id, count } or { item: key, count, durability? }
   ============================================================ */
'use strict';

/* ---------------- recipes ---------------- */
// cellKey: block stack → "b<id>", item stack → "i<key>"
function cellKey(s) { return s ? (s.block !== undefined ? 'b' + s.block : 'i' + s.item) : null; }
function shaped(pattern, key, out) { return { type: 'shaped', pattern, key, out }; }
function shapeless(inputs, out) { return { type: 'shapeless', inputs, out }; }

const B = BLOCK_ID;
const RECIPES = [
  shapeless(['b' + B.LOG], { block: B.PLANKS, count: 4 }),
  shaped(['P', 'P'], { P: 'b' + B.PLANKS }, { item: 'stick', count: 4 }),
  shaped(['PP', 'PP'], { P: 'b' + B.PLANKS }, { block: B.CRAFTING_TABLE, count: 1 }),
  shapeless(['icoal', 'istick'], { block: B.TORCH, count: 4 }),
  shaped(['PPP', ' S ', ' S '], { P: 'b' + B.PLANKS, S: 'istick' }, { item: 'wood_pickaxe', count: 1 }),
  shaped(['CCC', ' S ', ' S '], { C: 'b' + B.COBBLE, S: 'istick' }, { item: 'stone_pickaxe', count: 1 }),
  shaped(['DDD', ' S ', ' S '], { D: 'idiamond', S: 'istick' }, { item: 'diamond_pickaxe', count: 1 }),
  shaped(['PP', 'PS', ' S'], { P: 'b' + B.PLANKS, S: 'istick' }, { item: 'wood_axe', count: 1 }),
  shaped(['CC', 'CS', ' S'], { C: 'b' + B.COBBLE, S: 'istick' }, { item: 'stone_axe', count: 1 }),
  shaped(['DD', 'DS', ' S'], { D: 'idiamond', S: 'istick' }, { item: 'diamond_axe', count: 1 }),
  shaped(['P', 'P', 'S'], { P: 'b' + B.PLANKS, S: 'istick' }, { item: 'wood_sword', count: 1 }),
  shaped(['C', 'C', 'S'], { C: 'b' + B.COBBLE, S: 'istick' }, { item: 'stone_sword', count: 1 }),
  shaped(['D', 'D', 'S'], { D: 'idiamond', S: 'istick' }, { item: 'diamond_sword', count: 1 }),
  shaped(['P', 'S', 'S'], { P: 'b' + B.PLANKS, S: 'istick' }, { item: 'wood_shovel', count: 1 }),
  shaped(['C', 'S', 'S'], { C: 'b' + B.COBBLE, S: 'istick' }, { item: 'stone_shovel', count: 1 }),
  shaped(['D', 'S', 'S'], { D: 'idiamond', S: 'istick' }, { item: 'diamond_shovel', count: 1 }),
  shaped(['TT', 'TT'], { T: 'b' + B.STONE }, { block: B.STONEBRICKS, count: 4 }),
  shapeless(['b' + B.SAND, 'icoal'], { block: B.GLASS, count: 1 }),
];

function recipeOutput(recipe) {
  const out = { ...recipe.out };
  const def = out.item !== undefined ? ITEMS[out.item] : null;
  if (def && def.durability) out.durability = def.durability;
  return out;
}

/* extract trimmed grid matrix of cellKeys */
function gridMatrix(grid, size) {
  const m = [];
  for (let r = 0; r < size; r++) {
    m.push([]);
    for (let c = 0; c < size; c++) m[r].push(cellKey(grid[r * size + c]));
  }
  // trim empty border rows/cols
  let r0 = 0, r1 = size - 1, c0 = 0, c1 = size - 1;
  const rowEmpty = r => m[r].every(v => v === null);
  const colEmpty = c => m.every(row => row[c] === null);
  while (r0 <= r1 && rowEmpty(r0)) r0++;
  while (r1 >= r0 && rowEmpty(r1)) r1--;
  while (c0 <= c1 && colEmpty(c0)) c0++;
  while (c1 >= c0 && colEmpty(c1)) c1--;
  if (r0 > r1 || c0 > c1) return [];
  const out = [];
  for (let r = r0; r <= r1; r++) out.push(m[r].slice(c0, c1 + 1));
  return out;
}

function matchShaped(matrix, recipe, mirror) {
  const p = recipe.pattern;
  if (matrix.length !== p.length) return false;
  for (let r = 0; r < p.length; r++) {
    if (matrix[r].length !== p[r].length) return false;
    for (let c = 0; c < p[r].length; c++) {
      const ch = p[r][mirror ? p[r].length - 1 - c : c];
      const want = ch === ' ' ? null : recipe.key[ch];
      if (matrix[r][c] !== want) return false;
    }
  }
  return true;
}

function findRecipe(grid, size) {
  const matrix = gridMatrix(grid, size);
  if (matrix.length === 0) return null;
  for (const recipe of RECIPES) {
    if (recipe.type === 'shaped') {
      if (matchShaped(matrix, recipe, false) || matchShaped(matrix, recipe, true)) return recipe;
    } else {
      // shapeless: compare multisets of non-null cells
      const cells = [];
      for (const s of grid) { const k = cellKey(s); if (k) cells.push(k); }
      if (cells.length !== recipe.inputs.length) continue;
      const sorted = [...cells].sort().join('|');
      if ([...recipe.inputs].sort().join('|') === sorted) return recipe;
    }
  }
  return null;
}

/* ---------------- inventory ---------------- */
const Inv = {
  hotbar: new Array(9).fill(null),
  main: new Array(27).fill(null),
  craft2: new Array(4).fill(null),
  craft3: new Array(9).fill(null),
  result2: null, result3: null,          // computed outputs
  selected: 0,
  held: null,                            // stack on the cursor
  creativeMode: false,

  area(name) {
    return name === 'hotbar' ? this.hotbar : name === 'main' ? this.main
         : name === 'craft2' ? this.craft2 : this.craft3;
  },

  selectedStack() { return this.hotbar[this.selected]; },

  addStack(stack) {
    // merge into existing stacks first (hotbar then main)
    for (const area of [this.hotbar, this.main]) {
      for (let i = 0; i < area.length && stack.count > 0; i++) {
        const s = area[i];
        if (s && cellKey(s) === cellKey(stack) && !s.durability && !stack.durability) {
          const room = stackMax(s) - s.count;
          const move = Math.min(room, stack.count);
          s.count += move; stack.count -= move;
        }
      }
    }
    for (const area of [this.hotbar, this.main]) {
      for (let i = 0; i < area.length && stack.count > 0; i++) {
        if (!area[i]) {
          const move = Math.min(stackMax(stack), stack.count);
          area[i] = { ...stack, count: move };
          stack.count -= move;
        }
      }
    }
    return stack.count;   // leftover that didn't fit
  },

  recomputeResults() {
    const r2 = findRecipe(this.craft2, 2);
    const r3 = findRecipe(this.craft3, 3);
    this.result2 = r2 ? recipeOutput(r2) : null;
    this.result3 = r3 ? recipeOutput(r3) : null;
  },

  consumeGrid(grid) {
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] && --grid[i].count <= 0) grid[i] = null;
    }
  },

  craft(which, shiftKey) {
    const grid = which === 2 ? this.craft2 : this.craft3;
    const get = () => which === 2 ? this.result2 : this.result3;
    if (shiftKey) {
      // craft as much as possible straight into the inventory
      for (let n = 0; n < 64 && get(); n++) {
        const leftover = this.addStack({ ...get() });
        if (leftover > 0) break;
        this.consumeGrid(grid);
        this.recomputeResults();
      }
    } else {
      const res = get();
      if (!res) return;
      if (!this.held) { this.held = { ...res }; }
      else if (cellKey(this.held) === cellKey(res) && !res.durability &&
               this.held.count + res.count <= stackMax(this.held)) {
        this.held.count += res.count;
      } else return;
      this.consumeGrid(grid);
      this.recomputeResults();
      Audio.play('craft');
    }
  },

  /* return crafting-grid items to the inventory (on close) */
  dumpCraftGrids() {
    for (const grid of [this.craft2, this.craft3]) {
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) { this.addStack(grid[i]); grid[i] = null; }
      }
    }
    this.recomputeResults();
  },

  giveStarter() {
    this.hotbar.fill(null); this.main.fill(null);
    this.craft2.fill(null); this.craft3.fill(null);
    this.held = null; this.selected = 0;
    if (this.creativeMode) {
      const blocks = [B.GRASS, B.DIRT, B.STONE, B.COBBLE, B.PLANKS, B.LOG, B.GLASS, B.TORCH, B.WOOL];
      blocks.forEach((id, i) => this.hotbar[i] = { block: id, count: 64 });
    }
  },

  serialize() {
    const pack = a => a.map(s => s ? [s.block !== undefined ? 'b' : 'i', s.block !== undefined ? s.block : s.item, s.count, s.durability || 0] : null);
    return { hotbar: pack(this.hotbar), main: pack(this.main), selected: this.selected };
  },
  deserialize(d) {
    const unpack = a => (a || []).map(s => s ? (s[0] === 'b' ? { block: s[1], count: s[2] } : { item: s[1], count: s[2], durability: s[3] || undefined }) : null);
    this.hotbar = unpack(d && d.hotbar); while (this.hotbar.length < 9) this.hotbar.push(null);
    this.main = unpack(d && d.main); while (this.main.length < 27) this.main.push(null);
    this.selected = (d && d.selected) || 0;
  },
};

/* ---------------- DOM UI ---------------- */
const InvUI = {
  slots: [],   // { el, area, index }

  init() {
    // build slot grids
    this.buildGrid(document.getElementById('hotbar'), 'hotbar', 9, 'hotbar-slot');
    this.buildGrid(document.getElementById('inv-main'), 'main', 27, 'inv-slot');
    this.buildGrid(document.getElementById('inv-hotbar'), 'hotbar', 9, 'inv-slot');
    this.buildGrid(document.getElementById('inv-main-2'), 'main', 27, 'inv-slot');
    this.buildGrid(document.getElementById('inv-hotbar-2'), 'hotbar', 9, 'inv-slot');
    this.buildGrid(document.getElementById('craft-grid-2x2'), 'craft2', 4, 'inv-slot');
    this.buildGrid(document.getElementById('craft-grid-3x3'), 'craft3', 9, 'inv-slot');
    this.bindResult(document.getElementById('craft-result-2x2'), 2);
    this.bindResult(document.getElementById('craft-result-3x3'), 3);
    this.buildCreativePalette();

    // held stack follows the mouse
    document.addEventListener('mousemove', e => {
      const h = document.getElementById('held-stack');
      h.style.left = e.clientX + 'px';
      h.style.top = e.clientY + 'px';
    });
    document.addEventListener('contextmenu', e => {
      if (e.target.closest('.inv-slot') || e.target.closest('.hotbar-slot')) e.preventDefault();
    });
  },

  buildGrid(container, area, count, cls) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = cls;
      el.dataset.area = area; el.dataset.index = i;
      el.addEventListener('mousedown', e => { e.preventDefault(); this.slotClick(area, i, e.button, e.shiftKey); });
      container.appendChild(el);
      this.slots.push({ el, area, index: i });
    }
  },

  bindResult(el, which) {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      Inv.craft(which, e.shiftKey);
      this.renderAll();
    });
  },

  buildCreativePalette() {
    // palette strip shown at the top of the inventory screen in creative
    const panel = document.querySelector('#inventory-screen .inv-panel');
    const wrap = document.createElement('div');
    wrap.id = 'creative-palette';
    wrap.innerHTML = '<div class="inv-title">All blocks &amp; items (creative)</div>';
    const strip = document.createElement('div');
    strip.className = 'creative-strip inv-grid cols-9';
    const add = (stack) => {
      const el = document.createElement('div');
      el.className = 'inv-slot';
      const img = document.createElement('img');
      img.src = stackIcon(stack);
      el.appendChild(img);
      el.title = stackName(stack);
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        Inv.held = e.button === 2 ? { ...stack, count: 1 } : { ...stack, count: stackMax(stack) };
        InvUI.renderAll();
      });
      strip.appendChild(el);
    };
    for (const idStr of Object.keys(BLOCKS)) {
      const id = +idStr;
      if (id === B.AIR || id === B.WATER || id === B.BEDROCK) continue;
      add({ block: id, count: 64 });
    }
    for (const key of Object.keys(ITEMS)) add({ item: key, count: ITEMS[key].stack });
    wrap.appendChild(strip);
    panel.insertBefore(wrap, panel.firstChild);
  },

  slotClick(area, index, button, shiftKey) {
    const arr = Inv.area(area);
    const slot = arr[index];

    if (shiftKey && button === 0 && slot && (area === 'craft2' || area === 'craft3' || area === 'hotbar' || area === 'main')) {
      // quick move between areas
      const target = area === 'hotbar' ? Inv.main : area === 'main' ? Inv.hotbar : Inv.main;
      const moved = { ...slot };
      for (let i = 0; i < target.length && moved.count > 0; i++) {
        const s = target[i];
        if (s && cellKey(s) === cellKey(moved) && !s.durability) {
          const mv = Math.min(stackMax(s) - s.count, moved.count);
          s.count += mv; moved.count -= mv;
        }
      }
      for (let i = 0; i < target.length && moved.count > 0; i++) {
        if (!target[i]) { target[i] = { ...moved }; moved.count = 0; }
      }
      arr[index] = moved.count > 0 ? moved : null;
    } else if (button === 0) {
      // left: pick up / place all / merge / swap
      if (!Inv.held && slot) { Inv.held = slot; arr[index] = null; }
      else if (Inv.held && !slot) { arr[index] = Inv.held; Inv.held = null; }
      else if (Inv.held && slot) {
        if (cellKey(Inv.held) === cellKey(slot) && !Inv.held.durability && !slot.durability) {
          const mv = Math.min(stackMax(slot) - slot.count, Inv.held.count);
          slot.count += mv; Inv.held.count -= mv;
          if (Inv.held.count <= 0) Inv.held = null;
        } else { arr[index] = Inv.held; Inv.held = slot; }
      }
    } else if (button === 2) {
      // right: place one / pick up half
      if (Inv.held && !slot) {
        arr[index] = { ...Inv.held, count: 1 };
        if (--Inv.held.count <= 0) Inv.held = null;
      } else if (Inv.held && slot && cellKey(Inv.held) === cellKey(slot) && !slot.durability && slot.count < stackMax(slot)) {
        slot.count++;
        if (--Inv.held.count <= 0) Inv.held = null;
      } else if (!Inv.held && slot) {
        const half = Math.ceil(slot.count / 2);
        Inv.held = { ...slot, count: half };
        slot.count -= half;
        if (slot.count <= 0) arr[index] = null;
      }
    }

    if (area === 'craft2' || area === 'craft3') Inv.recomputeResults();
    this.renderAll();
  },

  renderSlot(el, stack, showSelected) {
    el.innerHTML = '';
    el.classList.toggle('selected', !!showSelected);
    if (!stack) return;
    const img = document.createElement('img');
    img.src = stackIcon(stack);
    el.appendChild(img);
    if (stack.count > 1) {
      const c = document.createElement('div');
      c.className = 'slot-count'; c.textContent = stack.count;
      el.appendChild(c);
    }
    if (stack.durability !== undefined) {
      const def = ITEMS[stack.item];
      const frac = Math.max(0, stack.durability / def.durability);
      const bar = document.createElement('div');
      bar.className = 'slot-durability';
      const fill = document.createElement('div');
      fill.style.width = (frac * 100).toFixed(0) + '%';
      fill.style.background = frac > 0.5 ? '#4fe04f' : frac > 0.25 ? '#e0c84f' : '#e04f4f';
      bar.appendChild(fill);
      el.appendChild(bar);
    }
  },

  renderAll() {
    for (const s of this.slots) {
      const arr = Inv.area(s.area);
      this.renderSlot(s.el, arr[s.index], s.area === 'hotbar' && s.index === Inv.selected);
    }
    this.renderSlot(document.getElementById('craft-result-2x2'), Inv.result2, false);
    this.renderSlot(document.getElementById('craft-result-3x3'), Inv.result3, false);
    // held cursor stack
    const heldEl = document.getElementById('held-stack');
    if (Inv.held) {
      heldEl.classList.remove('hidden');
      heldEl.querySelector('img').src = stackIcon(Inv.held);
      heldEl.querySelector('.slot-count').textContent = Inv.held.count > 1 ? Inv.held.count : '';
    } else heldEl.classList.add('hidden');
    // creative palette visibility
    const pal = document.getElementById('creative-palette');
    if (pal) pal.style.display = Inv.creativeMode ? '' : 'none';
    // hand overlay
    UI.updateHand();
  },
};
