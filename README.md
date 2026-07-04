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
| `BOOT.md` | Read first, every session. Hard rails + the two imperatives + derive-don't-ask. |
| `rails/standards.md` | This project's standards — the gates the agent enforces. |
| `cookbook/` | Procedures loaded on demand: orient, the per-task loop, closeout. |
| `memory/STATE.md` | Living "where the project stands." |
| `memory/log/` | Dated session closeouts — continuity across sessions and agents. |
| `hooks/pre-push` | Environment-level push protection, installed into `.git/hooks/`. |
| `adapters/` | Per-runtime injection: Pi extension, Claude Code hooks. |

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

## Enforcement (in the environment, not the runtime)
Rails are read-and-trusted by default; where they can be mechanized, they're enforced at the
boundary of reality — never by parsing what an agent says it's doing:
- **Push protection:** a git `pre-push` hook (`.scaffold/hooks/pre-push`), installed into
  `.git/hooks/` by `scaffold init`/`update`. Blocks any push to the default branch, from any
  runtime, agent, or phrasing; `.scaffold/`-only commits (STATE rolls, log entries) are exempt;
  humans override with `SCAFFOLD_OFF=1`.
- **Closeout:** `cookbook/closeout-check.sh` — an outcome gate, portable to any shell-capable
  agent. Passes untouched when nothing shipped; fails loudly on code-on-default-branch,
  unchanged STATE, a log entry older than the last code change, or a secret in the diff.
- **Adapters (once per machine, `scaffold setup`)** carry no rail logic — they only inject
  `BOOT.md` at session start (the keystone) and relay the closeout gate's verdict at session
  end. Claude Code: `SessionStart` + `Stop` hooks. Pi: `before_agent_start` + `agent_end`.

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
scaffold init <repo>    # engine + state templates + pre-push hook; fill rails/standards.md and memory/STATE.md
scaffold update [--all] # refresh engine files + hook after the main repo changes; never touches rails/ or memory/
scaffold status [--all] # drift check against the canonical engine
```
Engine files (`BOOT.md`, `cookbook/`) are stock and stamped with a `VERSION`; `rails/` and
`memory/` are project-owned and never overwritten. **Engineering rails only** — client strategy
and skill distribution are separate concerns.
