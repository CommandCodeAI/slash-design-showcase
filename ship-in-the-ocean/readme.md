# MV Marenostrum — Open Ocean

> ### Try this yourself — with Command Code
> Built in one-shot with [`/design`](https://commandcode.ai/docs/slash-commands/design) in [Command Code](https://commandcode.ai), then iterated on: the agent played the generated scene a couple of times, checked it in the browser, and fixed the UI and scene based on what it saw.
>
> Install: `npm i -g command-code` · Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)
> Showcase: [CommandCodeAI/slash-design-showcase](https://github.com/CommandCodeAI/slash-design-showcase)

## Prompt

Create a complete, single-file HTML web app using Three.js (via CDN) that shows a detailed low-poly cargo ship sailing on a realistic ocean.

Requirements:
- Fully self-contained index.html (no external files except Three.js CDN and optional water/shader helpers if needed)
- Low-poly but high-quality cargo/container ship model built with Three.js primitives or simple geometry
- Many colorful shipping containers (red, blue, green, yellow, orange, white, etc.) stacked realistically on the deck in rows and multiple levels
- Realistic animated ocean water with waves, reflections, foam, and a visible wake behind the moving ship
- The ship should slowly move forward across the ocean
- Smooth free camera controls (OrbitControls + ability to fly around the ship)
- Nice lighting, sky gradient or simple sky, ambient + directional light, soft shadows if possible
- Good performance (instanced meshes for containers if many)
- Clean, polished look — water and ship should feel alive, not random or broken
- Include a simple UI overlay with instructions (e.g. mouse drag to rotate, scroll to zoom, etc.)
- Make the overall quality high: better container placement, better water shader/animation, better ship proportions, and more coherent environment than a basic demo

## Model

| Model | File | LOC | Bytes | Est. cost |
|---|---|---:|---:|---:|
| DeepSeek V4.1 Flash | `index.html` | 1,759 | 68,661 | $0.055 


## Share

[commandcode.ai/share/0912969f](https://commandcode.ai/share/0912969f)
