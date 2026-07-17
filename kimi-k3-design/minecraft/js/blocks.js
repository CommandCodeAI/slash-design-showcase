/* ============================================================
   blocks.js — block registry, item registry, mining rules
   ============================================================ */
'use strict';

const BLOCK_ID = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, BEDROCK: 5,
  SAND: 6, GRAVEL: 7, WATER: 8, LOG: 9, LEAVES: 10, PLANKS: 11,
  CRAFTING_TABLE: 12, TORCH: 13, COAL_ORE: 14, IRON_ORE: 15,
  GOLD_ORE: 16, DIAMOND_ORE: 17, STONEBRICKS: 18, WOOL: 19, GLASS: 20,
};

/* tex: indices into the atlas. front defaults to side.
   hardness: seconds to break by hand. -1 = unbreakable. 0 = instant.
   tool: effective tool family. needsTool: no drop without it.
   minTier: 1 = wood+, 2 = stone+ (for needsTool blocks). */
const BLOCKS = {
  [BLOCK_ID.GRASS]:         { name: 'Grass Block', tex: { top: TEX.grass_top, side: TEX.grass_side, bottom: TEX.dirt }, solid: true, hardness: 0.9, tool: 'shovel', drop: BLOCK_ID.DIRT },
  [BLOCK_ID.DIRT]:          { name: 'Dirt', tex: { all: TEX.dirt }, solid: true, hardness: 0.75, tool: 'shovel' },
  [BLOCK_ID.STONE]:         { name: 'Stone', tex: { all: TEX.stone }, solid: true, hardness: 5, tool: 'pickaxe', needsTool: true, minTier: 1, drop: BLOCK_ID.COBBLE },
  [BLOCK_ID.COBBLE]:        { name: 'Cobblestone', tex: { all: TEX.cobble }, solid: true, hardness: 5.5, tool: 'pickaxe', needsTool: true, minTier: 1 },
  [BLOCK_ID.BEDROCK]:       { name: 'Bedrock', tex: { all: TEX.bedrock }, solid: true, hardness: -1 },
  [BLOCK_ID.SAND]:          { name: 'Sand', tex: { all: TEX.sand }, solid: true, hardness: 0.75, tool: 'shovel', gravity: true },
  [BLOCK_ID.GRAVEL]:        { name: 'Gravel', tex: { all: TEX.gravel }, solid: true, hardness: 0.9, tool: 'shovel', gravity: true },
  [BLOCK_ID.WATER]:         { name: 'Water', tex: { all: TEX.water }, solid: false, liquid: true, transparent: true, hardness: -1, replaceable: true },
  [BLOCK_ID.LOG]:           { name: 'Oak Log', tex: { top: TEX.log_top, side: TEX.log_side, bottom: TEX.log_top }, solid: true, hardness: 2.5, tool: 'axe' },
  [BLOCK_ID.LEAVES]:        { name: 'Oak Leaves', tex: { all: TEX.leaves }, solid: true, transparent: true, hardness: 0.35, tool: null, drop: null },
  [BLOCK_ID.PLANKS]:        { name: 'Oak Planks', tex: { all: TEX.planks }, solid: true, hardness: 2.5, tool: 'axe' },
  [BLOCK_ID.CRAFTING_TABLE]:{ name: 'Crafting Table', tex: { top: TEX.table_top, side: TEX.table_side, front: TEX.table_front, bottom: TEX.planks }, solid: true, hardness: 2.5, tool: 'axe' },
  [BLOCK_ID.TORCH]:         { name: 'Torch', tex: { all: TEX.torch }, solid: false, transparent: true, hardness: 0.05, customMesh: 'torch', light: true },
  [BLOCK_ID.COAL_ORE]:      { name: 'Coal Ore', tex: { all: TEX.coal_ore }, solid: true, hardness: 6, tool: 'pickaxe', needsTool: true, minTier: 1, drop: 'coal' },
  [BLOCK_ID.IRON_ORE]:      { name: 'Iron Ore', tex: { all: TEX.iron_ore }, solid: true, hardness: 7, tool: 'pickaxe', needsTool: true, minTier: 2 },
  [BLOCK_ID.GOLD_ORE]:      { name: 'Gold Ore', tex: { all: TEX.gold_ore }, solid: true, hardness: 7, tool: 'pickaxe', needsTool: true, minTier: 2 },
  [BLOCK_ID.DIAMOND_ORE]:   { name: 'Diamond Ore', tex: { all: TEX.diamond_ore }, solid: true, hardness: 8, tool: 'pickaxe', needsTool: true, minTier: 2, drop: 'diamond' },
  [BLOCK_ID.STONEBRICKS]:   { name: 'Stone Bricks', tex: { all: TEX.stonebricks }, solid: true, hardness: 5.5, tool: 'pickaxe', needsTool: true, minTier: 1 },
  [BLOCK_ID.WOOL]:          { name: 'White Wool', tex: { all: TEX.wool }, solid: true, hardness: 1.2, tool: null },
  [BLOCK_ID.GLASS]:         { name: 'Glass', tex: { all: TEX.glass }, solid: true, transparent: true, hardness: 0.45, tool: null },
};

// normalize tex: fill in side/bottom/front from `all`
for (const b of Object.values(BLOCKS)) {
  if (b.tex.all !== undefined) b.tex = { top: b.tex.all, side: b.tex.all, bottom: b.tex.all };
  if (b.tex.front === undefined) b.tex.front = b.tex.side;
  if (b.tex.bottom === undefined) b.tex.bottom = b.tex.side;
}

/* Non-block items. Tools: family/speed/tier/durability/damage.
   Foods: hunger restored. */
const ITEMS = {
  stick:         { name: 'Stick', stack: 64 },
  coal:          { name: 'Coal', stack: 64 },
  diamond:       { name: 'Diamond', stack: 64 },
  apple:         { name: 'Apple', stack: 64, food: 4 },
  pork:          { name: 'Raw Porkchop', stack: 64, food: 3 },
  flesh:         { name: 'Rotten Flesh', stack: 64, food: 2 },
  wood_pickaxe:  { name: 'Wooden Pickaxe', stack: 1, tool: 'pickaxe', speed: 2, tier: 1, durability: 60, damage: 2 },
  stone_pickaxe: { name: 'Stone Pickaxe', stack: 1, tool: 'pickaxe', speed: 4, tier: 2, durability: 132, damage: 3 },
  wood_axe:      { name: 'Wooden Axe', stack: 1, tool: 'axe', speed: 2, tier: 1, durability: 60, damage: 3 },
  stone_axe:     { name: 'Stone Axe', stack: 1, tool: 'axe', speed: 4, tier: 2, durability: 132, damage: 4 },
  wood_sword:    { name: 'Wooden Sword', stack: 1, tool: 'sword', speed: 1, tier: 1, durability: 60, damage: 4 },
  stone_sword:   { name: 'Stone Sword', stack: 1, tool: 'sword', speed: 1, tier: 2, durability: 132, damage: 5 },
  wood_shovel:   { name: 'Wooden Shovel', stack: 1, tool: 'shovel', speed: 2, tier: 1, durability: 60, damage: 2 },
  stone_shovel:  { name: 'Stone Shovel', stack: 1, tool: 'shovel', speed: 4, tier: 2, durability: 132, damage: 3 },
  diamond_pickaxe: { name: 'Diamond Pickaxe', stack: 1, tool: 'pickaxe', speed: 8, tier: 3, durability: 400, damage: 4 },
  diamond_axe:   { name: 'Diamond Axe', stack: 1, tool: 'axe', speed: 8, tier: 3, durability: 400, damage: 5 },
  diamond_sword: { name: 'Diamond Sword', stack: 1, tool: 'sword', speed: 1, tier: 3, durability: 400, damage: 7 },
  diamond_shovel: { name: 'Diamond Shovel', stack: 1, tool: 'shovel', speed: 8, tier: 3, durability: 400, damage: 3 },
};

/* ----- lookups that work for both blocks and items ----- */
function stackMax(stack) {
  if (stack.block !== undefined) return 64;
  const it = ITEMS[stack.item];
  return it ? it.stack : 64;
}
function stackName(stack) {
  if (stack.block !== undefined) return BLOCKS[stack.block].name;
  return ITEMS[stack.item] ? ITEMS[stack.item].name : '?';
}
function stackIcon(stack) {
  return Textures.icons[stack.block !== undefined ? 'block:' + stack.block : 'item:' + stack.item] || '';
}
function heldToolDef(stack) {
  if (!stack || stack.item === undefined) return null;
  const it = ITEMS[stack.item];
  return it && it.tool ? it : null;
}

/* ----- mining rules -----
   breakTime: seconds with the given held stack (null = hand).
   canHarvest: whether the block drops anything. */
function breakTime(blockId, heldStack) {
  const b = BLOCKS[blockId];
  if (!b || b.hardness < 0) return Infinity;
  if (b.hardness === 0) return 0;
  const tool = heldToolDef(heldStack);
  if (tool && b.tool === tool.tool) return Math.max(0.05, b.hardness / tool.speed);
  if (b.needsTool) return b.hardness * 3;          // wrong tool: slow and no drop
  return b.hardness;
}
function canHarvest(blockId, heldStack) {
  const b = BLOCKS[blockId];
  if (!b || !b.needsTool) return true;
  const tool = heldToolDef(heldStack);
  return !!(tool && tool.tool === b.tool && (tool.tier || 1) >= (b.minTier || 1));
}
