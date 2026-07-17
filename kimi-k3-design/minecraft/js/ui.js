/* ============================================================
   ui.js — HUD glue: hearts/hunger, debug overlay, hand overlay,
   damage vignette, screen switching, splash texts.
   ============================================================ */
'use strict';

const SPLASHES = [
  'Punch trees!', '100% JavaScript!', 'Also try Minecraft!', 'Handmade pixels!',
  'Now with zombies!', 'Runs from one folder!', 'Seeded worlds!', 'Watch out for falls!',
  'Diamonds are deep!', 'Torch the night!', 'Feed yourself!', 'Craft all the things!',
];

const UI = {
  debugVisible: false,
  _heartImgs: [], _hungerImgs: [],
  _namePopTimer: null,

  init() {
    // splash text
    document.getElementById('splash').textContent = SPLASHES[(Math.random() * SPLASHES.length) | 0];
    // stat icon rows
    const hearts = document.getElementById('hearts');
    const hunger = document.getElementById('hunger');
    for (let i = 0; i < 10; i++) {
      const h = document.createElement('img'); h.className = 'stat-icon'; hearts.appendChild(h); this._heartImgs.push(h);
      const g = document.createElement('img'); g.className = 'stat-icon'; hunger.appendChild(g); this._hungerImgs.push(g);
    }
    // cache the three states of each icon
    this._heartURL = { full: Textures.heartURL('full'), half: Textures.heartURL('half'), empty: Textures.heartURL('empty') };
    this._drumURL = { full: Textures.drumURL('full'), half: Textures.drumURL('half'), empty: Textures.drumURL('empty') };
    this.updateStatusBars();
    // hand swing cleanup
    const hand = document.getElementById('hand');
    hand.addEventListener('animationend', () => hand.classList.remove('swing'));
  },

  updateStatusBars() {
    const p = Game.player;
    if (!p) return;
    for (let i = 0; i < 10; i++) {
      const hp = p.health - i * 2;
      this._heartImgs[i].src = hp >= 2 ? this._heartURL.full : hp === 1 ? this._heartURL.half : this._heartURL.empty;
      const hu = p.hunger - i * 2;
      this._hungerImgs[9 - i].src = hu >= 2 ? this._drumURL.full : hu === 1 ? this._drumURL.half : this._drumURL.empty;
    }
  },

  damageFlash() {
    const v = document.getElementById('vignette');
    v.classList.remove('hit');
    void v.offsetWidth;                 // restart the animation
    v.classList.add('hit');
  },
  shakeHunger() {
    const el = document.getElementById('hunger');
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  },

  updateHand() {
    const stack = Inv.selectedStack();
    const img = document.getElementById('hand-img');
    if (stack) { img.src = stackIcon(stack); img.style.visibility = 'visible'; }
    else img.style.visibility = 'hidden';
  },
  swingHand() {
    const hand = document.getElementById('hand');
    hand.classList.remove('swing');
    void hand.offsetWidth;
    hand.classList.add('swing');
  },
  setMining(on) { document.getElementById('hand').classList.toggle('mine', on); },

  itemNamePop(name) {
    const el = document.getElementById('item-name-pop');
    el.textContent = name || '';
    el.classList.add('show');
    clearTimeout(this._namePopTimer);
    this._namePopTimer = setTimeout(() => el.classList.remove('show'), 1300);
  },

  setFPS(text) { document.getElementById('fps-tag').textContent = text; },
  setDebug(text) { if (this.debugVisible) document.getElementById('debug').textContent = text; },
  toggleDebug() {
    this.debugVisible = !this.debugVisible;
    document.getElementById('debug').classList.toggle('hidden', !this.debugVisible);
  },

  show(id) { document.getElementById(id).classList.remove('hidden'); },
  hide(id) { document.getElementById(id).classList.add('hidden'); },
  hideAllScreens() {
    for (const id of ['title-screen', 'pause-screen', 'death-screen', 'inventory-screen', 'crafting-screen', 'loading-screen'])
      this.hide(id);
  },

  setUnderwater(on) { document.getElementById('underwater-overlay').classList.toggle('hidden', !on); },

  /* dirt-block menu background, generated from our own atlas */
  applyMenuBackground() {
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(Textures.tileCanvases[TEX.dirt], 0, 0, 48, 48);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, 48, 48);
    const url = `url(${c.toDataURL()})`;
    for (const id of ['title-screen', 'pause-screen', 'loading-screen']) {
      document.getElementById(id).style.backgroundImage = url;
    }
    const d = document.createElement('canvas');
    d.width = d.height = 48;
    const dctx = d.getContext('2d');
    dctx.imageSmoothingEnabled = false;
    dctx.drawImage(Textures.tileCanvases[TEX.stone], 0, 0, 48, 48);
    dctx.fillStyle = 'rgba(40,0,0,0.45)'; dctx.fillRect(0, 0, 48, 48);
    document.getElementById('death-screen').style.backgroundImage = `url(${d.toDataURL()})`;
  },
};
