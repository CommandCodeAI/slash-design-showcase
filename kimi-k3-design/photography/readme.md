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

## Models

| Model | Dir | LOC | Est. cost |
|---|---|---:|---:|
| Kimi K3 | `kimi-k3/` | 655 | ~$0.14* |
| qwen3.8-max | `qwen3.8-max/` | 889 | ~$0.03† |

One prompt-thread per model, no re-rolls. Kimi K3 sent 2 prompts (build + continue); qwen3.8-max was a single `/design` agentic run. Both costs above are **floors**: final kept file's output bytes ÷ 4 × the model's output price (36,680 bytes at Kimi K3's $15/MTok; 44,425 bytes at the repo-implied ~$2.91/MTok for qwen3.8-max) — they only count the last file you'd actually keep, not the rest of the session.

\* Kimi K3's real session cost is closer to **~$0.27**. The build was a single write of the whole file after a long upfront design-planning reasoning pass, then a `--continue` turn that only ran a `node -e` syntax check — no rewrites, no debugging chain. Modeling total output at ~1.9× the final code's size and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.27 — modeled, not metered, but the lightest full-session premium of any build in this repo so far.

† qwen3.8-max's real session cost is **unknown**, and ~$0.03 likely understates it badly. This repo's one actually-metered qwen3.8-max `/design` run, `creative-portfolio/qwen3.8-max`, billed a real $6.70 for a similarly-sized 47,238-byte file — driven almost entirely by call count and accumulated input context (35 API calls, 2.7M input tokens, mostly cache reads, plus screenshot-based verification), not by output size. This build's own call count wasn't logged, so there's no sound way to turn that $6.70 into a specific number here. Read ~$0.03 as a lower bound only.