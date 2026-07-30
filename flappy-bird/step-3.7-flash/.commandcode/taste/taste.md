## Game & UI Layout
- Canvas elements for games and interactive UI should use fixed dimensions (e.g., w=420, h=640) instead of responsive scaling or dynamic resizing. Confidence: 0.8

## Code Architecture & Quality Expectations
- Expects immediate, guaranteed functionality upon execution; highly intolerant of silent failures, race conditions, or non-responsive UI states. Confidence: 0.9
- When underlying architecture contains conflicting loops or tangled state management, prefers a clean-slate rewrite via full file replacement rather than incremental patches. Confidence: 0.7

## Communication Style
- Direct and concise; focuses on functional requirements and immediate blockers without unnecessary elaboration. Confidence: 0.8
