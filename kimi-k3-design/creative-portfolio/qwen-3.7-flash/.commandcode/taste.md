# Design Taste — Creative Portfolio

## Dark Monochrome Palette
- Use near-black backgrounds (oklch under 0.12) for dark interfaces
- Warm gray neutrals instead of pure gray — slight blue/purple tint keeps surfaces alive
- Single accent color (amber/copper oklch ~65/0.17/75) used sparingly on CTAs and focus rings
- Accent must never appear on backgrounds or large decorative fills

## Typography Hierarchy
- Display font: Space Grotesk (bold geometric sans for headlines)
- Body font: Inter (clean humanist sans for readability)
- Hero text uses dramatic scale with clamp() responsive sizing up to 10rem
- Letter-spacing: tight (-0.03em to -0.04em) on display, normal on body
- Italic accents on single words within headlines for visual contrast

## Motion System
- Easing: expo-out cubic-bezier(0.16, 1, 0.3, 1) for most animations
- Entrance duration: 500-800ms depending on scale of movement
- Stagger children with 80ms increments plus random jitter
- Only animate transform, opacity, and filter — never layout properties
- All motion needs prefers-reduced-motion fallbacks

## Custom Cursor Behavior
- Small dot (8px) follows cursor with mix-blend-mode: difference
- Larger ring (48px) on interactive elements (buttons, links, project cards)
- Extra-large ring (64px) on oversized text/email
- Follower element trails behind with spring physics (0.15 lerp factor)

## Layout Patterns
- Full-bleed sections with no dead margins except where intentional
- Asymmetric grid layouts preferred over centered symmetry
- Horizontal scrolling for project showcases
- Generous whitespace: 12rem+ between major sections

## Project Card Treatment
- Gradient overlay reveal on hover (bottom-up gradient)
- Title color shifts to accent on hover
- Image scales slightly (1.08x) with container staying still
- Arrow icon rotates and slides into position on hover

## Color Usage Rules
- Oklch color space for all palette definitions
- Chroma clamped at lightness extremes (near-white burns, near-black muddies)
- Neutrals tinted toward brand hue (well under 0.02 chroma)
- Never use indigo/blue-purple on tech/developer projects
