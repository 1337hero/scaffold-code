# 2026-07-03 — Bitter Lesson diet, phases 1–3

**Task:** Audit the harness against Sutton's Bitter Lesson, then implement the approved
phases 1–3 of the upgrade plan (Mike explicitly stopped scope there). (shape: feature)

**Changed:** 038f17a on `feature/bitter-lesson-diet` (no PR yet). Key files:
- `.scaffold/hooks/pre-push` (new) + `bin/scaffold` installGitHook — push protection moved
  from adapter command parsing into the environment.
- `.scaffold/cookbook/closeout-check.sh` — pure outcome gate: passes when nothing shipped;
  log freshness vs last code change replaces "log entry today".
- `.scaffold/adapters/pi/scaffold.ts`, `claude-code/guard.js` — baseline + parser machinery
  deleted; adapters are injection + gate relay only. `scaffold setup` retires stale hook entries.
- `.scaffold/BOOT.md` (~50 lines), new `.scaffold/cookbook/loop.md`, `orient.md` rewrite —
  prescription → information.
- Net: 255+/409−.

**Verification ledger:** sandbox repo + bare remote in /tmp — hook: 7/7 (code-on-main blocked,
.scaffold-only/feature/first-push/branch-delete/SCAFFOLD_OFF allowed); gate: no-op pass,
untracked-code-on-main fail, STATE fail, stale-log fail, secret fail, pass state; guard.js Stop
relay block/pass/stop_hook_active; setup merge retires old PreToolUse, preserves user hooks;
update refreshes tampered hook, warns on foreign hook. `bun build` on the pi adapter. Skipped:
no automated test suite exists in this repo (watch-list candidate).

**Proof:** manual scenario matrix above; no CI in this repo.

**Open / next:** push branch + PR on Mike's go; then `scaffold update --all` + `scaffold setup`
machine-wide. Follow-up: split state templates out of live `.scaffold/` (template-pollution
issue), phases 4–5 deferred.

**Derived decisions:**
- Filled this repo's own STATE.md despite it doubling as the init template — dogfooding the
  harness beats template purity; pollution is tracked in Known issues. **Ratify in PR.**
- Kept the "batch every unknown" line when moving WORK detail into loop.md — deleting it is
  Phase 4 scope, not a move.
- Pre-push hook allows the first-ever push of the default branch (nothing to PR against).
