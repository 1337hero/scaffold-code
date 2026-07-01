# Adapters — per-runtime enforcement

The rails are markdown; these close the trust gap where a runtime can. The keystone in every
adapter is the same: guarantee `BOOT.md` loads at session start.

**Adapters install once per machine — `scaffold setup` does all of the below.** They live only
in this source repo and are never copied into projects; the presence of `.scaffold/` in a repo
is what activates them.

## Claude Code
Global hooks in `~/.claude/settings.json`, each guarded on `$CLAUDE_PROJECT_DIR/.scaffold/BOOT.md`
existing (no-ops everywhere else). `claude-code/settings.json` remains as a per-project variant
if a repo needs in-repo enforcement for collaborators.
- `SessionStart` records a repo-state baseline (HEAD + dirty paths), then injects `BOOT.md` (the keystone)
- `PreToolUse` blocks `git push` to the default branch (derived from `origin/HEAD`)
- `Stop` blocks ending with code changed **this session** but closeout incomplete (`STATE.md` roll +
  dated log entry). "This session" is the delta from the SessionStart baseline — never the branch's
  diff from main, so prior sessions' unmerged commits and read-only sessions don't trip it.

## Pi (pi.dev)
`pi/scaffold.ts` → `~/.pi/agent/extensions/` — covers every scaffold repo at once. (Prefer
global over project-local `.pi/extensions/`: project-local extensions load only after pi
trusts the project; the global dir always loads.)
- `before_agent_start` records a repo-state baseline on first run, then appends `BOOT.md` to the
  system prompt (the keystone)
- `tool_call` blocks `git push` to the default branch (derived from `origin/HEAD`)
- `agent_end` sends the agent a follow-up when code changed **this session** (delta from the
  baseline, never the branch's diff from main) but closeout is incomplete (STATE roll + dated log
  entry) — once per stale stretch, warning the human on repeats (parity with Claude Code's `Stop` gate)

## Anything else (portable floor)
No injection guarantee — point the agent at `.scaffold/BOOT.md` however the runtime allows, and
run `../cookbook/closeout-check.sh` before declaring done. It fails loudly on: on the default
branch, unchanged STATE, missing dated log entry, or a possible secret in the diff.
