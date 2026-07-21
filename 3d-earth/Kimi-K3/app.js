import * as THREE from 'three';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICONS = {
  clear: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" stroke="currentColor" stroke-width="1.8"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="16" y1="2" x2="16" y2="6"/><line x1="16" y1="26" x2="16" y2="30"/><line x1="2" y1="16" x2="6" y2="16"/><line x1="26" y1="16" x2="30" y2="16"/><line x1="5.6" y1="5.6" x2="8.4" y2="8.4"/><line x1="23.6" y1="23.6" x2="26.4" y2="26.4"/><line x1="23.6" y1="8.4" x2="26.4" y2="5.6"/><line x1="5.6" y1="26.4" x2="8.4" y2="23.6"/></g></svg>`,
  night: `<svg viewBox="0 0 32 32" fill="none"><path d="M14 5A12 12 0 1 0 27 18 10 10 0 0 1 14 5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="25" cy="7" r="1" fill="currentColor" stroke="none" opacity="0.6"/><circle cx="20" cy="10" r="0.7" fill="currentColor" stroke="none" opacity="0.4"/><circle cx="26" cy="14" r="0.8" fill="currentColor" stroke="none" opacity="0.5"/></svg>`,
  cloudy: `<svg viewBox="0 0 32 32" fill="none"><path d="M9 22H23A5 5 0 0 0 23 12H21.5A6.5 6.5 0 0 0 9 14.3V16A4 4 0 0 0 9 22Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  rain: `<svg viewBox="0 0 32 32" fill="none"><path d="M8 20H22A5 5 0 0 0 22 10H20.5A6.5 6.5 0 0 0 8 12.3V14A3.5 3.5 0 0 0 8 20Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="23" x2="7" y2="30"/><line x1="16" y1="23" x2="13" y2="30"/><line x1="22" y1="23" x2="19" y2="30"/></g></svg>`,
  storm: `<svg viewBox="0 0 32 32" fill="none"><path d="M8 18H22A5 5 0 0 0 22 8H20.5A6.5 6.5 0 0 0 8 10.3V12A3.5 3.5 0 0 0 8 18Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 18L10 27H16L13 32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  snow: `<svg viewBox="0 0 32 32" fill="none"><path d="M7 18H21A5 5 0 0 0 21 8H19.5A6.5 6.5 0 0 0 7 10.3V12A3.5 3.5 0 0 0 7 18Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="9" y1="22" x2="9" y2="26"/><line x1="13" y1="24" x2="13" y2="29"/><line x1="17" y1="24" x2="17" y2="29"/><line x1="21" y1="22" x2="21" y2="26"/><line x1="9" y1="28" x2="9" y2="30"/><line x1="17" y1="31" x2="17" y2="32"/></g></svg>`,
};

const COND = {
  clear: { label: 'Clear', code: 'CLR', icon: 'night' },
  cloudy: { label: 'Cloudy', code: 'CLD', icon: 'cloudy' },
  rain: { label: 'Rain', code: 'RAN', icon: 'rain' },
  storm: { label: 'Thunderstorm', code: 'TSTM', icon: 'storm' },
  snow: { label: 'Snow', code: 'SNW', icon: 'snow' },
};

const CITIES = [
  { id: 'nyc', name: 'New York', country: 'United States', lat: 40.71, lng: -74.0, utc: -4, temp: 8, feels: 5, cond: 'cloudy', hum: 62, wind: 14, press: 1016, vis: 9,
    forecast: [{ d: 'Tue', c: 'cloudy', lo: 6, hi: 11 }, { d: 'Wed', c: 'rain', lo: 5, hi: 9 }, { d: 'Thu', c: 'clear', lo: 4, hi: 12 }, { d: 'Fri', c: 'clear', lo: 7, hi: 14 }, { d: 'Sat', c: 'cloudy', lo: 8, hi: 13 }] },
  { id: 'lon', name: 'London', country: 'United Kingdom', lat: 51.5, lng: -0.12, utc: 1, temp: 6, feels: 3, cond: 'rain', hum: 78, wind: 22, press: 1004, vis: 6,
    forecast: [{ d: 'Tue', c: 'rain', lo: 4, hi: 8 }, { d: 'Wed', c: 'rain', lo: 5, hi: 9 }, { d: 'Thu', c: 'cloudy', lo: 6, hi: 10 }, { d: 'Fri', c: 'clear', lo: 5, hi: 11 }, { d: 'Sat', c: 'cloudy', lo: 6, hi: 10 }] },
  { id: 'tyo', name: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.69, utc: 9, temp: 14, feels: 13, cond: 'clear', hum: 55, wind: 9, press: 1021, vis: 14,
    forecast: [{ d: 'Tue', c: 'clear', lo: 10, hi: 17 }, { d: 'Wed', c: 'clear', lo: 11, hi: 18 }, { d: 'Thu', c: 'cloudy', lo: 12, hi: 16 }, { d: 'Fri', c: 'rain', lo: 11, hi: 15 }, { d: 'Sat', c: 'clear', lo: 10, hi: 17 }] },
  { id: 'dxb', name: 'Dubai', country: 'UAE', lat: 25.2, lng: 55.27, utc: 4, temp: 31, feels: 34, cond: 'clear', hum: 41, wind: 11, press: 1010, vis: 16,
    forecast: [{ d: 'Tue', c: 'clear', lo: 27, hi: 39 }, { d: 'Wed', c: 'clear', lo: 28, hi: 40 }, { d: 'Thu', c: 'clear', lo: 29, hi: 41 }, { d: 'Fri', c: 'clear', lo: 28, hi: 40 }, { d: 'Sat', c: 'cloudy', lo: 27, hi: 37 }] },
  { id: 'lax', name: 'Los Angeles', country: 'United States', lat: 34.05, lng: -118.24, utc: -7, temp: 17, feels: 17, cond: 'clear', hum: 48, wind: 7, press: 1014, vis: 18,
    forecast: [{ d: 'Tue', c: 'clear', lo: 14, hi: 24 }, { d: 'Wed', c: 'clear', lo: 15, hi: 25 }, { d: 'Thu', c: 'clear', lo: 16, hi: 26 }, { d: 'Fri', c: 'cloudy', lo: 15, hi: 22 }, { d: 'Sat', c: 'clear', lo: 14, hi: 24 }] },
  { id: 'sao', name: 'São Paulo', country: 'Brazil', lat: -23.55, lng: -46.63, utc: -3, temp: 22, feels: 24, cond: 'storm', hum: 84, wind: 18, press: 1008, vis: 5,
    forecast: [{ d: 'Tue', c: 'storm', lo: 19, hi: 25 }, { d: 'Wed', c: 'rain', lo: 18, hi: 24 }, { d: 'Thu', c: 'rain', lo: 18, hi: 23 }, { d: 'Fri', c: 'cloudy', lo: 17, hi: 25 }, { d: 'Sat', c: 'clear', lo: 18, hi: 27 }] },
  { id: 'syd', name: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21, utc: 10, temp: 24, feels: 25, cond: 'clear', hum: 60, wind: 13, press: 1018, vis: 20,
    forecast: [{ d: 'Tue', c: 'clear', lo: 15, hi: 21 }, { d: 'Wed', c: 'clear', lo: 14, hi: 22 }, { d: 'Thu', c: 'cloudy', lo: 15, hi: 20 }, { d: 'Fri', c: 'rain', lo: 14, hi: 18 }, { d: 'Sat', c: 'clear', lo: 13, hi: 21 }] },
];

const HEAT_SPOTS = [
  { lat: 22, lng: 10, temp: 38 }, { lat: 63, lng: 100, temp: -14 },
  { lat: -25, lng: 133, temp: 30 }, { lat: -5, lng: -62, temp: 27 },
  { lat: -78, lng: 20, temp: -30 }, { lat: 55, lng: 60, temp: 2 },
];

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

function seededRandom(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

const HEAT_STOPS = [
  [0, new THREE.Color('#2b6bff')], [0.32, new THREE.Color('#27c8ff')],
  [0.55, new THREE.Color('#ffd23f')], [0.8, new THREE.Color('#ff7a3d')],
  [1, new THREE.Color('#ff3d2e')],
];

function tempColor(temp) {
  const t = clamp((temp + 15) / 55, 0, 1);
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    if (t <= HEAT_STOPS[i][0]) {
      const [t0, c0] = HEAT_STOPS[i - 1], [t1, c1] = HEAT_STOPS[i];
      return c0.clone().lerp(c1, (t - t0) / (t1 - t0));
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1][1].clone();
}

function latLngToVec3(lat, lng, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// ---------------------------------------------------------------
// RENDERER / SCENE
// ---------------------------------------------------------------

const stage = $('stage');
const canvas = $('globe-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setClearColor(0x02050c);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);

const tiltGroup = new THREE.Group();
const spinGroup = new THREE.Group();
tiltGroup.add(spinGroup);
scene.add(tiltGroup);

scene.add(new THREE.AmbientLight(0x406080, 2.5));
const keyLight = new THREE.DirectionalLight(0xddeeff, 3.2);
keyLight.position.set(3, 1.5, 4);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x5588ff, 2.6);
rimLight.position.set(-2, -0.8, -3);
scene.add(rimLight);

const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
topLight.position.set(0, 5, 0.5);
scene.add(topLight);

// ---------------------------------------------------------------
// TEXTURES
// ---------------------------------------------------------------

function fallbackEarthTexture() {
  const w = 1024, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0a1e3d'); g.addColorStop(0.5, '#0c284d'); g.addColorStop(1, '#081834');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const rnd = seededRandom(42);
  for (let i = 0; i < 75; i++) {
    const cx = rnd() * w, cy = h * 0.12 + rnd() * h * 0.75;
    for (let j = 0; j < 160; j++) {
      const x = cx + (rnd() - 0.5) * 110, y = cy + (rnd() - 0.5) * 55;
      const a = 0.3 + rnd() * 0.7;
      ctx.fillStyle = `rgba(255, ${200 + Math.floor(rnd() * 55)}, 135, ${a})`;
      ctx.beginPath(); ctx.arc(x, y, 0.9 + rnd() * 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCloudTexture() {
  const w = 1024, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const rnd = seededRandom(7);
  const octaves = [];
  for (let o = 0; o < 4; o++) {
    const gw = 8 * (2 ** o) + 1, gh = 4 * (2 ** o) + 1;
    const grid = new Float32Array(gw * gh);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    octaves.push({ gw, gh, grid });
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0, amp = 0.55;
      for (const o of octaves) {
        const fx = (x / w) * (o.gw - 1), fy = (y / h) * (o.gh - 1);
        const x0 = Math.floor(fx) % (o.gw - 1), y0 = Math.min(Math.floor(fy), o.gh - 2);
        const tx = smooth(fx - Math.floor(fx)), ty = smooth(fy - Math.floor(fy));
        v += lerp(lerp(o.grid[y0*o.gw+x0], o.grid[y0*o.gw+x0+1], tx), lerp(o.grid[(y0+1)*o.gw+x0], o.grid[(y0+1)*o.gw+x0+1], tx), ty) * amp;
        amp *= 0.55;
      }
      v /= 1.35;
      const alpha = clamp((v - 0.48) / 0.28, 0, 1);
      const i = (y * w + x) * 4;
      img.data[i] = 235; img.data[i+1] = 244; img.data[i+2] = 255;
      img.data[i+3] = Math.pow(alpha, 1.4) * 220;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlowSprite(color, size = 128) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color.replace('1)', '0.35)'));
  g.addColorStop(1, color.replace('1)', '0)'));
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------
// EARTH
// ---------------------------------------------------------------

const loadBar = $('load-bar');
const loadStatus = $('load-status');
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => { loadBar.style.width = `${Math.round((loaded / total) * 100)}%`; };

const texLoader = new THREE.TextureLoader(manager);
const nightTex = fallbackEarthTexture();

function loadTex(url) {
  return new Promise((resolve) => {
    texLoader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; resolve(t); }, undefined, () => resolve(null));
  });
}

const earthMat = new THREE.MeshStandardMaterial({
  map: nightTex,
  emissiveMap: nightTex,
  emissive: new THREE.Color(0xffffff),
  emissiveIntensity: 2.0,
  roughness: 0.50,
  metalness: 0.04,
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMat);
spinGroup.add(earth);

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(1.018, 64, 64),
  new THREE.MeshStandardMaterial({ map: makeCloudTexture(), transparent: true, opacity: 0.5, depthWrite: false, roughness: 1, color: new THREE.Color(0.75, 0.85, 1) })
);
spinGroup.add(clouds);

// Blue atmosphere halos
const haloVert = `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const halo = new THREE.Mesh(new THREE.SphereGeometry(1.22, 64, 64), new THREE.ShaderMaterial({
  vertexShader: haloVert,
  fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2); gl_FragColor = vec4(0.18, 0.48, 1.0, 1.0) * intensity * 1.1; }`,
  blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
}));
scene.add(halo);

const haloOuter = new THREE.Mesh(new THREE.SphereGeometry(1.55, 64, 64), new THREE.ShaderMaterial({
  vertexShader: haloVert,
  fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(0.78 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 5.0); gl_FragColor = vec4(0.12, 0.36, 0.85, 1.0) * intensity * 0.65; }`,
  blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
}));
scene.add(haloOuter);

// Stars
{
  const N = 1400;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const rnd = seededRandom(99);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3(rnd()*2-1, rnd()*2-1, rnd()*2-1).normalize().multiplyScalar(28 + rnd()*40);
    pos.set([v.x, v.y, v.z], i * 3);
    const b = 0.55 + rnd() * 0.45;
    col.set([b*(0.8+rnd()*0.2), b*(0.85+rnd()*0.15), b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })));
}

// ---------------------------------------------------------------
// CITY MARKERS
// ---------------------------------------------------------------

const markerGlowTex = makeGlowSprite('rgba(120,220,255,1)');
const markersLayer = $('markers');
const cityNodes = [];

for (const city of CITIES) {
  const p = latLngToVec3(city.lat, city.lng, 1.012);
  const node = new THREE.Group();
  node.position.copy(p);
  node.lookAt(p.clone().multiplyScalar(2));

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: markerGlowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false,
  }));
  glow.scale.setScalar(0.085);
  node.add(glow);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.011, 0.0145, 40),
    new THREE.MeshBasicMaterial({ color: 0x3fd8ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
  );
  node.add(ring);
  spinGroup.add(node);

  const card = document.createElement('button');
  card.className = 'marker-card';
  card.dataset.id = city.id;
  card.innerHTML = `<span class="mc-top"><span class="mc-icon">${ICONS[COND[city.cond].icon]}</span><span class="mc-name">${city.name}</span><span class="mc-temp">${city.temp}°</span></span><span class="mc-bottom">${COND[city.cond].code}<span class="hum">H${city.hum}%</span></span>`;
  card.addEventListener('click', () => selectCity(city.id, true));
  markersLayer.appendChild(card);
  cityNodes.push({ city, node, ring, glow, card });
}

// ---------------------------------------------------------------
// HEAT GLOW SPRITES
// ---------------------------------------------------------------

for (const spot of [...HEAT_SPOTS, ...CITIES.map(c => ({ lat: c.lat, lng: c.lng, temp: c.temp }))]) {
  const color = tempColor(spot.temp);
  const tex = makeGlowSprite(`rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},1)`);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.28, depthWrite: false }));
  sprite.position.copy(latLngToVec3(spot.lat, spot.lng, 1.03));
  const s = 0.36 + clamp(Math.abs(spot.temp) / 45, 0, 1) * 0.32;
  sprite.scale.set(s, s * 0.72, 1);
  spinGroup.add(sprite);
}

// ---------------------------------------------------------------
// RAIN / SNOW PARTICLES
// ---------------------------------------------------------------

function makePrecip({ latMin, latMax, lngMin, lngMax, count, size, color, opacity, speedMin, speedMax, drift }) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const parts = [];
  const rnd = seededRandom(count * 31);
  for (let i = 0; i < count; i++) {
    parts.push({ lat: latMin + rnd()*(latMax-latMin), lng: lngMin + rnd()*(lngMax-lngMin), phase: rnd(), speed: speedMin + rnd()*(speedMax-speedMin), wobble: rnd()*Math.PI*2 });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  spinGroup.add(points);
  return { geo, parts, drift };
}

const rain = makePrecip({ latMin: -14, latMax: 4, lngMin: -72, lngMax: -46, count: 520, size: 2, color: 0x66ccff, opacity: 0.7, speedMin: 0.35, speedMax: 0.7, drift: 0 });
const snow = makePrecip({ latMin: 55, latMax: 69, lngMin: 4, lngMax: 38, count: 280, size: 2.6, color: 0xeaf6ff, opacity: 0.85, speedMin: 0.06, speedMax: 0.14, drift: 0.35 });

function updatePrecip(sys, t) {
  const arr = sys.geo.attributes.position.array;
  for (let i = 0; i < sys.parts.length; i++) {
    const p = sys.parts[i];
    const cycle = (p.phase + t * p.speed * 0.12) % 1;
    const v = latLngToVec3(p.lat, p.lng + Math.sin(t*0.8 + p.wobble)*sys.drift, 1.075 - cycle * 0.06);
    arr.set([v.x, v.y, v.z], i * 3);
  }
  sys.geo.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------
// CAMERA
// ---------------------------------------------------------------

const MIN_D = 1.7, MAX_D = 5.2;
let dist = 2.7, targetDist = 2.7, spin = 2.4, targetSpin = 2.4, tilt = 0.28, targetTilt = 0.28, autoRotate = !REDUCED, dragging = false, velX = 0, velY = 0, idleTimer = 0;
let lastPointer = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId); lastPointer = { x: e.clientX, y: e.clientY }; velX = 0; velY = 0; });
canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastPointer.x, dy = e.clientY - lastPointer.y; lastPointer = { x: e.clientX, y: e.clientY }; targetSpin += dx*0.005; targetTilt = clamp(targetTilt + dy*0.003, -0.95, 0.95); velX = dx*0.005; velY = dy*0.003; idleTimer = 0; });
window.addEventListener('pointerup', () => { dragging = false; canvas.classList.remove('dragging'); });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); targetDist = clamp(targetDist + e.deltaY*0.0016, MIN_D, MAX_D); }, { passive: false });

$('zoom-in').addEventListener('click', () => { targetDist = clamp(targetDist - 0.5, MIN_D, MAX_D); });
$('zoom-out').addEventListener('click', () => { targetDist = clamp(targetDist + 0.5, MIN_D, MAX_D); });
$('rotate-toggle').addEventListener('click', (e) => { autoRotate = !autoRotate; e.currentTarget.classList.toggle('active', autoRotate); e.currentTarget.setAttribute('aria-pressed', String(autoRotate)); });
$('reset-view').addEventListener('click', () => { targetSpin = 2.4; targetTilt = 0.28; targetDist = 3.1; });
if (REDUCED) { const rt = $('rotate-toggle'); rt.classList.remove('active'); rt.setAttribute('aria-pressed', 'false'); }

function flyTo(city, snap = false) {
  const p = latLngToVec3(city.lat, city.lng, 1);
  const wantedSpin = -Math.atan2(p.x, p.z);
  let delta = wantedSpin - (targetSpin % (Math.PI*2));
  delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  targetSpin += delta;
  targetTilt = clamp(Math.atan2(p.y, Math.hypot(p.x, p.z)), -0.85, 0.85);
  targetDist = clamp(targetDist, MIN_D, 3.4);
  idleTimer = 0;
  if (snap) { spin = targetSpin; tilt = targetTilt; dist = targetDist; }
}

// ---------------------------------------------------------------
// SIDEBAR / SELECTION
// ---------------------------------------------------------------

let selectedId = null;

function selectCity(id, fly = false) {
  const city = CITIES.find(c => c.id === id);
  if (!city) return;
  selectedId = id;
  for (const cn of cityNodes) {
    cn.card.classList.toggle('selected', cn.city.id === id);
    cn.ring.material.color.set(cn.city.id === id ? 0xbff1ff : 0x3fd8ff);
  }
  $('city-name').textContent = city.name;
  $('city-country').textContent = city.country;
  $('city-coords').textContent = `${Math.abs(city.lat).toFixed(1)}°${city.lat >= 0 ? 'N' : 'S'} · ${Math.abs(city.lng).toFixed(1)}°${city.lng >= 0 ? 'E' : 'W'}`;
  $('now-icon').innerHTML = ICONS[COND[city.cond].icon];
  $('now-temp').textContent = city.temp;
  $('now-cond').textContent = COND[city.cond].label;
  $('now-feels').textContent = city.feels;
  $('stat-hum').textContent = `${city.hum}%`;
  $('stat-wind').textContent = `${city.wind} km/h`;
  $('stat-press').textContent = `${city.press} hPa`;
  $('stat-vis').textContent = `${city.vis} km`;
  requestAnimationFrame(() => {
    $('meter-hum').style.width = `${city.hum}%`;
    $('meter-wind').style.width = `${clamp(city.wind/60*100, 4, 100)}%`;
    $('meter-press').style.width = `${clamp((city.press-980)/60*100, 4, 100)}%`;
    $('meter-vis').style.width = `${clamp(city.vis/25*100, 4, 100)}%`;
  });
  const lo = Math.min(...city.forecast.map(f => f.lo)), hi = Math.max(...city.forecast.map(f => f.hi));
  $('forecast-list').innerHTML = city.forecast.map((f, i) => {
    const a = ((f.lo - lo) / (hi - lo || 1)) * 100, b = ((f.hi - lo) / (hi - lo || 1)) * 100;
    return `<li><span class="fc-day">${i === 0 ? 'Today' : f.d}</span><span class="fc-icon">${ICONS[COND[f.c].icon]}</span><span class="fc-lo">${f.lo}°</span><span class="fc-range"><i style="left:${a}%;width:${Math.max(b-a,6)}%"></i></span><span class="fc-hi">${f.hi}°</span></li>`;
  }).join('');
  $('tl-city').textContent = city.name;
  buildTimeline(city);
  if (fly) flyTo(city);
  if (window.innerWidth <= 1080) $('sidebar').classList.add('open');
}

$('panel-toggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));

// ---------------------------------------------------------------
// TIMELINE
// ---------------------------------------------------------------

function hourlyTemps(city) {
  const rnd = seededRandom(city.id.charCodeAt(0)*7 + 13);
  const localNow = new Date(Date.now() + city.utc * 3600e3).getUTCHours();
  const out = [];
  for (let i = 0; i < 24; i++) {
    const h = (localNow + i) % 24;
    const diurnal = Math.sin(((h - 9) / 24) * Math.PI * 2) * 4.5;
    out.push({ h, temp: Math.round((city.temp - 2 + diurnal + (rnd() - 0.5) * 1.6) * 10) / 10 });
  }
  return out;
}

function buildTimeline(city) {
  const svg = $('tl-chart'), data = hourlyTemps(city);
  const W = 720, H = 100, padX = 18, padT = 26, padB = 22;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const temps = data.map(d => d.temp);
  const lo = Math.min(...temps) - 1, hi = Math.max(...temps) + 1;
  const x = i => padX + (i / (data.length - 1)) * (W - padX * 2);
  const y = t => padT + (1 - (t - lo) / (hi - lo)) * (H - padT - padB);
  let line = `M ${x(0)} ${y(temps[0])}`;
  for (let i = 1; i < data.length; i++) { const cx = (x(i-1) + x(i)) / 2; line += ` C ${cx} ${y(temps[i-1])}, ${cx} ${y(temps[i])}, ${x(i)} ${y(temps[i])}`; }
  const area = `${line} L ${x(data.length-1)} ${H-padB} L ${x(0)} ${H-padB} Z`;
  const dots = data.map((d, i) => `<circle class="tl-dot" data-i="${i}" cx="${x(i)}" cy="${y(d.temp)}" r="${i===0?3.4:2}" fill="${i===0?'#3fd8ff':'#0a1424'}" stroke="#3fd8ff" stroke-width="1" opacity="${i===0?1:0.85}"/>`).join('');
  const labels = data.map((d, i) => i % 3 === 0 ? `<text x="${x(i)}" y="${H-6}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8.5" fill="#57708f">${String(d.h).padStart(2,'0')}:00</text>` : '').join('');
  const tempTxt = data.map((d, i) => (i%6===0||i===data.length-1) ? `<text x="${x(i)}" y="${y(d.temp)-8}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" fill="#8ea7c6">${Math.round(d.temp)}°</text>` : '').join('');
  svg.innerHTML = `<defs><linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fd8ff" stop-opacity="0.32"/><stop offset="1" stop-color="#3fd8ff" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#tlg)"/><path d="${line}" fill="none" stroke="#3fd8ff" stroke-width="1.6" stroke-linecap="round"/>${labels}${dots}${tempTxt}<text x="${x(0)}" y="${y(temps[0])-14}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8" fill="#3fd8ff">NOW</text>`;
  svg.dataset.points = JSON.stringify(data.map((d, i) => ({ x: x(i), ...d })));
}

const tlTooltip = $('tl-tooltip');
$('tl-chart').addEventListener('mousemove', (e) => {
  const svg = e.currentTarget, pts = JSON.parse(svg.dataset.points || '[]');
  if (!pts.length) return;
  const mx = ((e.clientX - svg.getBoundingClientRect().left) / svg.getBoundingClientRect().width) * 720;
  let best = pts[0], bd = Infinity;
  for (const p of pts) { const d = Math.abs(p.x - mx); if (d < bd) { bd = d; best = p; } }
  tlTooltip.hidden = false; tlTooltip.textContent = `${String(best.h).padStart(2,'0')}:00 · ${best.temp}°`; tlTooltip.style.left = `${(best.x/720)*100}%`;
});
$('tl-chart').addEventListener('mouseleave', () => { tlTooltip.hidden = true; });

// ---------------------------------------------------------------
// SEARCH
// ---------------------------------------------------------------

const searchInput = $('search-input'), searchList = $('search-list');
let searchIndex = -1;

function renderSearch(q) {
  const matches = q.trim() ? CITIES.filter(c => `${c.name} ${c.country}`.toLowerCase().includes(q.trim().toLowerCase())) : CITIES;
  searchIndex = matches.length ? 0 : -1;
  searchList.innerHTML = matches.length ? matches.map((c, i) => `<li role="option" data-id="${c.id}" class="${i===0?'active':''}"><span class="mc-icon" style="width:16px;height:16px">${ICONS[COND[c.cond].icon]}</span>${c.name}<span class="mono">${c.temp}° · ${COND[c.cond].label}</span></li>`).join('') : '<li class="empty">NO STATIONS FOUND</li>';
  searchList.hidden = false; searchInput.setAttribute('aria-expanded', 'true');
  for (const li of searchList.querySelectorAll('li[data-id]')) {
    li.addEventListener('mousedown', (e) => { e.preventDefault(); selectCity(li.dataset.id, true); closeSearch(); });
  }
}
function closeSearch() { searchList.hidden = true; searchInput.setAttribute('aria-expanded', 'false'); searchInput.value = ''; searchInput.blur(); }
searchInput.addEventListener('focus', () => renderSearch(searchInput.value));
searchInput.addEventListener('input', () => renderSearch(searchInput.value));
searchInput.addEventListener('keydown', (e) => {
  const items = [...searchList.querySelectorAll('li[data-id]')];
  if (e.key === 'Escape') closeSearch();
  if (!items.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); searchIndex = (searchIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((li, i) => li.classList.toggle('active', i === searchIndex)); }
  if (e.key === 'Enter' && searchIndex >= 0) { selectCity(items[searchIndex].dataset.id, true); closeSearch(); }
});
document.addEventListener('click', (e) => { if (!e.target.closest('.search')) closeSearch(); });
window.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== searchInput) { e.preventDefault(); searchInput.focus(); } });

// ---------------------------------------------------------------
// CLOCK
// ---------------------------------------------------------------

function tickClock() {
  const now = new Date();
  $('clock-time').textContent = now.toISOString().slice(11, 19);
  $('clock-date').textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
  const city = CITIES.find(c => c.id === selectedId);
  if (city) $('city-local').textContent = new Date(now.getTime() + city.utc * 3600e3).toISOString().slice(11, 16);
}
setInterval(tickClock, 1000);
tickClock();

// ---------------------------------------------------------------
// RENDER LOOP
// ---------------------------------------------------------------

const hudCoords = $('hud-coords'), hudZoom = $('hud-zoom');
const worldPos = new THREE.Vector3(), camDir = new THREE.Vector3();
const frameClock = new THREE.Clock();
let needsResize = true;

function frame() {
  const t = frameClock.getElapsedTime();

  if (needsResize) {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    if (sw > 0 && sh > 0) { renderer.setSize(sw, sh, false); camera.aspect = sw / sh; camera.updateProjectionMatrix(); needsResize = false; }
  }

  if (!dragging) {
    if (Math.abs(velX) > 0.00005) { targetSpin += velX; targetTilt = clamp(targetTilt + velY, -0.95, 0.95); velX *= 0.94; velY *= 0.94; }
    idleTimer += 1;
    if (autoRotate && idleTimer > 140 && !REDUCED) targetSpin += 0.00065;
  }

  spin = lerp(spin, targetSpin, 0.075);
  tilt = lerp(tilt, targetTilt, 0.075);
  dist = lerp(dist, targetDist, 0.09);
  spinGroup.rotation.y = spin;
  tiltGroup.rotation.x = tilt;
  camera.position.set(0, 0, dist);
  camera.lookAt(0, 0, 0);
  clouds.rotation.y = t * 0.008;

  if (!REDUCED) {
    updatePrecip(rain, t);
    updatePrecip(snow, t);
    for (let i = 0; i < cityNodes.length; i++) {
      const s = 1 + Math.sin(t * 2.2 + i * 1.3) * 0.18;
      cityNodes[i].ring.scale.setScalar(cityNodes[i].city.id === selectedId ? s * 1.5 : s);
    }
  }

  const rect = stage.getBoundingClientRect();
  camDir.copy(camera.position).normalize();
  for (const cn of cityNodes) {
    cn.node.getWorldPosition(worldPos);
    const vis = clamp((worldPos.clone().normalize().dot(camDir) - 0.02) / 0.22, 0, 1);
    const proj = worldPos.clone().project(camera);
    const sx = clamp((proj.x * 0.5 + 0.5) * rect.width, 84, rect.width - 84);
    const sy = clamp((-proj.y * 0.5 + 0.5) * rect.height, 78, rect.height - 12);
    cn.card.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, calc(-100% - 18px)) scale(${(0.9 + vis * 0.1).toFixed(3)})`;
    cn.card.style.opacity = vis.toFixed(2);
    cn.card.style.pointerEvents = vis > 0.35 ? 'auto' : 'none';
    cn.card.style.zIndex = cn.city.id === selectedId ? 5 : Math.round(vis * 3);
  }

  hudCoords.textContent = `${Math.abs(tilt*180/Math.PI).toFixed(1)}°${tilt>=0?'N':'S'} · ${Math.abs(((-90-spin*180/Math.PI)%360+540)%360-180).toFixed(1)}°${((-90-spin*180/Math.PI)%360+540)%360-180>=0?'E':'W'}`;
  hudZoom.textContent = `${Math.round((1 - (dist - MIN_D) / (MAX_D - MIN_D)) * 100)}%`;

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------

requestAnimationFrame(frame);

Promise.all([
  loadTex('https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg'),
  loadTex('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'),
]).then(([night, day]) => {
  if (night) { earthMat.emissiveMap = night; earthMat.emissiveIntensity = 2.4; }
  if (day) { earthMat.map = day; earthMat.color = new THREE.Color(0.62, 0.72, 0.95); }
  else if (night) { earthMat.map = night; }
  earthMat.needsUpdate = true;
}).finally(() => {
  loadBar.style.width = '100%';
  loadStatus.textContent = 'FEED ONLINE';
  setTimeout(() => $('loading').classList.add('done'), 350);
  window.__booted = true;
});

selectCity('nyc', false);
flyTo(CITIES[0], true);
