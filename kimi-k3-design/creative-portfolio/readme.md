# Creative Portfolio: one prompt, four models

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

> Design an Awwwards-winning personal portfolio website for a frontend developer/creative. Dark minimalist aesthetic, bold elegant typography, immersive hero section, smooth scroll animations, micro-interactions, and creative transitions.
>
> Sections: Hero, Selected Works (with filters), About, Process, Contact and gimme a downloadble .html file

## Models

| Model | Dir | LOC | Est. cost |
|---|---|---:|---:|
| Grok 4.5 | `grok/` | 1,997 | ~$0.20 |
| Fable 5 (Claude) | `fable/` | 646 | ~$0.40 |
| GPT-5.6 Sol | `gpt/` | 496 | ~$0.39 |
| kimi-k3 | `kimi/` | 1,711 | ~$0.06* |

One prompt per model, no re-rolls. Cost for Grok 4.5, Fable 5, and GPT-5.6 Sol uses the per-generation prices you specified. kimi-k3's cost is a rough floor estimate from output size only; it was not tracked as a billed figure.

## Verdict

**kimi-k3 wins on the best overall portfolio system.** It is the most coherent build here: dark and editorial, but also the most engineered. The split HTML/CSS/JS setup is cleaner than the giant single-file builds, the motion stack is stronger, and the interactions are the most complete - Lenis smooth scroll, GSAP reveals, pinned process flow, expandable work cards, floating preview, magnetic CTA, and a mobile-safe fallback path in the same build (`kimi/index.html`, `kimi/script.js`, `kimi/styles.css`).

**Grok 4.5** is the flashiest single-file result and the closest competitor. It brings the most obvious "Awwwards" energy: preload, custom cursor, work preview, mobile menu, orbiting hero motion, and more surface polish than GPT or Fable. The tradeoff is sprawl - it is harder to audit, and a few of its ideas feel stacked rather than composed.

**Fable 5** is the most restrained and editorial of the non-Kimi builds. It has a strong dark type system and a solid one-file implementation, but it is less ambitious in motion and interaction than Kimi or Grok.

**GPT-5.6 Sol** is the thinnest build. It hits the requested sections, but the interaction language is simpler and the whole page feels less finished than the others.

## Scorecard

| Model | Spec fidelity | Visual polish | Motion system | Mobile/responsive | Architecture | Mean | Cost | Quality/$ |
|---|:-:|:-:|:-:|:-:|:-:|---:|---:|---:|
| kimi-k3 | 5 | 5 | 5 | 4.5 | 5 | **4.90** | ~$0.06* | **~82** |
| Grok 4.5 | 5 | 5 | 5 | 4.5 | 4 | **4.70** | ~$0.20 | ~23.5 |
| Fable 5 | 5 | 4.5 | 4.5 | 4.5 | 4.5 | **4.50** | ~$0.40 | ~11.3 |
| GPT-5.6 Sol | 4 | 3.5 | 3.5 | 3.5 | 3.5 | **3.60** | ~$0.39 | ~9.2 |

## Notes

- n=1 per model, no re-rolls. A regeneration could move any score.
- This is a code-read benchmark, not a hands-on playtest. The scores reflect static review of the generated files and their interaction systems, not subjective browser use over time.
- Cost figures are not metered. Grok 4.5, Fable 5, and GPT-5.6 Sol use the per-generation prices you gave me; kimi-k3's number is still a rough floor estimate from output size and is not directly comparable.
