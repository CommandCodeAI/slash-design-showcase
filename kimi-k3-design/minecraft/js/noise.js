/* ============================================================
   noise.js — seeded PRNG, Perlin noise, fBm, coordinate hashes
   All world randomness flows from here so seeds are reproducible.
   ============================================================ */
'use strict';

// mulberry32 — tiny fast seeded PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turn an arbitrary string into a 32-bit seed number
function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic hash of integer coords → [0, 1). Stable across sessions.
function hashCoords(x, y, z, seed) {
  let h = seed >>> 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h = Math.imul(h ^ (z | 0), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Classic improved Perlin noise (2D), seeded permutation table
class Perlin {
  constructor(seed) {
    const rand = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {           // Fisher–Yates shuffle
      const j = (rand() * (i + 1)) | 0;
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  static fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  static lerp(t, a, b) { return a + t * (b - a); }
  static grad(hash, x, y) {
    switch (hash & 7) {
      case 0: return  x + y;  case 1: return  x - y;
      case 2: return -x + y;  case 3: return -x - y;
      case 4: return  x;      case 5: return -x;
      case 6: return  y;      default: return -y;
    }
  }
  // Returns noise in [-1, 1]
  noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = Perlin.fade(x), v = Perlin.fade(y);
    const p = this.perm;
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    return Perlin.lerp(v,
      Perlin.lerp(u, Perlin.grad(aa, x, y), Perlin.grad(ba, x - 1, y)),
      Perlin.lerp(u, Perlin.grad(ab, x, y - 1), Perlin.grad(bb, x - 1, y - 1)));
  }
  // Fractal Brownian motion: stacked octaves for natural terrain
  fbm(x, y, octaves, lacunarity = 2, gain = 0.5) {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.noise(x * freq, y * freq);
      norm += amp;
      amp *= gain; freq *= lacunarity;
    }
    return sum / norm;
  }
}
