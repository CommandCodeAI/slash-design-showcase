# - Prefers 9:16 (portrait) aspect ratio for games — default to mobile-first portrait layout. Confidence: 0.9
- Prefers 9:16 (portrait) aspect ratio for games — default to mobile-first portrait layout. Confidence: 0.9
- Prefers simple, straightforward code over clever/over-engineered solutions — "don't make it hard." Confidence: 0.8
- Expects the game/artifact to be immediately playable and bug-free — "it's not playable at all" is a critical failure. Confidence: 0.9
- Game-over state must support restart via both canvas click/tap and keyboard (Enter/Space) — all input methods should work after dying. Confidence: 0.8
- Game visuals should match the source material's authentic design (e.g., Flappy Bird pipes extend from top/bottom screen edges, not floating with gaps at edges). Confidence: 0.8
- Pays attention to sprite-level visual polish — character facial features (e.g., eye/pupil alignment, gaze direction) must look correct, not cross-eyed or misaligned. Confidence: 0.7
- Side-scrolling/side-view characters must use proper side-profile perspective — show only one eye (not two) since the character is viewed from the side, not front-facing. Confidence: 0.8
- Collision detection hitboxes must precisely match visual rendering — if visual elements (e.g., pipe caps) extend wider than the core body, the hitbox width must account for the full visual extent, not just the body. Confidence: 0.8
