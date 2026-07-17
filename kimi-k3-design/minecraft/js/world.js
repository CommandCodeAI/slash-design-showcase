/* ============================================================
   world.js — chunk storage, procedural terrain, meshing
   (face culling + per-vertex ambient occlusion), sand/gravel
   gravity, voxel raycasting, chunk streaming, save edits.
   ============================================================ */
'use strict';

const CHUNK = 16;                 // chunk footprint (16 x 16)
const WORLD_H = 128;              // world height in blocks
const WATER_Y = 22;               // sea level
const RENDER_DIST = 6;            // chunk render radius

// Face table (from the classic three.js voxel-geometry article).
// Corners wind counter-clockwise seen from outside; uv maps into the atlas.
const FACES = [
  { dir: [-1, 0, 0], shade: 0.6, tex: 'side', corners: [
    { pos: [0, 1, 0], uv: [0, 1] }, { pos: [0, 0, 0], uv: [0, 0] },
    { pos: [0, 1, 1], uv: [1, 1] }, { pos: [0, 0, 1], uv: [1, 0] } ] },
  { dir: [1, 0, 0], shade: 0.6, tex: 'side', corners: [
    { pos: [1, 1, 1], uv: [0, 1] }, { pos: [1, 0, 1], uv: [0, 0] },
    { pos: [1, 1, 0], uv: [1, 1] }, { pos: [1, 0, 0], uv: [1, 0] } ] },
  { dir: [0, -1, 0], shade: 0.5, tex: 'bottom', corners: [
    { pos: [1, 0, 1], uv: [1, 0] }, { pos: [0, 0, 1], uv: [0, 0] },
    { pos: [1, 0, 0], uv: [1, 1] }, { pos: [0, 0, 0], uv: [0, 1] } ] },
  { dir: [0, 1, 0], shade: 1.0, tex: 'top', corners: [
    { pos: [0, 1, 1], uv: [1, 1] }, { pos: [1, 1, 1], uv: [0, 1] },
    { pos: [0, 1, 0], uv: [1, 0] }, { pos: [1, 1, 0], uv: [0, 0] } ] },
  { dir: [0, 0, -1], shade: 0.8, tex: 'side', corners: [
    { pos: [1, 0, 0], uv: [0, 0] }, { pos: [0, 0, 0], uv: [1, 0] },
    { pos: [1, 1, 0], uv: [0, 1] }, { pos: [0, 1, 0], uv: [1, 1] } ] },
  { dir: [0, 0, 1], shade: 0.8, tex: 'side', corners: [
    { pos: [0, 0, 1], uv: [0, 0] }, { pos: [1, 0, 1], uv: [1, 0] },
    { pos: [0, 1, 1], uv: [0, 1] }, { pos: [1, 1, 1], uv: [1, 1] } ] },
];
// AO brightness per level 0..3
const AO_CURVE = [0.45, 0.62, 0.81, 1.0];

// Does this block fully block light/vision for culling + AO?
const OPAQUE = [];
function isOpaqueCube(id) {
  if (id === BLOCK_ID.AIR) return false;
  const b = BLOCKS[id];
  if (!b || b.transparent || b.customMesh || b.liquid) return false;
  return true;
}
for (let i = 0; i < 256; i++) OPAQUE[i] = isOpaqueCube(i);

function chunkKey(cx, cz) { return cx + ',' + cz; }
function blockIndex(lx, y, lz) { return (y << 8) | (lz << 4) | lx; }
function sstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* ============================================================
   Chunk
   ============================================================ */
class Chunk {
  constructor(cx, cz) {
    this.cx = cx; this.cz = cz;
    this.data = new Uint8Array(CHUNK * CHUNK * WORLD_H);
    this.heightMap = new Int16Array(CHUNK * CHUNK);
    this.modified = new Set();          // indices changed by the player
    this.torches = new Set();           // indices of placed torches
    this.opaqueMesh = null;
    this.waterMesh = null;
    this.hasData = false;
    this.meshDirty = false;
  }
  get(lx, y, lz) { return this.data[blockIndex(lx, y, lz)]; }
  set(lx, y, lz, id) { this.data[blockIndex(lx, y, lz)] = id; }
  dispose(scene) {
    for (const m of [this.opaqueMesh, this.waterMesh]) {
      if (m) { scene.remove(m); m.geometry.dispose(); }
    }
    this.opaqueMesh = this.waterMesh = null;
  }
}

/* ============================================================
   World
   ============================================================ */
class World {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.heightNoise = new Perlin(this.seed);
    this.hillNoise = new Perlin(this.seed ^ 0x9e3779b9);
    this.tempNoise = new Perlin(this.seed ^ 0x3c6ef372);
    this.moistNoise = new Perlin(this.seed ^ 0xdaa66d2b);
    this.chunks = new Map();            // "cx,cz" → Chunk
    this.edits = new Map();             // "cx,cz" → Map(idx → id) for unloaded chunks
    this.gravityQueue = [];             // [x,y,z] positions to check for falls
    this.gravityTimer = 0;
  }

  /* ---------- terrain shape ---------- */
  biomeAt(x, z) {
    const temp = this.tempNoise.fbm(x * 0.0016, z * 0.0016, 3);
    const moist = this.moistNoise.fbm(x * 0.0016 + 400, z * 0.0016 + 400, 3);
    const hill = this.hillNoise.fbm(x * 0.0021 + 900, z * 0.0021 + 900, 3);
    if (temp > 0.42 && moist < 0.05) return 'desert';
    if (hill > 0.28) return 'hills';
    if (moist > 0.12) return 'forest';
    return 'plains';
  }
  heightAt(x, z) {
    const continent = this.heightNoise.fbm(x * 0.0032, z * 0.0032, 4);
    const detail = this.heightNoise.fbm(x * 0.008 + 30, z * 0.008 + 30, 3);
    // hills blend in smoothly via a mask — no discontinuities at biome borders
    const hillBase = this.hillNoise.fbm(x * 0.0021 + 900, z * 0.0021 + 900, 3);
    const hillsMask = sstep(0.2, 0.48, hillBase);
    const mountain = this.hillNoise.fbm(x * 0.013, z * 0.013, 4);
    let h = 31 + continent * 8 + detail * 2.1 + hillsMask * (9 + mountain * 15);
    // blend smoothly toward ocean floor below sea level (lakes with gentle shores)
    const ocean = sstep(-0.32, -0.72, continent);
    if (ocean > 0) h = h * (1 - ocean) + (13 + continent * 6) * ocean;
    return Math.max(4, Math.min(WORLD_H - 30, Math.round(h)));
  }

  /* ---------- block access ---------- */
  getBlock(x, y, z) {
    if (y < 0) return BLOCK_ID.BEDROCK;
    if (y >= WORLD_H) return BLOCK_ID.AIR;
    const c = this.chunks.get(chunkKey(x >> 4, z >> 4));
    if (!c || !c.hasData) return BLOCK_ID.AIR;
    return c.get(x & 15, y, z & 15);
  }
  setBlock(x, y, z, id, byPlayer = true) {
    if (y < 0 || y >= WORLD_H) return false;
    const cx = x >> 4, cz = z >> 4;
    const c = this.chunks.get(chunkKey(cx, cz));
    if (!c || !c.hasData) return false;
    const lx = x & 15, lz = z & 15;
    const idx = blockIndex(lx, y, lz);
    const old = c.data[idx];
    if (old === id) return false;
    c.data[idx] = id;
    if (byPlayer) c.modified.add(idx);
    // torch registry
    if (id === BLOCK_ID.TORCH) c.torches.add(idx); else c.torches.delete(idx);
    // remesh this chunk immediately, neighbors if the edit is on a border
    this.rebuildChunkMesh(c);
    const nbs = [];
    if (lx === 0) nbs.push([cx - 1, cz]);
    if (lx === 15) nbs.push([cx + 1, cz]);
    if (lz === 0) nbs.push([cx, cz - 1]);
    if (lz === 15) nbs.push([cx, cz + 1]);
    if (lx === 0 && lz === 0) nbs.push([cx - 1, cz - 1]);
    if (lx === 15 && lz === 0) nbs.push([cx + 1, cz - 1]);
    if (lx === 0 && lz === 15) nbs.push([cx - 1, cz + 1]);
    if (lx === 15 && lz === 15) nbs.push([cx + 1, cz + 1]);
    for (const [nx, nz] of nbs) {
      const nc = this.chunks.get(chunkKey(nx, nz));
      if (nc && nc.opaqueMesh) this.rebuildChunkMesh(nc);
    }
    // gravity: block above may fall, this spot may receive falls
    this.gravityQueue.push([x, y + 1, z], [x, y, z]);
    // torch support check: torches above a removed block pop off
    if (old !== BLOCK_ID.AIR && this.getBlock(x, y + 1, z) === BLOCK_ID.TORCH && !OPAQUE[id]) {
      this.setBlock(x, y + 1, z, BLOCK_ID.AIR);
      if (typeof Game !== 'undefined') Game.spawnPickup(x, y + 1, z, { block: BLOCK_ID.TORCH, count: 1 });
    }
    return true;
  }

  /* ---------- terrain generation ---------- */
  generateChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    let c = this.chunks.get(key);
    if (!c) { c = new Chunk(cx, cz); this.chunks.set(key, c); }
    if (c.hasData) return c;
    const seed = this.seed;
    const baseX = cx * CHUNK, baseZ = cz * CHUNK;

    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = baseX + lx, wz = baseZ + lz;
      const h = this.heightAt(wx, wz);
      const biome = this.biomeAt(wx, wz);
      c.heightMap[lz * CHUNK + lx] = Math.max(h, WATER_Y);

      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0 || (y === 1 && hashCoords(wx, y, wz, seed ^ 11) < 0.5)) {
          id = BLOCK_ID.BEDROCK;
        } else if (y >= h - 3 && y < h) {
          id = (biome === 'desert' || h <= WATER_Y + 1) ? BLOCK_ID.SAND : BLOCK_ID.DIRT;
        } else if (y === h) {
          if (biome === 'desert' || h <= WATER_Y + 1) {
            id = BLOCK_ID.SAND;
          } else {
            id = BLOCK_ID.GRASS;
          }
          // gravel patches along shores and lakebeds
          if (h <= WATER_Y + 2 && hashCoords(wx, 5, wz, seed ^ 23) < 0.18) id = BLOCK_ID.GRAVEL;
        } else {
          id = BLOCK_ID.STONE;
          // ores, rarer with depth — deterministic hashes per ore type
          if (y < 70 && hashCoords(wx, y, wz, seed ^ 101) < 0.010) id = BLOCK_ID.COAL_ORE;
          else if (y < 36 && hashCoords(wx, y, wz, seed ^ 102) < 0.006) id = BLOCK_ID.IRON_ORE;
          else if (y < 18 && hashCoords(wx, y, wz, seed ^ 103) < 0.0022) id = BLOCK_ID.GOLD_ORE;
          else if (y < 14 && hashCoords(wx, y, wz, seed ^ 104) < 0.0022) id = BLOCK_ID.DIAMOND_ORE;
        }
        c.set(lx, y, lz, id);
      }
      for (let y = h + 1; y <= WATER_Y; y++) c.set(lx, y, lz, BLOCK_ID.WATER);
    }

    // Trees — candidates scanned in a 2-block halo so canopies that
    // overhang from neighbor chunks get stamped here too.
    for (let wz = baseZ - 2; wz < baseZ + CHUNK + 2; wz++) {
      for (let wx = baseX - 2; wx < baseX + CHUNK + 2; wx++) {
        const biome = this.biomeAt(wx, wz);
        const density = biome === 'forest' ? 0.02 : biome === 'plains' ? 0.0022 : biome === 'hills' ? 0.006 : 0;
        if (density === 0) continue;
        const r = hashCoords(wx, 77, wz, seed ^ 55);
        if (r >= density) continue;
        const h = this.heightAt(wx, wz);
        if (h <= WATER_Y + 1) continue;
        this.stampTree(c, wx - baseX, h, wz - baseZ, wx, wz);
      }
    }

    // re-apply saved player edits
    const saved = this.edits.get(key);
    if (saved) {
      for (const [idx, id] of saved) {
        c.data[idx] = id;
        if (id === BLOCK_ID.TORCH) c.torches.add(idx);
      }
    }
    c.hasData = true;
    return c;
  }

  stampTree(chunk, lx, groundY, lz, wx, wz) {
    const seed = this.seed;
    const trunkH = 4 + ((hashCoords(wx, 1, wz, seed ^ 61) * 3) | 0);
    const top = groundY + trunkH;
    // leaf canopy: two wide layers + two narrow layers
    for (let dy = -2; dy <= 1; dy++) {
      const y = top + dy;
      if (y < 0 || y >= WORLD_H) continue;
      const rad = dy <= -1 ? 2 : 1;
      for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
        if (dx === 0 && dz === 0 && dy <= 0) continue;               // trunk passes through
        if (Math.abs(dx) === rad && Math.abs(dz) === rad) {
          if (dy >= 0 || hashCoords(wx + dx, y, wz + dz, seed ^ 62) < 0.6) continue;  // trim corners
        }
        const tx = lx + dx, tz = lz + dz;
        if (tx < 0 || tx >= CHUNK || tz < 0 || tz >= CHUNK) continue;
        if (chunk.get(tx, y, tz) === BLOCK_ID.AIR) chunk.set(tx, y, tz, BLOCK_ID.LEAVES);
      }
    }
    if (lx >= 0 && lx < CHUNK && lz >= 0 && lz < CHUNK) {
      for (let y = groundY + 1; y <= top; y++) {
        if (y < WORLD_H) chunk.set(lx, y, lz, BLOCK_ID.LOG);
      }
    }
  }

  /* ---------- meshing ---------- */
  rebuildChunkMesh(chunk) {
    if (!chunk.hasData) return;
    const opaque = { pos: [], nrm: [], uv: [], col: [], idx: [] };
    const water = { pos: [], nrm: [], uv: [], col: [], idx: [] };
    const baseX = chunk.cx * CHUNK, baseZ = chunk.cz * CHUNK;

    for (let y = 0; y < WORLD_H; y++) {
      for (let lz = 0; lz < CHUNK; lz++) {
        for (let lx = 0; lx < CHUNK; lx++) {
          const id = chunk.data[blockIndex(lx, y, lz)];
          if (id === BLOCK_ID.AIR) continue;
          const wx = baseX + lx, wz = baseZ + lz;
          const b = BLOCKS[id];

          if (b.customMesh === 'torch') { this.emitTorch(opaque, wx, y, wz); continue; }

          const isWater = id === BLOCK_ID.WATER;
          const out = isWater ? water : opaque;

          for (const face of FACES) {
            const nx = wx + face.dir[0], ny = y + face.dir[1], nz = wz + face.dir[2];
            const nid = this.getBlock(nx, ny, nz);
            // face culling
            if (isWater) {
              if (nid === BLOCK_ID.WATER || OPAQUE[nid]) continue;
            } else {
              if (OPAQUE[nid]) continue;
              if (nid === id) continue;                              // leaves/glass self-cull
            }
            this.emitFace(out, id, face, wx, y, wz, isWater);
          }
        }
      }
    }

    this.swapMesh(chunk, 'opaqueMesh', opaque, Materials.opaque);
    this.swapMesh(chunk, 'waterMesh', water, Materials.water);
    chunk.meshed = true;
  }

  emitFace(out, id, face, wx, y, wz, isWater) {
    const b = BLOCKS[id];
    let texIdx;
    if (face.tex === 'top') texIdx = b.tex.top;
    else if (face.tex === 'bottom') texIdx = b.tex.bottom;
    else texIdx = face.dir[2] !== 0 ? b.tex.front : b.tex.side;   // crafting table front on ±z
    const [u0, v0, u1, v1] = tileUV(texIdx);
    const ndx = out.pos.length / 3;

    // water surface sits 1/8 lower unless more water above
    let yOff = 0;
    if (isWater && face.dir[1] === 1 && this.getBlock(wx, y + 1, wz) !== BLOCK_ID.WATER) yOff = -0.125;

    // tangent axes for AO (the two axes the normal doesn't use)
    const nAxis = face.dir[0] !== 0 ? 0 : face.dir[1] !== 0 ? 1 : 2;
    const t1 = (nAxis + 1) % 3, t2 = (nAxis + 2) % 3;
    const aos = [];

    for (const c of face.corners) {
      const px = wx + c.pos[0], py = y + c.pos[1] + (c.pos[1] === 1 ? yOff : 0), pz = wz + c.pos[2];
      out.pos.push(px, py, pz);
      out.nrm.push(face.dir[0], face.dir[1], face.dir[2]);
      out.uv.push(u0 + (u1 - u0) * c.uv[0], v0 + (v1 - v0) * c.uv[1]);

      // ambient occlusion from the 3 blocks touching this vertex
      let ao = 3;
      if (!isWater) {
        const nbx = wx + face.dir[0], nby = y + face.dir[1], nbz = wz + face.dir[2];
        const s1 = [0, 0, 0], s2 = [0, 0, 0];
        s1[t1] = c.pos[t1] === 1 ? 1 : -1;
        s2[t2] = c.pos[t2] === 1 ? 1 : -1;
        const occ = (ox, oy, oz) => OPAQUE[this.getBlock(nbx + ox, nby + oy, nbz + oz)] ? 1 : 0;
        const side1 = occ(s1[0], s1[1], s1[2]);
        const side2 = occ(s2[0], s2[1], s2[2]);
        const corner = occ(s1[0] + s2[0], s1[1] + s2[1], s1[2] + s2[2]);
        ao = (side1 && side2) ? 0 : 3 - (side1 + side2 + corner);
      }
      aos.push(ao);
      const light = face.shade * AO_CURVE[ao];
      out.col.push(light, light, light);
    }

    // flip the quad diagonal to avoid AO interpolation artifacts
    if (aos[0] + aos[3] > aos[1] + aos[2]) {
      out.idx.push(ndx + 1, ndx + 2, ndx, ndx + 1, ndx + 3, ndx + 2);
    } else {
      out.idx.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
    }
  }

  emitTorch(out, wx, y, wz) {
    // a slim box (7/16..9/16 wide, 10/16 tall) textured with the torch tile
    const [u0, v0, u1, v1] = tileUV(TEX.torch);
    const x0 = wx + 0.4375, x1 = wx + 0.5625;
    const z0 = wz + 0.4375, z1 = wz + 0.5625;
    const y0 = y, y1 = y + 0.625;
    const quads = [
      { n: [1, 0, 0], v: [[x1, y1, z1], [x1, y0, z1], [x1, y1, z0], [x1, y0, z0]] },
      { n: [-1, 0, 0], v: [[x0, y1, z0], [x0, y0, z0], [x0, y1, z1], [x0, y0, z1]] },
      { n: [0, 0, 1], v: [[x0, y1, z1], [x0, y0, z1], [x1, y1, z1], [x1, y0, z1]] },
      { n: [0, 0, -1], v: [[x1, y1, z0], [x1, y0, z0], [x0, y1, z0], [x0, y0, z0]] },
      { n: [0, 1, 0], v: [[x0, y1, z0], [x1, y1, z0], [x0, y1, z1], [x1, y1, z1]] },
    ];
    for (const q of quads) {
      const ndx = out.pos.length / 3;
      const uvs = [[0, 1], [0, 0], [1, 1], [1, 0]];
      for (let i = 0; i < 4; i++) {
        out.pos.push(q.v[i][0], q.v[i][1], q.v[i][2]);
        out.nrm.push(q.n[0], q.n[1], q.n[2]);
        out.uv.push(u0 + (u1 - u0) * uvs[i][0], v0 + (v1 - v0) * uvs[i][1]);
        out.col.push(1, 1, 1);
      }
      out.idx.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
    }
  }

  swapMesh(chunk, slot, geom, material) {
    const old = chunk[slot];
    if (old) { Game.scene.remove(old); old.geometry.dispose(); chunk[slot] = null; }
    if (geom.idx.length === 0) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(geom.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(geom.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(geom.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(geom.col, 3));
    g.setIndex(geom.idx);
    const mesh = new THREE.Mesh(g, material);
    mesh.matrixAutoUpdate = false;
    chunk[slot] = mesh;
    Game.scene.add(mesh);
  }

  /* ---------- sand / gravel gravity ---------- */
  tickGravity(dt) {
    this.gravityTimer += dt;
    if (this.gravityTimer < 0.12 || this.gravityQueue.length === 0) return;
    this.gravityTimer = 0;
    const queue = this.gravityQueue.splice(0, this.gravityQueue.length);
    let processed = 0;
    for (const [x, y, z] of queue) {
      if (processed++ > 96) { this.gravityQueue.push([x, y, z]); continue; }
      const id = this.getBlock(x, y, z);
      if (id === BLOCK_ID.AIR) continue;
      const b = BLOCKS[id];
      if (!b || !b.gravity) continue;
      const below = this.getBlock(x, y - 1, z);
      if (below === BLOCK_ID.AIR || below === BLOCK_ID.WATER) {
        this.setBlock(x, y, z, below === BLOCK_ID.WATER ? BLOCK_ID.WATER : BLOCK_ID.AIR, false);
        this.setBlock(x, y - 1, z, id, false);
        this.gravityQueue.push([x, y - 1, z]);
      }
    }
  }

  /* ---------- voxel raycast (Amanatides & Woo DDA) ---------- */
  raycast(origin, dir, maxDist) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = dir.x > 0 ? 1 : -1, stepY = dir.y > 0 ? 1 : -1, stepZ = dir.z > 0 ? 1 : -1;
    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;
    const fx = origin.x - x, fy = origin.y - y, fz = origin.z - z;
    let tMaxX = dir.x !== 0 ? (dir.x > 0 ? 1 - fx : fx) * tDeltaX : Infinity;
    let tMaxY = dir.y !== 0 ? (dir.y > 0 ? 1 - fy : fy) * tDeltaY : Infinity;
    let tMaxZ = dir.z !== 0 ? (dir.z > 0 ? 1 - fz : fz) * tDeltaZ : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;

    for (let i = 0; i < 256; i++) {
      const id = this.getBlock(x, y, z);
      if (id !== BLOCK_ID.AIR && id !== BLOCK_ID.WATER) {
        return { x, y, z, nx, ny, nz, id, dist: t };
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0;
      } else if (tMaxY < tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0;
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ;
      }
      if (t > maxDist) return null;
    }
    return null;
  }

  /* ---------- chunk streaming around the player ---------- */
  updateStreaming(px, pz, meshBudget = 2) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    // 1) ensure data exists for render radius + 1 border ring
    for (let r = 0; r <= RENDER_DIST + 1; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const key = chunkKey(pcx + dx, pcz + dz);
          const c = this.chunks.get(key);
          if (!c || !c.hasData) this.generateChunk(pcx + dx, pcz + dz);
        }
      }
    }
    // 2) queue meshes for chunks missing them (nearest first)
    const toMesh = [];
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
      for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
        const c = this.chunks.get(chunkKey(pcx + dx, pcz + dz));
        if (c && c.hasData && !c.opaqueMesh && !c.meshDirty) toMesh.push([dx * dx + dz * dz, c]);
      }
    }
    toMesh.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < Math.min(meshBudget, toMesh.length); i++) {
      this.rebuildChunkMesh(toMesh[i][1]);
    }
    // 3) unload far chunks (persisting player edits first)
    for (const [key, c] of this.chunks) {
      const d = Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz));
      if (d > RENDER_DIST + 1) {
        if (c.opaqueMesh || c.waterMesh) c.dispose(Game.scene);
        if (d > RENDER_DIST + 2) {
          if (c.modified.size > 0) {
            let saved = this.edits.get(key);
            if (!saved) { saved = new Map(); this.edits.set(key, saved); }
            for (const idx of c.modified) saved.set(idx, c.data[idx]);
          }
          this.chunks.delete(key);
        }
      }
    }
    return toMesh.length;      // pending meshes (for the loading bar)
  }

  countPendingMeshes(px, pz) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    let n = 0;
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++)
      for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
        const c = this.chunks.get(chunkKey(pcx + dx, pcz + dz));
        if (c && c.hasData && !c.opaqueMesh) n++;
      }
    return n;
  }

  /* find a good spawn point near the origin */
  findSpawn() {
    for (let r = 0; r < 64; r++) {
      for (let a = 0; a < 16; a++) {
        const x = Math.round(Math.cos(a / 16 * Math.PI * 2) * r * 4);
        const z = Math.round(Math.sin(a / 16 * Math.PI * 2) * r * 4);
        const h = this.heightAt(x, z);
        if (h > WATER_Y + 1 && h < 55) {
          const biome = this.biomeAt(x, z);
          if (biome !== 'desert' || r > 3) return { x: x + 0.5, y: h + 1.01, z: z + 0.5 };
        }
      }
    }
    return { x: 0.5, y: this.heightAt(0, 0) + 2, z: 0.5 };
  }

  /* highest solid block in a column (for mob spawning / burning) */
  surfaceY(x, z) {
    const c = this.chunks.get(chunkKey(x >> 4, z >> 4));
    if (!c || !c.hasData) return this.heightAt(x, z);
    return c.heightMap[(z & 15) * CHUNK + (x & 15)];
  }

  /* torch world-positions near a point (for the light pool) */
  torchesNear(px, pz, radius) {
    const out = [];
    const pcx = px >> 4, pcz = pz >> 4;
    const r = Math.ceil(radius / CHUNK);
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      const c = this.chunks.get(chunkKey(pcx + dx, pcz + dz));
      if (!c || !c.hasData) continue;
      for (const idx of c.torches) {
        const y = idx >> 8, lz = (idx >> 4) & 15, lx = idx & 15;
        const wx = c.cx * CHUNK + lx, wz = c.cz * CHUNK + lz;
        const d2 = (wx - px) * (wx - px) + (wz - pz) * (wz - pz);
        if (d2 < radius * radius) out.push([wx + 0.5, y + 0.7, wz + 0.5, d2]);
      }
    }
    out.sort((a, b) => a[3] - b[3]);
    return out;
  }

  /* ---------- save / load ---------- */
  serializeEdits() {
    const out = {};
    for (const [key, map] of this.edits) out[key] = [...map.entries()];
    for (const [key, c] of this.chunks) {
      if (c.modified.size === 0) continue;
      const merged = new Map(out[key] || []);
      for (const idx of c.modified) merged.set(idx, c.data[idx]);
      out[key] = [...merged.entries()];
    }
    return out;
  }
  loadEdits(obj) {
    this.edits.clear();
    for (const key of Object.keys(obj || {})) this.edits.set(key, new Map(obj[key]));
  }
}

/* Shared materials (built once at startup) */
const Materials = {
  opaque: null, water: null,
  build() {
    this.opaque = new THREE.MeshLambertMaterial({
      map: Textures.atlasTexture, vertexColors: true, alphaTest: 0.5, side: THREE.FrontSide,
    });
    this.water = new THREE.MeshLambertMaterial({
      map: Textures.atlasTexture, vertexColors: true, transparent: true, opacity: 0.72,
      side: THREE.DoubleSide, depthWrite: true,
    });
  },
};
