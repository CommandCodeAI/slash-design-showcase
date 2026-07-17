# 3D Motion Designer Portfolio: one prompt, one model

> ### Try this benchmark yourself — with Command Code
> This benchmark was built in one-shot with [`/design`](https://commandcode.ai/docs/slash-commands/design) in [Command Code](https://commandcode.ai).
>
> **How to run this exact benchmark:**
> 1. Install Command Code:
>    ```bash
>    npm i -g command-code
>    ```
>    Quickstart: [commandcode.ai/docs/quickstart](https://commandcode.ai/docs/quickstart) · npm: [command-code](https://www.npmjs.com/package/command-code) · [`/design` command](https://commandcode.ai/docs/slash-commands/design)
> 2. Start Command Code (`cmd` on mac/linux, `cmdc` on windows, or `commandcode` anywhere), then run `/design` and paste the prompt below
> 3. Use Command Code to generate and compare - same prompt, one shot per model
>
> Built with [Command Code](https://x.com/CommandCodeAI)
> Showcase: [CommandCodeAI/slash-design-showcase](https://github.com/CommandCodeAI/slash-design-showcase)
> Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)

## Prompt

Create a stunning, futuristic single-file HTML landing page for a 3D motion designer named "Alex Rivera". Use Tailwind CSS via CDN.                                       
                                                                                                                                                                                    
  Hero section: Massive 3D canvas background using Three.js (include Three.js via CDN) showing a rotating, glowing abstract geometric sculpture that reacts to mouse movement. Hero 
  text "Crafting Worlds in Motion" with dramatic reveal animation.                                                                                                                  
                                                                                                                                                                                    
  Navigation: Glassmorphic navbar that becomes solid on scroll.                                                                                                                     
                                                                                                                                                                                    
  Sections:                                                                                                                                                                         
  - About with parallax 3D floating portrait                                                                                                                                        
  - Selected Works grid with hover 3D tilt effect (using CSS + vanilla JS)                                                                                                          
  - Scroll-driven horizontal gallery where scrolling reveals more 3D pieces                                                                                                         
  - Creative Process timeline with animated 3D icons                                                                                                                                
  - Contact with interactive 3D form elements                                                                                                                                       
                                                                                                                                                                                    
  Incorporate smooth scroll-triggered animations (GSAP via CDN or pure CSS/JS), particle effects, dark cyber-minimal theme with neon accents. Make it incredibly creative and       
  high-end. Output the complete self-contained HTML code in one file. Include all scripts inline. 



https://commandcode.ai/share/15b3ab5a

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 3 (build → verify/continue → recolor) |
| Output size (final) | 56,273 bytes / 1,073 LOC |
| Est. cost, floor (final file only) | ~$0.21 |
| **Est. cost, full session** | **~$0.57** |

Two numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep.

The **full-session estimate** accounts for the other two turns: a `--continue` that ran a `node --check` verification pass (small output, but still tokens), and a `/design recolor` whose reasoning ran long (full OKLCH/grey-test color theory before landing on the volt-and-ember palette) even though the actual edit was cheap — a single ~50-line Node script did all ~102 hex/rgba swaps server-side rather than the model re-emitting the whole file. Modeling total output at ~2.6× the final code's size (reasoning across all three turns, no repeated full-file rewrites needed) and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.57 — a modeled estimate, not a metered bill, but a closer read than the floor above.