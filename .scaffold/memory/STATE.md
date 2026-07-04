# Project State

_Last updated: 2026-07-03 by bitter-lesson-diet session_

## What this project is
scaffold-code — operating rails for AI coding agents working a single project. A `.scaffold/`
engine (BOOT + cookbook + memory + rails) deployed into repos by `bin/scaffold`, with
enforcement in the environment (git pre-push hook, closeout outcome gate) and thin per-runtime
injection adapters (pi, Claude Code).

## Current focus
Bitter Lesson diet: shrink cognition scaffolding, move enforcement to environment/outcome
gates, keep memory + hard rails. Phases 1–3 done; 4–5 (standards diet, sunset conditions /
rails-off measurement) explicitly deferred by Mike.

## Next up
- Merge `feature/bitter-lesson-diet`, then `scaffold update --all` + `scaffold setup` to roll
  the hook out and replace the old parser adapters machine-wide.
- Split state templates out of the live `.scaffold/` (e.g. `templates/`) so this repo can
  dogfood its own STATE without polluting `scaffold init` (see Known issues).

## In flight
`feature/bitter-lesson-diet` — phases 1–3 committed (038f17a), not yet pushed/PR'd.

## Current branch / PR
`feature/bitter-lesson-diet`, no PR yet (awaiting Mike's go).

## Last shipped
2026-07-03 — 038f17a: pre-push hook replaces adapter command parsing; closeout becomes a pure
outcome gate (adapters relay `closeout-check.sh`); BOOT dieted to ~50 lines with the per-task
loop moved to `cookbook/loop.md`.

## Last verified
2026-07-03 — full sandbox run: pre-push hook 7/7 scenarios (block code-on-main, allow
.scaffold-only/feature/delete/first-push/override), closeout gate 6 scenarios (no-op pass,
untracked-on-main, STATE, log freshness, secret, guard.js Stop relay), `scaffold setup`
stale-hook retirement, `scaffold update` hook refresh + non-scaffold-hook warn.

## Known issues / watch list
- **Template pollution:** `memory/STATE.md` (this file) and `rails/standards.md` are both this
  repo's live state AND the templates `scaffold init` copies into new projects — this filled-in
  STATE now ships to new inits until templates are split into their own dir.
- Machines still running the pre-diet adapters keep the old PreToolUse/baseline behavior until
  `scaffold setup` is re-run.
- `closeout-check.sh` session ≈ branch approximation: a multi-day branch needs a log entry as
  fresh as its newest code change.

## Key files / commands
> A hand-curated **prior** — verify against the code; the code wins.

| File / command | Why it matters |
|---|---|
| `bin/scaffold` | the CLI: init/update/status/setup/list; ENGINE list defines what ships |
| `.scaffold/hooks/pre-push` | environment-level push protection, copied into `.git/hooks/` |
| `.scaffold/cookbook/closeout-check.sh` | the outcome gate; adapters only relay its verdict |
| `bash .scaffold/cookbook/closeout-check.sh` | run before declaring done |
| manual sandbox test | `scaffold init` a /tmp repo + bare remote; no automated test suite yet |
