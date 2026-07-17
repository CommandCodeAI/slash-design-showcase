/* ============================================================
   player.js — first-person controller: WASD, jump, gravity,
   swimming, flying, AABB-vs-voxel collision, fall damage.
   The collideMove helper is shared with mobs.
   ============================================================ */
'use strict';

/* Move an AABB body through the voxel world, one axis at a time.
   pos = feet-center position (mutated). Returns collision flags. */
function collideMove(world, pos, vel, dt, halfW, height) {
  const flags = { onGround: false, hitHead: false, hitWall: false };
  const isSolidAt = (x, y, z) => {
    const id = world.getBlock(x, y, z);
    return id !== BLOCK_ID.AIR && !!BLOCKS[id] && !!BLOCKS[id].solid;
  };
  const overlaps = () => {
    const x0 = Math.floor(pos.x - halfW), x1 = Math.floor(pos.x + halfW);
    const y0 = Math.floor(pos.y), y1 = Math.floor(pos.y + height - 0.001);
    const z0 = Math.floor(pos.z - halfW), z1 = Math.floor(pos.z + halfW);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        for (let z = z0; z <= z1; z++)
          if (isSolidAt(x, y, z)) return { x, y, z };
    return null;
  };
  const EPS = 0.001;

  // X axis
  pos.x += vel.x * dt;
  let hit = overlaps();
  if (hit) {
    pos.x = vel.x > 0 ? hit.x - halfW - EPS : hit.x + 1 + halfW + EPS;
    vel.x = 0; flags.hitWall = true;
  }
  // Z axis
  pos.z += vel.z * dt;
  hit = overlaps();
  if (hit) {
    pos.z = vel.z > 0 ? hit.z - halfW - EPS : hit.z + 1 + halfW + EPS;
    vel.z = 0; flags.hitWall = true;
  }
  // Y axis
  pos.y += vel.y * dt;
  hit = overlaps();
  if (hit) {
    if (vel.y > 0) { pos.y = hit.y - height - EPS; flags.hitHead = true; }
    else { pos.y = hit.y + 1 + EPS; flags.onGround = true; }
    vel.y = 0;
  }
  return flags;
}

class Player {
  constructor(world) {
    this.world = world;
    this.pos = new THREE.Vector3(0.5, 40, 0.5);   // feet center
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.halfW = 0.3; this.height = 1.8; this.eye = 1.62;
    this.onGround = false;
    this.inWater = false;
    this.fly = false;
    this.creative = false;
    this.sprinting = false;
    this.fallStartY = null;
    this.health = 20; this.hunger = 20;
    this.hungerTimer = 0; this.regenTimer = 0; this.starveTimer = 0;
    this.attackCooldown = 0;
    this.spawnPoint = this.pos.clone();
    this.dead = false;
  }

  lookDelta(dx, dy) {
    const sens = 0.0026;
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;
    const lim = Math.PI / 2 - 0.001;
    this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
  }

  eyePos(out) {
    return out.set(this.pos.x, this.pos.y + this.eye, this.pos.z);
  }
  lookDir(out) {
    const cp = Math.cos(this.pitch);
    return out.set(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp).normalize();
  }

  update(dt, input) {
    const w = this.world;
    // wish direction in world space from yaw
    let fx = 0, fz = 0;
    if (input.forward) fz -= 1;
    if (input.back) fz += 1;
    if (input.left) fx -= 1;
    if (input.right) fx += 1;
    const len = Math.hypot(fx, fz) || 1;
    fx /= len; fz /= len;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const wishX = fx * cos + fz * sin;
    const wishZ = -fx * sin + fz * cos;

    this.sprinting = input.sprint && input.forward && !this.fly && this.hunger > 6;

    // water state: feet or chest submerged
    const feetBlock = w.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y), Math.floor(this.pos.z));
    const chestBlock = w.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y + 0.9), Math.floor(this.pos.z));
    this.inWater = feetBlock === BLOCK_ID.WATER || chestBlock === BLOCK_ID.WATER;

    if (this.fly) {
      const speed = input.sprint ? 16 : 10.5;
      this.vel.x = wishX * speed;
      this.vel.z = wishZ * speed;
      this.vel.y = (input.jump ? speed * 0.8 : 0) + (input.sneak ? -speed * 0.8 : 0);
    } else {
      let speed = this.sprinting ? 5.6 : 4.3;
      if (input.sneak) speed = 1.4;
      if (this.inWater) speed *= 0.55;
      const accel = this.onGround ? 13 : (this.inWater ? 6 : 3.2);
      const k = Math.min(1, accel * dt);
      this.vel.x += (wishX * speed - this.vel.x) * k;
      this.vel.z += (wishZ * speed - this.vel.z) * k;

      if (this.inWater) {
        this.vel.y -= 7 * dt;                        // gentle sink
        if (input.jump) this.vel.y = Math.min(this.vel.y + 42 * dt, 3.4);  // swim up
        this.vel.y = Math.max(this.vel.y, -2.2);
        this.vel.y *= (1 - Math.min(1, 1.6 * dt));   // water drag
      } else {
        this.vel.y -= 28 * dt;
        if (this.vel.y < -46) this.vel.y = -46;      // terminal velocity
        if (input.jump && this.onGround) {
          this.vel.y = 9.0;
          this.onGround = false;
        }
      }
    }

    const flags = collideMove(w, this.pos, this.vel, dt, this.halfW, this.height);
    this.onGround = flags.onGround;

    // fall damage tracking
    if (!this.fly && !this.inWater) {
      if (this.onGround) {
        if (this.fallStartY !== null) {
          const dist = this.fallStartY - this.pos.y;
          if (dist > 3.2 && !this.creative) {
            this.damage(Math.floor(dist - 3), 'fall');
          }
          this.fallStartY = null;
        }
      } else if (this.vel.y > 0.5 || this.fallStartY === null) {
        if (this.fallStartY === null) this.fallStartY = this.pos.y;
        else this.fallStartY = Math.max(this.fallStartY, this.pos.y);
      }
    } else {
      this.fallStartY = null;
    }

    // safety net: never fall out of the world
    if (this.pos.y < -8) { this.pos.y = 80; this.vel.set(0, 0, 0); }

    // hunger drain + regen / starvation (survival only)
    if (!this.creative && !this.dead) {
      const drainRate = this.sprinting ? 1 / 22 : 1 / 50;
      this.hungerTimer += dt * drainRate;
      if (this.hungerTimer >= 1) { this.hungerTimer = 0; this.hunger = Math.max(0, this.hunger - 1); UI.updateStatusBars(); }
      if (this.hunger >= 18 && this.health < 20) {
        this.regenTimer += dt;
        if (this.regenTimer >= 4) { this.regenTimer = 0; this.health = Math.min(20, this.health + 1); UI.updateStatusBars(); }
      } else this.regenTimer = 0;
      if (this.hunger <= 0 && this.health > 1) {
        this.starveTimer += dt;
        if (this.starveTimer >= 4) { this.starveTimer = 0; this.damage(1, 'starve'); }
      } else this.starveTimer = 0;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
  }

  damage(amount, kind) {
    if (this.creative || this.dead || amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
    UI.damageFlash();
    UI.updateStatusBars();
    Audio.play('hurt');
    if (this.health <= 0) {
      this.dead = true;
      Game.onPlayerDeath();
    }
  }

  eat(stack) {
    const it = ITEMS[stack.item];
    if (!it || !it.food || this.hunger >= 20) return false;
    this.hunger = Math.min(20, this.hunger + it.food);
    stack.count--;
    UI.updateStatusBars();
    UI.shakeHunger();
    Audio.play('eat');
    return true;
  }

  respawn() {
    this.pos.copy(this.spawnPoint);
    this.vel.set(0, 0, 0);
    this.health = 20; this.hunger = 20;
    this.dead = false;
    this.fallStartY = null;
  }
}
