/* ============================================================
   mobs.js — simple box-part creatures: pig & sheep (passive),
   zombie (hostile, spawns at night, burns in daylight).
   Wander/chase AI, gravity + collision, drops.
   ============================================================ */
'use strict';

const MOB_TYPES = {
  pig: {
    name: 'Pig', w: 0.9, h: 0.95, health: 10, speed: 1.7, hostile: false,
    drops: [{ item: 'pork', min: 1, max: 2 }],
  },
  sheep: {
    name: 'Sheep', w: 0.9, h: 1.0, health: 8, speed: 1.5, hostile: false,
    drops: [{ block: BLOCK_ID.WOOL, min: 1, max: 1 }],
  },
  zombie: {
    name: 'Zombie', w: 0.62, h: 1.85, health: 20, speed: 2.35, hostile: true,
    damage: 3, attackRange: 1.5, burns: true,
    drops: [{ item: 'flesh', min: 0, max: 2 }],
  },
};

/* cached geometry/material factories */
const _geomCache = new Map(), _matCache = new Map();
function boxGeom(w, h, d) {
  const k = w + ',' + h + ',' + d;
  if (!_geomCache.has(k)) _geomCache.set(k, new THREE.BoxGeometry(w, h, d));
  return _geomCache.get(k);
}
function colorMat(color) {
  if (!_matCache.has(color)) _matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return _matCache.get(color);
}
function part(parent, w, h, d, color, x, y, z, pivotTop = false) {
  const geo = boxGeom(w, h, d);
  const mesh = new THREE.Mesh(geo, colorMat(color));
  if (pivotTop) {
    mesh.geometry = geo.clone();
    mesh.geometry.translate(0, -h / 2, 0);
    mesh.position.set(x, y + h / 2, z);
  } else {
    mesh.position.set(x, y, z);
  }
  parent.add(mesh);
  return mesh;
}

/* Build the body for each mob type. Returns { group, legs[] } */
function buildMobModel(type) {
  const group = new THREE.Group();
  const legs = [];
  if (type === 'pig') {
    part(group, 0.9, 0.62, 1.1, 0xe8a0a8, 0, 0.75, 0);                 // body
    part(group, 0.5, 0.48, 0.5, 0xe8a0a8, 0, 0.95, -0.72);             // head
    part(group, 0.22, 0.16, 0.1, 0xd98a92, 0, 0.85, -0.98);            // snout
    legs.push(part(group, 0.24, 0.45, 0.24, 0xd98a92, -0.28, 0.45, -0.35, true));
    legs.push(part(group, 0.24, 0.45, 0.24, 0xd98a92, 0.28, 0.45, -0.35, true));
    legs.push(part(group, 0.24, 0.45, 0.24, 0xd98a92, -0.28, 0.45, 0.35, true));
    legs.push(part(group, 0.24, 0.45, 0.24, 0xd98a92, 0.28, 0.45, 0.35, true));
  } else if (type === 'sheep') {
    part(group, 0.95, 0.7, 1.15, 0xe8e8e8, 0, 0.85, 0);                // wool body
    part(group, 0.44, 0.44, 0.44, 0xd8c0a8, 0, 1.05, -0.75);           // head
    legs.push(part(group, 0.22, 0.5, 0.22, 0xb8b8b8, -0.3, 0.5, -0.38, true));
    legs.push(part(group, 0.22, 0.5, 0.22, 0xb8b8b8, 0.3, 0.5, -0.38, true));
    legs.push(part(group, 0.22, 0.5, 0.22, 0xb8b8b8, -0.3, 0.5, 0.38, true));
    legs.push(part(group, 0.22, 0.5, 0.22, 0xb8b8b8, 0.3, 0.5, 0.38, true));
  } else { // zombie
    part(group, 0.56, 0.72, 0.32, 0x3f7a7a, 0, 1.1, 0);                // torso
    part(group, 0.5, 0.5, 0.5, 0x4a7a3f, 0, 1.72, 0);                  // head
    const armL = part(group, 0.2, 0.2, 0.62, 0x4a7a3f, -0.38, 1.32, -0.3);   // arms out front
    const armR = part(group, 0.2, 0.2, 0.62, 0x4a7a3f, 0.38, 1.32, -0.3);
    legs.push(part(group, 0.24, 0.75, 0.24, 0x3a3f8f, -0.14, 0.75, 0, true));
    legs.push(part(group, 0.24, 0.75, 0.24, 0x3a3f8f, 0.14, 0.75, 0, true));
    legs.push(armL, armR);   // swing arms with the same rhythm
  }
  return { group, legs };
}

class Mob {
  constructor(type, x, y, z) {
    const def = MOB_TYPES[type];
    this.type = type; this.def = def;
    this.health = def.health;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.yaw = Math.random() * Math.PI * 2;
    this.walkPhase = 0;
    this.wanderTimer = 0;
    this.moving = false;
    this.attackCooldown = 0;
    this.hurtTimer = 0;
    this.burnTimer = 0;
    const model = buildMobModel(type);
    this.group = model.group;
    this.legs = model.legs;
    this.group.position.copy(this.pos);
    Game.scene.add(this.group);
  }

  update(dt, world, player, isNight) {
    const def = this.def;
    // ---------- AI ----------
    let wantX = 0, wantZ = 0, speed = 0;
    const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z;
    const distToPlayer = Math.hypot(dx, dz);

    if (def.hostile && !player.dead && distToPlayer < 26 && (isNight || distToPlayer < 8)) {
      // chase the player
      this.yaw = Math.atan2(-dx, -dz);
      wantX = -Math.sin(this.yaw); wantZ = -Math.cos(this.yaw);
      speed = def.speed;
      if (distToPlayer < def.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 1.1;
        player.damage(def.damage, 'mob');
        // small knockback
        player.vel.x += dx / (distToPlayer || 1) * -5;
        player.vel.z += dz / (distToPlayer || 1) * -5;
        player.vel.y += 2.5;
      }
    } else if (!def.hostile) {
      // wander: occasionally pick a new direction (or graze in place)
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2.5 + Math.random() * 4;
        if (Math.random() < 0.35) { this.moving = false; }
        else { this.moving = true; this.yaw = Math.random() * Math.PI * 2; }
      }
      if (this.moving) {
        wantX = -Math.sin(this.yaw); wantZ = -Math.cos(this.yaw);
        speed = def.speed * 0.55;
      }
    }
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // ---------- physics ----------
    this.vel.x = wantX * speed;
    this.vel.z = wantZ * speed;
    this.vel.y -= 28 * dt;
    if (this.vel.y < -40) this.vel.y = -40;
    const inWater = world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y), Math.floor(this.pos.z)) === BLOCK_ID.WATER;
    if (inWater) this.vel.y = Math.min(this.vel.y + 60 * dt, 2.5);
    const flags = collideMove(world, this.pos, this.vel, dt, def.w / 2, def.h);
    // hop over one-block obstacles while moving
    if (flags.hitWall && flags.onGround && speed > 0) this.vel.y = 8.2;

    // ---------- daylight burning ----------
    if (def.burns && !isNight) {
      const sx = Math.floor(this.pos.x), sz = Math.floor(this.pos.z);
      if (this.pos.y + def.h > world.surfaceY(sx, sz)) {
        this.burnTimer += dt;
        if (this.burnTimer >= 0.6) {
          this.burnTimer = 0;
          this.hurt(1, null);
          if (Math.random() < 0.4) Game.spawnParticles(this.pos.x, this.pos.y + def.h, this.pos.z, 0xff8830, 3);
        }
      }
    }

    // ---------- animation ----------
    const horizSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.walkPhase += horizSpeed * dt * 2.6;
    const swing = Math.sin(this.walkPhase) * Math.min(0.75, horizSpeed * 0.45);
    this.legs.forEach((leg, i) => { leg.rotation.x = (i % 2 === 0 ? swing : -swing); });
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;

    // hurt flash
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) this.setFlash(false);
    }
  }

  setFlash(on) {
    this.group.traverse(o => {
      if (o.isMesh) {
        if (!o.userData.origMat) o.userData.origMat = o.material;
        o.material = on ? colorMat(0xff4040) : o.userData.origMat;
      }
    });
  }

  hurt(amount, attackerPos) {
    if (this.health <= 0) return;
    this.health -= amount;
    this.hurtTimer = 0.18;
    this.setFlash(true);
    if (attackerPos) {
      const dx = this.pos.x - attackerPos.x, dz = this.pos.z - attackerPos.z;
      const d = Math.hypot(dx, dz) || 1;
      this.vel.x += dx / d * 6; this.vel.z += dz / d * 6; this.vel.y += 3.5;
    }
    Audio.play('hit');
    if (this.health <= 0) this.die();
  }

  die() {
    Game.scene.remove(this.group);
    this.dead = true;
    // drops
    for (const drop of this.def.drops) {
      const n = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      if (n > 0) {
        const stack = drop.block !== undefined ? { block: drop.block, count: n } : { item: drop.item, count: n };
        Game.spawnPickup(this.pos.x, this.pos.y + 0.5, this.pos.z, stack);
      }
    }
    Game.spawnParticles(this.pos.x, this.pos.y + 0.6, this.pos.z, 0xffffff, 10);
  }
}

/* ---------------- mob manager / spawner ---------------- */
const Mobs = {
  list: [],
  spawnTimer: 0,

  clear() {
    for (const m of this.list) Game.scene.remove(m.group);
    this.list = [];
  },

  update(dt, world, player, isNight) {
    // despawn far / remove dead
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i];
      if (m.dead) { this.list.splice(i, 1); continue; }
      const d = m.pos.distanceTo(player.pos);
      if (d > 52) { Game.scene.remove(m.group); this.list.splice(i, 1); continue; }
      m.update(dt, world, player, isNight);
    }
    // spawn logic
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 2.2;
      const passiveCount = this.list.filter(m => !m.def.hostile).length;
      const hostileCount = this.list.filter(m => m.def.hostile).length;
      if (isNight) {
        if (hostileCount < 8) this.trySpawn(world, player, 'zombie');
      } else if (passiveCount < 6) {
        this.trySpawn(world, player, Math.random() < 0.5 ? 'pig' : 'sheep');
      }
    }
  },

  trySpawn(world, player, type) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 18;
      const x = Math.floor(player.pos.x + Math.cos(ang) * dist);
      const z = Math.floor(player.pos.z + Math.sin(ang) * dist);
      const y = world.surfaceY(x, z) + 1;
      if (y <= WATER_Y + 1 || y > 70) continue;
      const ground = world.getBlock(x, y - 1, z);
      if (!OPAQUE[ground] && ground !== BLOCK_ID.LEAVES) continue;
      if (world.getBlock(x, y, z) !== BLOCK_ID.AIR || world.getBlock(x, y + 1, z) !== BLOCK_ID.AIR) continue;
      this.list.push(new Mob(type, x + 0.5, y + 0.02, z + 0.5));
      return;
    }
  },

  /* ray vs mob AABBs — returns nearest hit or null */
  raycast(origin, dir, maxDist) {
    let best = null;
    for (const m of this.list) {
      const hw = m.def.w / 2 + 0.15, h = m.def.h;
      const min = [m.pos.x - hw, m.pos.y, m.pos.z - hw];
      const max = [m.pos.x + hw, m.pos.y + h, m.pos.z + hw];
      let tmin = 0, tmax = maxDist, ok = true;
      const o = [origin.x, origin.y, origin.z], d = [dir.x, dir.y, dir.z];
      for (let a = 0; a < 3 && ok; a++) {
        if (Math.abs(d[a]) < 1e-8) { if (o[a] < min[a] || o[a] > max[a]) ok = false; }
        else {
          let t1 = (min[a] - o[a]) / d[a], t2 = (max[a] - o[a]) / d[a];
          if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
          tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
          if (tmin > tmax) ok = false;
        }
      }
      if (ok && tmin < maxDist && (best === null || tmin < best.dist)) best = { mob: m, dist: tmin };
    }
    return best;
  },
};
