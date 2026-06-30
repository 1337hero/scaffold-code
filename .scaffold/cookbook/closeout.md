# Cookbook — CLOSE OUT (session end, run once)

A change is a cause: the next session inherits whatever you leave. Leave it clean.

## 1. Roll `STATE.md` forward (living snapshot — edit it to be currently true)
Update `memory/STATE.md` to match reality now: `Current focus`, `In flight`, `Current
branch/PR`, `Last shipped`, `Last verified`, `Known issues` — and **overwrite `Next up`** with
the new queue. STATE owns *what's true now*; don't let history or design rationale accrete here.

**Routing rule — where an update lands (get this wrong and STATE rots):**
- *Perishable status* (what's live, what's open, current focus, next up) → **`STATE.md`**.
- *Historical record* (what happened this session, the proof, derived decisions) → a **log entry**.
- *Durable design* (an invariant, a standard, the architecture) → **`rails/`** or a design doc — never STATE.

## 2. Append a dated log entry (append-only history — never rewrite a past entry)
`memory/log/YYYY-MM-DD-<slug>.md`:
- **Task** and shape (fix / feature / review / investigation).
- **Changed:** the PR, the key files.
- **Verification ledger:** the checks you ran, their result, and any check you skipped + why.
- **Proof:** the test that protects it.
- **Open / next:** the natural next step (feeds STATE's `Next up`).
- **Derived decisions:** anything you derived rather than asked — flag "ratify in PR?" when material.

## 3. Run the closeout self-check (mechanical — fails loudly)
Any shell-capable agent runs this before declaring done. This turns the keystone rails (not on
main, STATE updated, log written, no secrets) from grade-H trust into a gate:

```bash
#!/usr/bin/env bash
fail() { echo "FAIL: $1"; exit 1; }
[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ] || fail "on main branch"
if git diff --quiet HEAD -- memory/STATE.md && git diff --cached --quiet -- memory/STATE.md; then
  fail "STATE.md unchanged this session"
fi
ls memory/log/"$(date +%Y-%m-%d)"-*.md >/dev/null 2>&1 || fail "no dated log entry today"
if git diff origin/main...HEAD | grep -iqE '(api[_-]?key|secret|password|token)[[:space:]]*[:=]'; then
  fail "possible secret in diff"
fi
echo "OK: closeout floor satisfied"
```

## 4. Re-confirm the hard rails held
Branch+PR (not main), no secrets, in scope, green. (A re-check of REVIEW, not a first look.)

## 5. If something genuinely needs the human
State it as a steer — fork + recommendation + reason — not a vague question.

> The memory **is** the project's continuity across sessions, agents, and runtimes. Never end
> with code shipped and `STATE.md` silent.
