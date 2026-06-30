# scaffold-code

Operating rails for an AI coding agent working a **single project**. Drop it into any repo as
`.scaffold/`, point your agent at `.scaffold/BOOT.md`, and it orients itself, works within the
project's standards, decides for itself where it safely can, and leaves a memory the next
session picks up.

## Why it exists
A `CLAUDE.md` states rules at rest — it can't sequence behavior, enforce a gate, or remember
what happened last week. scaffold-code is the missing **procedural** layer: a boot routine + a
loop + project memory. Runtime-agnostic — **the agent is the runtime, the files are the
program** (pure-agent + cookbook-on-demand, after `disler/the-library`).

## Layout
| Path | What it is |
|---|---|
| `BOOT.md` | Read first, every session. The loop + hard rails + derive-don't-ask. |
| `rails/standards.md` | This project's standards — the gates the agent enforces. |
| `cookbook/` | The session-boundary procedures (orient, closeout), loaded on demand. |
| `memory/STATE.md` | Living "where the project stands." |
| `memory/log/` | Dated session closeouts — continuity across sessions and agents. |

## The loop (what BOOT enforces)
```
Session boot:  ORIENT      (once)
Per task:      FRAME → WORK → REVIEW
Session end:   CLOSE OUT    (once, or when you hand back a question)
```

## How it ports
The substance is plain markdown; the only per-runtime piece is the **trigger**, and it carries
no logic — it just points the agent at `BOOT.md` (a `/scaffold` command, a system-prompt
include, etc.).

## Enforcement (the per-runtime slot)
Rails are grade-H (read-and-trusted) by default. Close the gap in layers, cheapest first:
- **Portable (any shell agent):** the closeout self-check in `cookbook/closeout.md` — fails
  loudly on push-to-main, unchanged STATE, missing log entry, or a secret in the diff.
- **Claude Code (hooks):** `SessionStart` → inject `BOOT.md` (the **keystone** — guarantees BOOT
  loads at all, closing the "never start cold" bootstrap paradox); `PreToolUse` on `git push` to
  main → block; `Stop` → if tracked code changed but `STATE.md` didn't, block.
- **Pi / Agent SDK:** the BOOT inject is a system-prompt include; the rest is the portable check.

Don't try to mechanize the judgment rails (derive-don't-ask, stay-in-scope) — that produces theater.

## Deploy
Copy this tree into a repo as `.scaffold/`, fill `rails/standards.md` and `memory/STATE.md`
(especially `Key files / commands`), commit. **Engineering rails only** — client strategy and
skill distribution are separate concerns (see `docs/design-notes.md`).
