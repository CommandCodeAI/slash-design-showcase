# Photography Portfolio: one prompt, one model

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

Create an elegant minimalist single-file HTML photography portfolio landing page for "Elena Voss Photography". Tailwind CSS. 
                                                                                                                                       
  Hero: Full bleed hero image with 3D floating frame effect around the main photo (CSS 3D + JS).                                       
                                                                                                                                       
  Infinite scroll masonry grid that loads more images with smooth fade-ins.                                                            
  Clicking an image opens a 3D lightbox gallery (images float and rotate slightly).                                                    
                                                                                                                                       
  About section with subtle parallax.                                                                                                  
  Journal / Stories section with scroll horizontal cards.                                                                              
  Contact with elegant form.                                                                                                           
                                                                                                                                       
  Use soft elegant typography, lots of whitespace, and tasteful 3D interactions. Very high aesthetic quality. Output complete HTML.

https://commandcode.ai/share/8836fe59

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 2 (build + continue) |
| Output size (final) | 36,680 bytes / 655 LOC |
| Est. cost, floor (final file only) | ~$0.14 |
| **Est. cost, full session** | **~$0.27** |

Two numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep.

The **full-session estimate** accounts for the rest of the real conversation — which, compared to the other builds in this repo, was unusually clean: a single write of the whole file after a long upfront design-planning reasoning pass, then a `--continue` turn that only ran a `node -e` syntax check on the inline scripts and gave a short confirmation. No rewrites, no debugging chain, no follow-up edits to the code at all. Modeling total output at ~1.9× the final code's size (mostly the initial reasoning, since the second turn was nearly free) and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.27 — a modeled estimate, not a metered bill, but the lightest full-session premium of any build in this repo so far, reflecting how little iteration this one actually took.