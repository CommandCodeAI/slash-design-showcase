# Nova Surge — design decisions

One-shot `/design create` build: single-file Canvas vertical shooter, 400x700 portrait, DPR-scaled to fit viewport.

- **Identity**: "NOVA SURGE" — deep-space navy gradient with drifting nebula blobs, cyan/electric-blue player ship, hot magenta/green/violet/orange enemy cast, gold power-ups. Orbitron display type.
- **Palette roles**: cyan = player/ally fire, magenta-red = threat/boss, gold = score/power, green = life/shield accent. Enemy colors are distinct per archetype (wasp/maw/wraith/jugg/boss).
- **Feel**: additive-blend glow sprites (pre-rendered, cached) instead of per-entity shadowBlur on bullets; screen shake, hit-flash, slow-mo on death and boss kill, floating score text, 3-layer parallax starfield with level-up speed pulse.
- **Controls**: arrows/AD + space (hold = overdrive fire rate) on keyboard; on touch, drag-anywhere-to-move with grab offset, L/R buttons, and a FIRE button that genuinely gates overdrive (not cosmetic).
- **Fairness**: player hitbox is smaller than the sprite (r-2); i-frames with blink after a hit; shield absorbs one hit.
- **Persistence**: best score in localStorage (novasurge_best), announced via aria-live region.
- **Audio**: fully procedural WebAudio (osc + filtered noise), unlocked on first gesture, M to mute.
- **Tuning**: player lasers 1300 px/s upward; enemies descend slowly and hover in the top band (fall → hover → exit) so the player can land shots without chasing.
