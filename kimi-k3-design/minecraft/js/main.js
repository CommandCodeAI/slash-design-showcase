/* ============================================================
   main.js — game orchestration: renderer, day/night cycle,
   input + pointer lock, block break/place, mob combat,
   particles, pickups, torch light pool, sounds, saving.
   ============================================================ */
'use strict';

/* ---------------- tiny procedural sound synth ---------------- */
const Audio = {
  ctx: null, muted: false,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, type = 'square', gain = 0.12, slideTo = null) {
    const ctx = this.ensure(); if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  },
  noise(dur, cutoff = 900, gain = 0.2) {
    const ctx = this.ensure(); if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
  },
  play(name) {
    if (this.muted) return;
    switch (name) {
      case 'break':  this.noise(0.14, 700, 0.25); break;
      case 'place':  this.tone(190, 0.06, 'square', 0.14); break;
      case 'hit':    this.tone(240, 0.08, 'triangle', 0.18, 140); break;
      case 'hurt':   this.tone(170, 0.22, 'sawtooth', 0.16, 85); break;
      case 'pickup': this.tone(660, 0.07, 'sine', 0.12, 990); break;
      case 'eat':    this.noise(0.09, 1600, 0.14); setTimeout(() => this.noise(0.09, 1300, 0.12), 110); break;
      case 'craft':  this.tone(440, 0.05, 'square', 0.1); setTimeout(() => this.tone(660, 0.06, 'square', 0.1), 70); break;
      case 'toolbreak': this.tone(330, 0.15, 'sawtooth', 0.15, 120); break;
      case 'splash': this.noise(0.2, 1200, 0.15); break;
    }
  },
};

/* ---------------- block-break particles ---------------- */
const Particles = {
  MAX: 320,
  init(scene) {
    this.pos = new Float32Array(this.MAX * 3);
    this.col = new Float32Array(this.MAX * 3);
    this.vel = new Float32Array(this.MAX * 3);
    this.life = new Float32Array(this.MAX);       // remaining seconds; 0 = dead
    this.pos.fill(-1000);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.14, vertexColors: true, sizeAttenuation: true,
    }));
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.cursor = 0;
  },
  spawn(x, y, z, hex, n = 12) {
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i++) {
      const k = this.cursor; this.cursor = (this.cursor + 1) % this.MAX;
      this.pos[k * 3] = x + (Math.random() - 0.5) * 0.6;
      this.pos[k * 3 + 1] = y + (Math.random() - 0.5) * 0.6;
      this.pos[k * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
      this.vel[k * 3] = (Math.random() - 0.5) * 3.4;
      this.vel[k * 3 + 1] = Math.random() * 4 + 1;
      this.vel[k * 3 + 2] = (Math.random() - 0.5) * 3.4;
      const shade = 0.75 + Math.random() * 0.45;
      this.col[k * 3] = c.r * shade; this.col[k * 3 + 1] = c.g * shade; this.col[k * 3 + 2] = c.b * shade;
      this.life[k] = 0.45 + Math.random() * 0.45;
    }
  },
  update(dt) {
    for (let k = 0; k < this.MAX; k++) {
      if (this.life[k] <= 0) continue;
      this.life[k] -= dt;
      if (this.life[k] <= 0) { this.pos[k * 3 + 1] = -1000; continue; }
      this.vel[k * 3 + 1] -= 14 * dt;
      this.pos[k * 3] += this.vel[k * 3] * dt;
      this.pos[k * 3 + 1] += this.vel[k * 3 + 1] * dt;
      this.pos[k * 3 + 2] += this.vel[k * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  },
};

/* ---------------- item pickups ---------------- */
const Pickups = {
  list: [],
  texCache: new Map(),
  textureFor(stack) {
    const key = stack.block !== undefined ? 'block:' + stack.block : 'item:' + stack.item;
    if (!this.texCache.has(key)) {
      const canvas = Textures.iconCanvases[key];
      if (!canvas) return null;
      const t = new THREE.CanvasTexture(canvas);
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
      this.texCache.set(key, t);
    }
    return this.texCache.get(key);
  },
  spawn(x, y, z, stack) {
    const tex = this.textureFor(stack);
    if (!tex) { Inv.addStack({ ...stack }); return; }   // fallback: straight to inventory
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.42, 0.42, 1);
    sprite.position.set(x, y, z);
    Game.scene.add(sprite);
    this.list.push({
      sprite, stack: { ...stack },
      vel: new THREE.Vector3((Math.random() - 0.5) * 2.2, 3.2, (Math.random() - 0.5) * 2.2),
      age: 0, bob: Math.random() * 6,
    });
  },
  update(dt, player) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age > 240) { Game.scene.remove(p.sprite); this.list.splice(i, 1); continue; }
      // simple physics: fall until resting on a block
      const pos = p.sprite.position;
      const below = Game.world.getBlock(Math.floor(pos.x), Math.floor(pos.y - 0.25), Math.floor(pos.z));
      const grounded = OPAQUE[below];
      if (!grounded) {
        p.vel.y -= 12 * dt;
        pos.addScaledVector(p.vel, dt);
      } else {
        p.vel.set(0, 0, 0);
        pos.y = Math.floor(pos.y - 0.25) + 1 + 0.28 + Math.sin(p.age * 2.4 + p.bob) * 0.05;
      }
      // magnet + collect
      const d = pos.distanceTo(player.pos);
      if (p.age > 0.4 && d < 2.4 && !player.dead) {
        pos.lerp(new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z), Math.min(1, 10 * dt));
        if (d < 0.85) {
          const leftover = Inv.addStack(p.stack);
          Audio.play('pickup');
          InvUI.renderAll();
          if (leftover <= 0) { Game.scene.remove(p.sprite); this.list.splice(i, 1); }
          else p.stack.count = leftover;
        }
      }
    }
  },
  clear() {
    for (const p of this.list) Game.scene.remove(p.sprite);
    this.list = [];
  },
};

/* ---------------- keyboard/mouse state ---------------- */
const Input = {
  forward: false, back: false, left: false, right: false,
  jump: false, sneak: false, sprint: false,
  breakHeld: false, placeHeld: false,
  locked: false,
};
let _lastWTime = 0;

/* ---------------- the game ---------------- */
const SAVE_KEY = 'commandcraft-save-v1';
const DAY_LENGTH = 480;               // seconds per full day/night cycle

const Game = {
  state: 'title',                     // title | loading | playing | paused | inventory | crafting | dead
  scene: null, camera: null, renderer: null,
  world: null, player: null,
  timeOfDay: 0.06,                    // 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
  sun: null, hemi: null, stars: null, sunSprite: null, moonSprite: null,
  torchLights: [],
  highlight: null, crackMesh: null,
  target: null,
  breakProgress: 0, breakTargetKey: null,
  placeRepeatTimer: 0, breakRepeatTimer: 0,
  torchTimer: 0, saveTimer: 0,
  bobPhase: 0,
  fps: 60, fpsFrames: 0, fpsTime: 0,
  expectUnlock: false,
  skyColor: new THREE.Color(),

  /* ============ boot ============ */
  init() {
    Materials.build();
    buildItemIcons();

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'gl';
    document.body.appendChild(renderer.domElement);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.scene.background = this.skyColor;
    this.scene.fog = new THREE.Fog(0x87c5f0, 40, RENDER_DIST * CHUNK * 0.92);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.08, 500);
    this.camera.rotation.order = 'YXZ';

    // lights
    this.hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a7355, 0.75);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.0);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    // torch point-light pool (assigned to nearest torches)
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PointLight(0xffa040, 0, 13, 2);
      this.scene.add(l);
      this.torchLights.push(l);
    }

    // stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const v = new THREE.Vector3().randomDirection();
      v.y = Math.abs(v.y) * 0.9 + 0.05;
      v.multiplyScalar(420);
      starPos.set([v.x, v.y, v.z], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false,
    }));
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    // sun + moon sprites
    this.sunSprite = this.makeGlowSprite('#ffd75e', '#ffecae');
    this.moonSprite = this.makeGlowSprite('#dfe6f2', '#f4f7ff');
    this.scene.add(this.sunSprite, this.moonSprite);

    // block highlight + crack overlay
    const hlGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    this.highlight = new THREE.LineSegments(hlGeo, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.65 }));
    this.highlight.visible = false;
    this.scene.add(this.highlight);
    this.crackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.004, 1.004, 1.004),
      new THREE.MeshBasicMaterial({ map: Textures.crackTextures[0], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
    );
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    Particles.init(this.scene);

    UI.init();
    UI.applyMenuBackground();
    InvUI.init();
    this.bindMenus();
    this.bindInput();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('beforeunload', () => this.saveGame());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.saveGame(); });

    // continue button if a save exists
    if (localStorage.getItem(SAVE_KEY)) UI.show('btn-continue');

    // test mode for automated screenshots: ?test [seed]
    const params = new URLSearchParams(location.search);
    if (params.has('test')) {
      this.newWorld(params.get('test') || '42', true).then(() => {
        this.player.creative = true;
        this.player.fly = true;
        this.player.pos.y += 18;
        this.player.pitch = -0.45;
        this.state = 'playing';
        UI.hideAllScreens();
        UI.show('hud');
        document.getElementById('status-bars').style.visibility = 'hidden';
      });
    }

    requestAnimationFrame(t => this.frame(t));
  },

  makeGlowSprite(base, hi) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, hi); grad.addColorStop(0.55, base); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false }));
    sprite.scale.set(46, 46, 1);
    return sprite;
  },

  /* ============ world lifecycle ============ */
  async newWorld(seedStr, creative) {
    const seed = seedStr ? seedFromString(seedStr) : (Math.random() * 0xffffffff) >>> 0;
    this.cleanupWorld();
    this.world = new World(seed);
    this.player = new Player(this.world);
    Inv.creativeMode = creative;
    Inv.giveStarter();
    this.timeOfDay = 0.06;

    const spawn = this.world.findSpawn();
    this.player.pos.set(spawn.x, spawn.y, spawn.z);
    this.player.spawnPoint.copy(this.player.pos);
    this.player.yaw = Math.PI * 0.25;

    await this.loadInitialChunks(spawn.x, spawn.z);
    InvUI.renderAll();
    UI.updateStatusBars();
  },

  async loadFromSave() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
    if (!data) return false;
    this.cleanupWorld();
    this.world = new World(data.seed);
    this.world.loadEdits(data.edits);
    this.player = new Player(this.world);
    Inv.creativeMode = data.mode === 'creative';
    Inv.giveStarter();
    Inv.deserialize(data.inv);
    this.timeOfDay = data.time !== undefined ? data.time : 0.06;
    const p = data.player;
    this.player.pos.set(p.pos[0], p.pos[1], p.pos[2]);
    this.player.yaw = p.yaw; this.player.pitch = p.pitch;
    this.player.health = p.health; this.player.hunger = p.hunger;
    this.player.spawnPoint.set(p.spawn[0], p.spawn[1], p.spawn[2]);
    await this.loadInitialChunks(p.pos[0], p.pos[2]);
    InvUI.renderAll();
    UI.updateStatusBars();
    return true;
  },

  async loadInitialChunks(x, z) {
    this.state = 'loading';
    UI.hideAllScreens();
    UI.show('loading-screen');
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-text');
    const total = (2 * RENDER_DIST + 1) ** 2;
    let done = 0;
    for (;;) {
      this.world.updateStreaming(x, z, 6);
      const pending = this.world.countPendingMeshes(x, z);
      done = total - pending;
      bar.style.width = Math.min(100, (done / total) * 100).toFixed(1) + '%';
      text.textContent = pending > 0 ? `carving chunks… ${done}/${total}` : 'lighting the sky…';
      if (pending <= 0) break;
      await new Promise(r => requestAnimationFrame(r));
    }
    bar.style.width = '100%';
  },

  cleanupWorld() {
    if (this.world) {
      for (const [, c] of this.world.chunks) c.dispose(this.scene);
      this.world = null;
    }
    Mobs.clear();
    Pickups.clear();
    for (const l of this.torchLights) l.intensity = 0;
    this.target = null;
    this.breakProgress = 0;
  },

  enterGame() {
    this.state = 'playing';
    UI.hideAllScreens();
    UI.show('hud');
    document.getElementById('status-bars').style.visibility = Inv.creativeMode ? 'hidden' : 'visible';
    this.lockPointer();
  },

  saveGame() {
    if (!this.world || !this.player || this.state === 'title' || this.state === 'loading') return;
    const p = this.player;
    const data = {
      seed: this.world.seed,
      mode: Inv.creativeMode ? 'creative' : 'survival',
      time: this.timeOfDay,
      player: {
        pos: [p.pos.x, p.pos.y, p.pos.z], yaw: p.yaw, pitch: p.pitch,
        health: p.health, hunger: p.hunger,
        spawn: [p.spawnPoint.x, p.spawnPoint.y, p.spawnPoint.z],
      },
      inv: Inv.serialize(),
      edits: this.world.serializeEdits(),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* storage full */ }
    UI.show('btn-continue');
  },

  /* ============ menus & pointer lock ============ */
  bindMenus() {
    const seedInput = document.getElementById('seed-input');
    document.getElementById('btn-survival').addEventListener('click', async () => {
      await this.newWorld(seedInput.value.trim(), false);
      this.enterGame();
    });
    document.getElementById('btn-creative').addEventListener('click', async () => {
      await this.newWorld(seedInput.value.trim(), true);
      this.enterGame();
    });
    document.getElementById('btn-continue').addEventListener('click', async () => {
      if (await this.loadFromSave()) this.enterGame();
    });
    document.getElementById('btn-resume').addEventListener('click', () => this.closeOverlay());
    document.getElementById('btn-gamemode').addEventListener('click', () => {
      this.toggleGamemode();
      document.getElementById('btn-gamemode').textContent = Inv.creativeMode ? 'Switch to survival' : 'Switch to creative';
    });
    document.getElementById('btn-save').addEventListener('click', () => {
      this.saveGame();
      document.getElementById('btn-save').textContent = 'Saved ✓';
      setTimeout(() => document.getElementById('btn-save').textContent = 'Save world', 1200);
    });
    document.getElementById('btn-quit').addEventListener('click', () => {
      this.saveGame();
      location.reload();
    });
    document.getElementById('btn-respawn').addEventListener('click', () => {
      this.player.respawn();
      Mobs.list = Mobs.list.filter(m => {   // clear nearby hostiles
        const keep = !m.def.hostile || m.pos.distanceTo(this.player.pos) > 30;
        if (!keep) this.scene.remove(m.group);
        return keep;
      });
      UI.updateStatusBars();
      this.closeOverlay();
    });
  },

  lockPointer() {
    const el = this.renderer.domElement;
    if (el.requestPointerLock) el.requestPointerLock();
  },

  closeOverlay() {
    this.state = 'playing';
    UI.hideAllScreens();
    UI.show('hud');
    this.expectUnlock = false;
    this.lockPointer();
  },

  openOverlay(id, state) {
    this.state = state;
    this.expectUnlock = true;
    if (document.pointerLockElement) document.exitPointerLock();
    UI.hideAllScreens();
    UI.show('hud');
    UI.show(id);
  },

  toggleGamemode() {
    Inv.creativeMode = !Inv.creativeMode;
    this.player.creative = Inv.creativeMode;
    this.player.fly = Inv.creativeMode;
    document.getElementById('status-bars').style.visibility = Inv.creativeMode ? 'hidden' : 'visible';
    UI.itemNamePop(Inv.creativeMode ? 'Creative mode' : 'Survival mode');
    InvUI.renderAll();
    UI.updateStatusBars();
  },

  onPlayerDeath() {
    Audio.play('hurt');
    this.openOverlay('death-screen', 'dead');
  },

  /* ============ input ============ */
  bindInput() {
    const canvas = this.renderer.domElement;

    // clicking the canvas re-acquires pointer lock if it was lost/denied
    canvas.addEventListener('click', () => {
      if (this.state === 'playing' && !Input.locked) this.lockPointer();
    });

    document.addEventListener('pointerlockchange', () => {
      Input.locked = document.pointerLockElement === canvas;
      if (!Input.locked) {
        Input.breakHeld = Input.placeHeld = false;
        UI.setMining(false);
        // ESC pressed while playing → pause menu
        if (this.state === 'playing' && !this.expectUnlock) {
          this.openOverlay('pause-screen', 'paused');
        }
        this.expectUnlock = false;
      }
    });

    document.addEventListener('mousemove', e => {
      if (Input.locked && (this.state === 'playing')) {
        this.player.lookDelta(e.movementX, e.movementY);
      }
    });

    document.addEventListener('mousedown', e => {
      if (this.state !== 'playing' || !Input.locked) return;
      if (e.button === 0) {
        Input.breakHeld = true;
        this.tryAttack();
        if (Inv.creativeMode) this.tryBreakCreative();
      } else if (e.button === 2) {
        Input.placeHeld = true;
        this.tryUse();
      }
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) { Input.breakHeld = false; this.resetBreaking(); }
      if (e.button === 2) Input.placeHeld = false;
    });
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('wheel', e => {
      if (this.state !== 'playing') return;
      const dir = e.deltaY > 0 ? 1 : -1;
      Inv.selected = (Inv.selected + dir + 9) % 9;
      this.onSelectionChange();
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (e.code === 'F3') { e.preventDefault(); if (this.state === 'playing') UI.toggleDebug(); return; }
      if (this.state === 'playing') {
        switch (e.code) {
          case 'KeyW': {
            Input.forward = true;
            const now = performance.now();
            if (now - _lastWTime < 260) Input.sprint = true;
            _lastWTime = now;
            break;
          }
          case 'KeyS': Input.back = true; break;
          case 'KeyA': Input.left = true; break;
          case 'KeyD': Input.right = true; break;
          case 'Space': Input.jump = true; e.preventDefault(); break;
          case 'ShiftLeft': case 'ShiftRight': Input.sneak = true; break;
          case 'ControlLeft': Input.sprint = true; e.preventDefault(); break;
          case 'KeyE': this.openOverlay('inventory-screen', 'inventory'); Inv.recomputeResults(); InvUI.renderAll(); break;
          case 'KeyG': this.toggleGamemode(); break;
          case 'KeyM': Audio.muted = !Audio.muted; UI.itemNamePop(Audio.muted ? 'Sound off' : 'Sound on'); break;
          default:
            if (/^Digit[1-9]$/.test(e.code)) {
              Inv.selected = +e.code.slice(5) - 1;
              this.onSelectionChange();
            }
        }
      } else if (this.state === 'inventory' || this.state === 'crafting') {
        if (e.code === 'KeyE' || e.code === 'Escape') {
          Inv.dumpCraftGrids();
          Inv.held = Inv.held && (Inv.addStack(Inv.held), null);
          InvUI.renderAll();
          this.closeOverlay();
        }
      } else if (this.state === 'paused' && e.code === 'Escape') {
        this.closeOverlay();
      }
    });
    document.addEventListener('keyup', e => {
      switch (e.code) {
        case 'KeyW': Input.forward = false; Input.sprint = false; break;
        case 'KeyS': Input.back = false; break;
        case 'KeyA': Input.left = false; break;
        case 'KeyD': Input.right = false; break;
        case 'Space': Input.jump = false; break;
        case 'ShiftLeft': case 'ShiftRight': Input.sneak = false; break;
        case 'ControlLeft': Input.sprint = false; break;
      }
    });
  },

  onSelectionChange() {
    InvUI.renderAll();
    const s = Inv.selectedStack();
    UI.itemNamePop(s ? stackName(s) : '');
  },

  /* ============ block interaction ============ */
  updateTarget() {
    const eye = this.player.eyePos(new THREE.Vector3());
    const dir = this.player.lookDir(new THREE.Vector3());
    const reach = Inv.creativeMode ? 6 : 5;
    this.target = this.world.raycast(eye, dir, reach);
    if (this.target) {
      this.highlight.visible = true;
      this.highlight.position.set(this.target.x + 0.5, this.target.y + 0.5, this.target.z + 0.5);
    } else {
      this.highlight.visible = false;
    }
  },

  resetBreaking() {
    this.breakProgress = 0;
    this.breakTargetKey = null;
    this.crackMesh.visible = false;
    UI.setMining(false);
  },

  tryBreakCreative() {
    const t = this.target;
    if (!t) return;
    const b = BLOCKS[t.id];
    if (!b || b.hardness < 0) return;
    this.breakBlock(t.x, t.y, t.z, t.id);
  },

  breakBlock(x, y, z, id) {
    const held = Inv.selectedStack();
    const b = BLOCKS[id];
    this.world.setBlock(x, y, z, BLOCK_ID.AIR);
    Audio.play('break');
    // particles in the block's color (sampled from its texture)
    const cvs = Textures.tileCanvases[b.tex.side];
    const px = cvs.getContext('2d').getImageData(8, 8, 1, 1).data;
    this.spawnParticles(x + 0.5, y + 0.5, z + 0.5, (px[0] << 16) | (px[1] << 8) | px[2], 14);

    if (!Inv.creativeMode) {
      // drops
      if (canHarvest(id, held)) {
        const drop = b.drop !== undefined ? b.drop : id;
        if (drop !== null) {
          const stack = typeof drop === 'string' ? { item: drop, count: 1 } : { block: drop, count: 1 };
          this.spawnPickup(x + 0.5, y + 0.5, z + 0.5, stack);
        }
        if (id === BLOCK_ID.LEAVES && Math.random() < 0.05) {
          this.spawnPickup(x + 0.5, y + 0.5, z + 0.5, { item: 'apple', count: 1 });
        }
      }
      // tool wear
      const tool = heldToolDef(held);
      if (tool && b.hardness > 0 && b.tool === tool.tool) {
        held.durability--;
        if (held.durability <= 0) {
          Inv.hotbar[Inv.selected] = null;
          Audio.play('toolbreak');
        }
        InvUI.renderAll();
      }
    }
  },

  tryUse() {
    // right click: open crafting table / eat / place block
    const held = Inv.selectedStack();
    const t = this.target;
    if (t && t.id === BLOCK_ID.CRAFTING_TABLE && !Input.sneak) {
      this.openOverlay('crafting-screen', 'crafting');
      Inv.recomputeResults(); InvUI.renderAll();
      return;
    }
    if (!held) return;
    if (held.item !== undefined && ITEMS[held.item] && ITEMS[held.item].food) {
      if (this.player.eat(held)) {
        if (held.count <= 0) Inv.hotbar[Inv.selected] = null;
        InvUI.renderAll();
      }
      return;
    }
    if (held.block === undefined) return;
    this.tryPlace();
  },

  tryPlace() {
    const held = Inv.selectedStack();
    const t = this.target;
    if (!held || held.block === undefined || !t) return;
    const px = t.x + t.nx, py = t.y + t.ny, pz = t.z + t.nz;
    const existing = this.world.getBlock(px, py, pz);
    if (existing !== BLOCK_ID.AIR && existing !== BLOCK_ID.WATER) return;

    const placeDef = BLOCKS[held.block];
    // torches only stand on solid block tops
    if (held.block === BLOCK_ID.TORCH) {
      if (t.ny !== 1 || !OPAQUE[t.id]) return;
    }
    // don't place solid blocks inside the player's body
    if (placeDef.solid) {
      const p = this.player;
      const overlap =
        px + 1 > p.pos.x - p.halfW && px < p.pos.x + p.halfW &&
        pz + 1 > p.pos.z - p.halfW && pz < p.pos.z + p.halfW &&
        py + 1 > p.pos.y && py < p.pos.y + p.height;
      if (overlap) return;
    }
    this.world.setBlock(px, py, pz, held.block);
    Audio.play('place');
    UI.swingHand();
    if (!Inv.creativeMode) {
      if (--held.count <= 0) Inv.hotbar[Inv.selected] = null;
      InvUI.renderAll();
    }
  },

  tryAttack() {
    // ray vs mobs first (closer than the targeted block)
    const eye = this.player.eyePos(new THREE.Vector3());
    const dir = this.player.lookDir(new THREE.Vector3());
    const mobHit = Mobs.raycast(eye, dir, 3.6);
    if (!mobHit) return;
    if (this.target && this.target.dist < mobHit.dist) return;
    if (this.player.attackCooldown > 0) return;
    this.player.attackCooldown = 0.45;
    const held = Inv.selectedStack();
    const tool = heldToolDef(held);
    const dmg = tool ? tool.damage : 1;
    mobHit.mob.hurt(dmg, this.player.pos);
    UI.swingHand();
    if (tool && !Inv.creativeMode) {
      held.durability--;
      if (held.durability <= 0) { Inv.hotbar[Inv.selected] = null; Audio.play('toolbreak'); }
      InvUI.renderAll();
    }
  },

  spawnPickup(x, y, z, stack) { Pickups.spawn(x, y, z, stack); },
  spawnParticles(x, y, z, color, n) { Particles.spawn(x, y, z, color, n); },
  isNight() {
    const sunH = Math.sin(this.timeOfDay * Math.PI * 2);
    return sunH < -0.06;
  },

  /* ============ per-frame ============ */
  frame(t) {
    requestAnimationFrame(tt => this.frame(tt));
    const now = t * 0.001;
    let dt = Math.min(0.1, now - (this._last || now));
    this._last = now;

    // fps counter
    this.fpsFrames++; this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0; this.fpsTime = 0;
      UI.setFPS(this.fps + ' fps');
    }

    if (this.state === 'playing' || this.state === 'paused' || this.state === 'inventory' || this.state === 'crafting' || this.state === 'dead') {
      this.tick(dt);
    }
    this.renderer.render(this.scene, this.camera);
  },

  tick(dt) {
    const playing = this.state === 'playing';

    // day/night cycle
    this.timeOfDay = (this.timeOfDay + dt / DAY_LENGTH) % 1;
    this.updateSky();

    // fixed-step physics
    this._acc = (this._acc || 0) + dt;
    const step = 1 / 60;
    let n = 0;
    while (this._acc >= step && n++ < 4) {
      this._acc -= step;
      if (playing) {
        this.player.update(step, Input);
        Mobs.update(step, this.world, this.player, this.isNight());
      }
    }
    this.world.tickGravity(dt);

    // chunk streaming around the player
    if (playing) this.world.updateStreaming(this.player.pos.x, this.player.pos.z, 2);

    // camera
    const p = this.player;
    this.camera.position.set(p.pos.x, p.pos.y + p.eye, p.pos.z);
    // walk bob
    const hSpeed = Math.hypot(p.vel.x, p.vel.z);
    if (p.onGround && hSpeed > 0.5 && !p.fly) {
      this.bobPhase += hSpeed * dt * 1.6;
      this.camera.position.y += Math.sin(this.bobPhase * 2) * 0.045;
    }
    this.camera.rotation.set(p.pitch, p.yaw, 0);
    // sprint FOV kick
    const wantFov = p.sprinting && hSpeed > 4 ? 83 : 75;
    if (Math.abs(this.camera.fov - wantFov) > 0.1) {
      this.camera.fov += (wantFov - this.camera.fov) * Math.min(1, 8 * dt);
      this.camera.updateProjectionMatrix();
    }

    // underwater treatment
    const eyeBlock = this.world.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + p.eye), Math.floor(p.pos.z));
    const under = eyeBlock === BLOCK_ID.WATER;
    UI.setUnderwater(under);
    if (under) {
      this.scene.fog.near = 1; this.scene.fog.far = 22;
      this.skyColor.setHex(0x1a3c8f);
    }

    // interactions
    if (playing) {
      this.updateTarget();
      this.updateBreaking(dt);
      // hold-to-place repeat
      if (Input.placeHeld) {
        this.placeRepeatTimer -= dt;
        if (this.placeRepeatTimer <= 0) { this.placeRepeatTimer = 0.25; this.tryUse(); }
      } else this.placeRepeatTimer = 0;
      // creative hold-to-break repeat
      if (Input.breakHeld && Inv.creativeMode) {
        this.breakRepeatTimer -= dt;
        if (this.breakRepeatTimer <= 0) { this.breakRepeatTimer = 0.22; this.tryBreakCreative(); }
      }
    }

    // torch light pool
    this.torchTimer -= dt;
    if (this.torchTimer <= 0) {
      this.torchTimer = 0.25;
      const torches = this.world.torchesNear(p.pos.x, p.pos.z, 22);
      for (let i = 0; i < this.torchLights.length; i++) {
        const l = this.torchLights[i];
        if (i < torches.length) {
          l.position.set(torches[i][0], torches[i][1], torches[i][2]);
          l.intensity = 1.35;
        } else l.intensity = 0;
      }
    }

    Particles.update(dt);
    Pickups.update(dt, p);

    // autosave
    this.saveTimer += dt;
    if (this.saveTimer > 30) { this.saveTimer = 0; this.saveGame(); }

    // debug overlay
    if (UI.debugVisible) {
      const b = this.target ? BLOCKS[this.target.id].name : '—';
      UI.setDebug(
        `CommandCraft beta 1.0 (${this.fps} fps)\n` +
        `XYZ: ${p.pos.x.toFixed(1)} / ${p.pos.y.toFixed(1)} / ${p.pos.z.toFixed(1)}\n` +
        `Chunk: ${Math.floor(p.pos.x / 16)}, ${Math.floor(p.pos.z / 16)}\n` +
        `Biome: ${this.world.biomeAt(Math.floor(p.pos.x), Math.floor(p.pos.z))}\n` +
        `Looking at: ${b}\n` +
        `Chunks: ${this.world.chunks.size}  Mobs: ${Mobs.list.length}  Drops: ${Pickups.list.length}\n` +
        `Seed: ${this.world.seed}  Time: ${(this.timeOfDay * 24).toFixed(1)}h  Mode: ${Inv.creativeMode ? 'creative' : 'survival'}`
      );
    }
  },

  updateBreaking(dt) {
    if (!Input.breakHeld || Inv.creativeMode || !this.target) {
      if (!Input.breakHeld) this.resetBreaking();
      else this.crackMesh.visible = false;
      return;
    }
    const t = this.target;
    const key = t.x + ',' + t.y + ',' + t.z;
    if (key !== this.breakTargetKey) {
      this.breakTargetKey = key;
      this.breakProgress = 0;
    }
    const held = Inv.selectedStack();
    const time = breakTime(t.id, held);
    if (!isFinite(time)) { this.crackMesh.visible = false; return; }
    this.breakProgress += dt / Math.max(0.05, time);
    UI.setMining(true);
    const stage = Math.min(4, Math.floor(this.breakProgress * 5));
    this.crackMesh.visible = true;
    this.crackMesh.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
    this.crackMesh.material.map = Textures.crackTextures[stage];
    if (this.breakProgress >= 1) {
      this.breakBlock(t.x, t.y, t.z, t.id);
      this.resetBreaking();
    }
  },

  updateSky() {
    if (!this.scene) return;
    const ang = this.timeOfDay * Math.PI * 2;
    const sunH = Math.sin(ang);                        // 1 = noon, -1 = midnight
    const day = smoothstep(-0.09, 0.22, sunH);
    const dusk = Math.exp(-(((sunH) / 0.16) ** 2));

    const night = new THREE.Color(0x0a0e1c);
    const dayC = new THREE.Color(0x87c5f0);
    const duskC = new THREE.Color(0xe8935c);
    this.skyColor.copy(night).lerp(dayC, day);
    this.skyColor.lerp(duskC, dusk * 0.55);

    const eyeBlock = this.world && this.player ?
      this.world.getBlock(Math.floor(this.player.pos.x), Math.floor(this.player.pos.y + this.player.eye), Math.floor(this.player.pos.z)) : BLOCK_ID.AIR;
    if (eyeBlock !== BLOCK_ID.WATER) {
      this.scene.fog.color.copy(this.skyColor);
      const baseFar = RENDER_DIST * CHUNK * 0.92;
      this.scene.fog.near = 30;
      this.scene.fog.far = baseFar * (0.55 + 0.45 * day);
    }

    // sun / moon positions around the camera
    const cam = this.camera.position;
    const sunDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0.25).normalize();
    this.sun.position.copy(cam).addScaledVector(sunDir, 120);
    this.sun.target.position.copy(cam);
    this.sun.intensity = 0.1 + 0.8 * day;
    this.sun.color.setHex(day > 0.5 ? 0xfff2d8 : (dusk > 0.3 ? 0xffc28a : 0xb8c8ff));
    this.hemi.intensity = 0.24 + 0.4 * day;

    this.sunSprite.position.copy(cam).addScaledVector(sunDir, 400);
    this.moonSprite.position.copy(cam).addScaledVector(sunDir, -400);
    this.stars.material.opacity = Math.max(0, 1 - day * 1.6) * 0.9;
    this.stars.position.copy(cam);
  },
};

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* helper: dataURL → canvas (for pickup sprite textures) */
function canvasFromURL(url) {
  const img = new Image();
  img.src = url;
  const c = document.createElement('canvas');
  // icons are 40px iso renders or 16px pixel art — decode size lazily
  c.width = 40; c.height = 40;
  img.onload = () => {
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
  };
  return c;
}

/* boot */
window.addEventListener('DOMContentLoaded', () => Game.init());
window.Game = Game;   // exposed for debugging / extension
