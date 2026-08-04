# qwen3.8-max — LUNAR storytelling build

Build metadata for this directory's [`/design`](https://commandcode.ai/docs/slash-commands/design) run. The prompt is documented in [`../readme.md`](../readme.md); the output is [`index.html`](index.html). This build went through the full agentic `/design` flow (a mid-run connection error, a `continue`, and three small self-fix edits — see below), not a single completion call, so "one-shot" here means one user-facing prompt, not one API call.

## Numbers

| Model | Dir | LOC | Output size | Est. output tokens | Est. cost, floor (final file only) | Est. cost, full session | Time |
|---|---|---:|---:|---:|---:|---:|---|
| qwen3.8-max | `qwen3.8-max/` | 1,083 | 54,751 bytes | ~13,700 | **~$0.04** | **unknown — see note below** | ~63 min wall clock (see caveat) |

## How each figure was derived

- **Output size / LOC:** measured from the kept `index.html` (`stat` = 54,751 bytes, `wc -l` = 1,083).
- **Est. output tokens:** the repo's standard approximation — kept bytes ÷ 4 → 54,751 ÷ 4 ≈ **13,688 tokens**. This is a stand-in, not a real tokenizer count; dense HTML/CSS/JS can deviate from prose at equal byte counts.
- **Floor cost:** kept-file tokens × the repo-implied ~$2.91/MTok output rate (anchored to the flappy-bird qwen3.8-max run: a user-reported **$0.0248** for 34,096 bytes / ~8,524 estimated tokens) → 13,688 × $2.91/MTok ≈ **$0.04**. Like every other floor in this repo, it only counts the tokens in the kept file — no reasoning tokens, no verification/edit turns, no input tokens at all.
- **Full-session cost: genuinely unknown for this build.** This repo has one qwen3.8-max `/design` run with an actually **metered** total cost — `creative-portfolio/qwen3.8-max`, which billed **$6.70** for a 47,238-byte file across 35 API calls (2,702,077 input tokens, 96% of them prompt-cache reads, plus screenshot-based browser verification in the loop). That $6.70 was driven almost entirely by the shape of the session — call count and accumulated input context — not by output size (2.7M input tokens vs. 41K output tokens makes that clear). An earlier version of this doc scaled $6.70 by this file's output-byte ratio to get "~$7.77"; that math doesn't hold up, because output size isn't what drove the real cost, and this session's own call count was never captured. The honest statement is: this build's real full-session cost is unknown, the floor above is a lower bound, and the creative-portfolio number shows it's plausible for a qwen3.8-max `/design` session to land one to two orders of magnitude above that floor — not that this specific session did.
- **Input:** the ~180-token prompt plus `/design` skill overhead is negligible against the floor figure above, but negligible-against-the-floor says nothing about the unknown full-session total, which is dominated by turns and context growth, not the initial prompt.
- **Time:** not metered inside the session. The observable wall-clock window is session artifacts first appearing at **19:28:37** to the final file write at **20:32:00** (local +0600, 2026-08-03) ≈ **63 minutes**. That window includes a mid-run connection error + a user `continue`, and idle time, so it overstates actual generation time. The file itself was written in one `write_file` call, then received three small self-fix edits and syntax/smoke-test verification.

## Caveats (read before treating the cost as a bill)

- The ~$0.04 **floor** counts only the tokens in the kept file. Any reasoning/thinking tokens, input tokens, and the output spent on verification (node syntax checks, vm smoke test, edits) across the extra turns this build actually took are billed but not counted here — so this number understates the real cost by an unknown, possibly large amount.
- Do **not** rescale the creative-portfolio $6.70 figure onto this build by output size — that was tried in an earlier version of this doc and doesn't hold up. The $6.70 was a function of call count and accumulated input context (mostly cache reads across 35 calls), which has no established relationship to final output bytes. Without this session's own call count, there's no sound way to turn $6.70 into a specific number for this build.
- **Bytes ÷ 4 is an approximation**, not a tokenizer count, for the floor above. A `count_tokens()` call against the real prompt + output would be the accurate version.
- Neither figure is a substitute for this session's own metered usage log, which isn't available in this directory.
