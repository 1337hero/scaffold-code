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
| `adapters/` | Per-runtime enforcement: Pi extension, Claude Code hooks, portable shell gate. |

## The loop (what BOOT enforces)
```
Session boot:  ORIENT      (once)
Per task:      FRAME → WORK → REVIEW
Session end:   CLOSE OUT    (once, or when you hand back a question)
```

## How it ports
The substance is plain markdown; the only per-runtime piece is the **injection** — the hook or
extension that guarantees `BOOT.md` loads at session start (the **keystone**, closing the "never
start cold" bootstrap paradox). Adapters for that ship in `adapters/`; they carry no rail logic
of their own beyond enforcing what the markdown already states.

## Enforcement (the per-runtime slot)
Rails are read-and-trusted by default. Adapters close the gap where the runtime can — and they
install **once per machine** (`scaffold setup`), not per project; the presence of `.scaffold/`
in a repo is the toggle that activates them:
- **Claude Code:** global hooks in `~/.claude/settings.json`, guarded on `.scaffold/BOOT.md`
  existing — `SessionStart` injects `BOOT.md`; `PreToolUse` blocks `git push` to the default
  branch; `Stop` blocks ending with code changed but closeout incomplete (STATE roll + dated
  log entry).
- **Pi:** `~/.pi/agent/extensions/scaffold.ts` — `before_agent_start` appends `BOOT.md` to the
  system prompt; `tool_call` blocks push-to-default; `agent_end` steers the agent back to
  finish an incomplete closeout.
- **Anything else (portable floor, travels with the repo):** `cookbook/closeout-check.sh` —
  fails loudly on default-branch, unchanged STATE, missing log entry, or a secret in the diff.

Don't try to mechanize the judgment rails (derive-don't-ask, stay-in-scope) — that produces theater.

## Install & deploy
One-time per machine:
```bash
curl -fsSL https://raw.githubusercontent.com/1337hero/scaffold-code/main/install.sh | bash
```
That clones this repo to `~/.scaffold-code` (or uses an existing checkout), puts `scaffold` on
PATH, and runs `scaffold setup` to install the pi + Claude Code adapters globally.

Per project:
```bash
scaffold init <repo>    # engine + state templates; fill rails/standards.md and memory/STATE.md
scaffold update [--all] # refresh engine files after the main repo changes; never touches rails/ or memory/
scaffold status [--all] # drift check against the canonical engine
```
Engine files (`BOOT.md`, `cookbook/`) are stock and stamped with a `VERSION`; `rails/` and
`memory/` are project-owned and never overwritten. **Engineering rails only** — client strategy
and skill distribution are separate concerns.
