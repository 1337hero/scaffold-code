# Adapters

An adapter does exactly two things: inject `.scaffold/BOOT.md` at session start (the **keystone**) and relay the [closeout gate](closeout-gate.md)'s verdict at session end. No rail logic lives in any adapter; enforcement stays in the git pre-push hook and `closeout-check.sh`, which travel with the repo (see [architecture](architecture.md)).

Adapters install once per machine with `scaffold setup` and are never copied into projects. Each activates only when the project contains `.scaffold/BOOT.md`, and each honors `SCAFFOLD_OFF=1` by doing nothing at all. Sources live in `template/.scaffold/adapters/` in the canonical repo.

## Claude Code

Installed as global hooks merged into `~/.claude/settings.json` (the old file is backed up as `settings.json.bak-scaffold`). Both hook commands are wrapped in a shell guard, `if [ -f "$CLAUDE_PROJECT_DIR/.scaffold/BOOT.md" ]`, so they no-op outside scaffold repos.

- **SessionStart**: `cat`s BOOT.md into the session context.
- **Stop**: runs `adapters/claude-code/guard.js` from the canonical checkout. It runs the gate in the session's cwd; on failure it emits `{"decision": "block", "reason": "scaffold closeout gate: FAIL: ..."}`, which blocks the stop until closeout is done. It exits silently when `stop_hook_active` is set, so a blocked stop cannot loop forever.

`adapters/claude-code/settings.json` remains as a per-project variant for repos that want in-repo enforcement for collaborators; it references guard.js inside the project rather than the global checkout.

## Codex

Installed as SessionStart and Stop hooks merged into `~/.codex/hooks.json` (backup: `hooks.json.bak-scaffold`). One script, `adapters/codex/guard.js`, handles both events; it discovers the scaffold root by walking up from the hook's `cwd`, so it works when Codex starts in a subdirectory and no-ops outside scaffold repos.

- **SessionStart**: prints BOOT.md to stdout, which Codex takes as additional developer context.
- **Stop**: runs the gate at the discovered root; on failure it emits `{"continue": false, "stopReason": ..., "systemMessage": ...}`, preventing the turn from ending.

**Trust caveat**: Codex refuses to execute non-managed command hooks until you review them. Run `/hooks` inside Codex and trust the scaffold entries after installation and after every `scaffold setup` that changes them. Until then the hooks silently do nothing.

## Pi

Installed as a global extension at `~/.pi/agent/extensions/scaffold.ts`. Global beats project-local `.pi/extensions/` here: project-local extensions load only after Pi trusts the project, while the global directory always loads.

- **before_agent_start**: appends BOOT.md to the system prompt. Skips injection when the prompt already contains the `scaffold-code — BOOT` marker, so nothing double-injects.
- **agent_end**: runs the gate. On first failure it sends the verdict back to the agent as a follow-up user message, steering it to finish closeout. On repeated failures in the same stale stretch it stops nudging the agent and warns the human via a UI notification instead. A passing run resets the nudge state.

## opencode

Installed as a global plugin at `~/.config/opencode/plugins/scaffold.js`. It walks up from the project directory to find `.scaffold/` and returns no hooks outside scaffold repos.

- **experimental.chat.system.transform**: appends BOOT.md to the system prompt array, guarded against double-injection by the same `scaffold-code — BOOT` marker.
- **session.idle** (via the `event` hook): runs the gate. Subagent sessions (those with a `parentID`) are exempt; the gate speaks only to top-level sessions. On first failure per session it prompts the agent with the verdict; on repeats it shows a warning toast in the TUI instead. A passing run clears that session's nudge state.

## The escape hatch

`SCAFFOLD_OFF=1` disables everything scaffold enforces, everywhere: the pre-push hook exits 0 and every adapter returns before doing any work. It is meant for humans, and it is visible, `SCAFFOLD_OFF=1 git push ...` in a transcript is an audit trail, not a bypass.

## Wiring an unsupported runtime

The portable floor needs no adapter at all. The pre-push hook and `closeout-check.sh` live in the repo and enforce themselves; the only thing you lose without an adapter is automatic injection and verdict relay. To wire a new runtime:

1. **Inject the keystone**: get `.scaffold/BOOT.md` into the session at start by whatever mechanism the runtime offers (system prompt hook, context file, or just telling the agent to read it). Guard on the file's existence so the mechanism no-ops in other repos, and check for the `scaffold-code — BOOT` marker to avoid double-injection.
2. **Relay the gate**: at session end, run `bash .scaffold/cookbook/closeout-check.sh` and feed a non-zero exit's stdout back to the agent. If the runtime has no session-end hook, skip this; BOOT already tells the agent to run the gate itself.

Honor `SCAFFOLD_OFF=1` in anything you build.
