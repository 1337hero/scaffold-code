# Adapters — per-runtime injection

The rails are markdown; the one thing a runtime must guarantee is the **keystone**: `BOOT.md`
loads at session start. That is all an adapter is.

Enforcement does **not** live here. It lives where it can't be phrased around:
- **Push protection** is a git `pre-push` hook (`.scaffold/hooks/pre-push`), installed into
  `.git/hooks/` by `scaffold init` / `scaffold update`. Runtime- and agent-agnostic; exempts
  `.scaffold/`-only memory maintenance; humans override with
  `SCAFFOLD_OFF=1`.
- **Closeout** is an outcome gate: `cookbook/closeout-check.sh` passes when nothing shipped,
  and fails loudly on code-on-default-branch, a stale log, or a possible secret in the diff.
  Adapters merely *relay* its verdict at session end.

**Adapters install once per machine — `scaffold setup` does all of the below.** They live only
in this source repo and are never copied into projects; the presence of `.scaffold/` in a repo
is what activates them.

## Claude Code
Global hooks in `~/.claude/settings.json`, each guarded on `$CLAUDE_PROJECT_DIR/.scaffold/BOOT.md`
existing (no-ops everywhere else). `claude-code/settings.json` remains as a per-project variant
if a repo needs in-repo enforcement for collaborators.
- `SessionStart` injects `BOOT.md` (the keystone)
- `Stop` runs `guard.js`, which runs the closeout gate and blocks stopping while it fails

## Pi (pi.dev)
`pi/scaffold.ts` → `~/.pi/agent/extensions/` — covers every scaffold repo at once. (Prefer
global over project-local `.pi/extensions/`: project-local extensions load only after pi
trusts the project; the global dir always loads.)
- `before_agent_start` appends `BOOT.md` to the system prompt (the keystone)
- `agent_end` runs the closeout gate; on failure it steers the agent back once per stale
  stretch, warning the human on repeats

## Codex
Global `SessionStart` and `Stop` hooks are merged into `~/.codex/hooks.json`. The shared
`codex/guard.js` discovers `.scaffold/` from the session working directory, so the hooks no-op
outside scaffold repos and still work when Codex starts in a repo subdirectory.
- `SessionStart` emits `BOOT.md` as additional developer context (the keystone)
- `Stop` runs the closeout gate and prevents the turn from stopping while it fails

Codex requires non-managed command hooks to be reviewed after installation or any update. Run
`/hooks` in Codex and trust the scaffold hooks before expecting them to execute.

## Anything else (portable floor)
No injection guarantee — point the agent at `.scaffold/BOOT.md` however the runtime allows.
The pre-push hook and `closeout-check.sh` still hold: they travel with the repo and need no
adapter at all.
