# The closeout gate

`cookbook/closeout-check.sh` is scaffold's outcome gate. It does not watch what an agent says or does; it inspects what actually shipped and fails loudly when code landed without its obligations. Any shell-capable agent runs it before declaring done, and [adapters](adapters.md) run it automatically at session end.

```bash
bash .scaffold/cookbook/closeout-check.sh   # works from anywhere in the repo
```

## What it checks and why

The gate turns three keystone rails from read-and-trusted prose into a mechanical check:

- **Off the default branch**: code ships by branch + PR, so changed code sitting on `main` fails.
- **Memory written**: the next session inherits only what the log records, so shipped code without a log entry at least as fresh as the last code change fails.
- **No secrets**: a secret in a diff is a secret in history, so a secret-looking added line fails.

A read-only session owes no ceremony: when nothing shipped, the gate passes untouched.

## Exact pass/fail conditions

The gate treats session ≈ branch. It resolves the default branch from `origin/HEAD` (falling back to `main`), finds the merge-base with `HEAD`, and defines **code changes** as the branch diff against that base plus dirty and untracked paths, excluding everything under `.scaffold/`.

It **passes** (exit 0) when there are no code changes, printing `OK: no code changes — closeout floor not required`, or when all three conditions below hold, printing `OK: closeout floor satisfied`.

It **fails** (exit 1) with `FAIL: <reason>` on stdout when any of these is true:

| Condition | Reason printed |
|---|---|
| Not inside a git repo | `not in a git repo` |
| No `.scaffold/BOOT.md` at the repo root | `no .scaffold/ at repo root` |
| No default-branch ref to diff against | `no <default> ref to diff against` |
| Code changed and HEAD is the default branch | `code changed on <default> — branch first` |
| `.scaffold/memory/log/` has no `.md` entry | `no log entry in .scaffold/memory/log/` |
| Newest log entry's date prefix is older than the last code change | `no log entry since the last code change (<date>)` |
| An added diff line looks like a secret | `possible secret in diff` |

Log freshness compares the `YYYY-MM-DD` prefix of the newest file in `memory/log/` against the commit date of the last non-`.scaffold` change (or today, when the tree is dirty). Log changes count whether committed or not, so writing the entry is enough; no commit is required to pass.

The secret check scans added lines only, for a key name matching `api[_-]?key|secret|password|token` assigned a quoted literal of 16+ token-like characters. References by name (`apiKey: process.env.STRIPE_KEY`) pass because there is no quoted literal; URL paths (`paymentToken: "/payment-token/X"`) pass because the value starts with `/`.

## The verdict relay contract

Exit code 0 means pass; non-zero means fail, with a single human-readable `FAIL: <reason>` line on stdout. That is the entire contract between the gate and every adapter. Each adapter captures the line and surfaces it in its runtime's native way:

- **Claude Code**: the Stop hook blocks the stop, returning the verdict as the block reason; the agent must finish closeout before it can end the turn.
- **Codex**: the Stop hook returns `continue: false` with the verdict as stop reason and system message.
- **Pi**: on first failure, the verdict comes back to the agent as a follow-up user message; on repeats, the human gets a warning notification instead.
- **opencode**: on first failure per session, the verdict is prompted back into the session; on repeats, the human gets a TUI toast. Subagent sessions are exempt.

The nudge-once designs (Pi, opencode) prevent an agent that cannot satisfy the gate from looping; the block designs (Claude Code, Codex) rely on their runtimes' own loop protection (Claude Code's `stop_hook_active`, Codex's turn model).

Note the escape hatch lives in the relays, not the gate: the pre-push hook and every adapter honor `SCAFFOLD_OFF=1`, but running `closeout-check.sh` directly always reports the truth.

## How the pre-push hook complements it

The gate and the hook cover the same rail from opposite ends. The **pre-push hook** is preventive: it rejects any push to the default branch at the git layer, before damage lands, no matter who pushes or from what tool. The **gate** is corrective: it catches everything the hook cannot see, unpushed commits on `main`, shipped code with silent memory, secrets in the diff, and hands the agent a reason it can act on.

Both exempt `.scaffold/`: the hook lets `.scaffold/`-only commits land on the default branch directly (memory maintenance must not cost a branch and PR), and the gate excludes `.scaffold/` paths when deciding whether code changed. Together they hold with no adapter installed at all, which is scaffold's portable floor (see [architecture](architecture.md)).
