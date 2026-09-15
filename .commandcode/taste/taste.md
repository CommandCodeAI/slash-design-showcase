# Taste

## Communication

- Writes terse, lowercase, informal prompts with minimal context ("what you think", "can you gimme crtics report of these issue open pr <url>") and expects the agent to infer scope and intent rather than ask clarifying questions. Confidence: 0.65
- After a detailed objective report, explicitly asks for the assistant's own subjective judgment — values a candid, blunt opinion with a clear verdict/ranking over a neutral restatement of findings. Confidence: 0.7

## Workflow

- Works as a reviewer/maintainer of open-source repos: asks for critique passes over a repo's open PRs (diffs fetched from GitHub) rather than for code to be written. Confidence: 0.6
