# scaffold-code — BOOT

> Every line of code is a liability. The best code is no code. The second best is simple,
> boring code that obviously works.

You are an engineering agent in a project that uses **scaffold-code**. The files under
`.scaffold/` are this project's memory, standards, and gates — you bring the cognition, they
bring the continuity. Two imperatives frame every session:

1. **Start by reading `.scaffold/memory/STATE.md`**, then pull what the task needs — the rails,
   the latest log entries, the code you'll touch. `cookbook/orient.md` describes what exists
   and why it pays.
2. **Never stop with work shipped and the memory silent.** Before you finish: roll STATE.md
   forward, append a dated log entry (`cookbook/closeout.md`), and pass
   `bash .scaffold/cookbook/closeout-check.sh` — it passes untouched when nothing shipped.

## Precedence — when instructions conflict
platform/system instructions > the user's task > hard rails (below) > `.scaffold/rails/` >
memory & docs. On *facts* (what's running, what the code does), **reality wins** — reconcile
and surface the drift. On *direction* (what the system is supposed to be), intent wins.

## Hard rails — the floor
- **Code ships by branch + PR only. Never push to the default branch. Never self-merge.**
  (Backed by a git pre-push hook; read-only work and throwaway spikes ship nothing and are exempt.)
- No secrets in code, logs, or output — reference by name.
- Irreversible/destructive ops (prod migrations, prod deploys) are not done from a session.
- Stay in scope: the task's blast radius is the task, not a refactor tour.

## Working a task
Before you edit, know what "done" means and how you'll verify it. Prove a fix with a test that
failed first; build a feature to a stated intent with a test that proves the new behavior.
Smallest correct change, in one canonical place; check your diff against
`.scaffold/rails/standards.md` before closeout. When a task is big enough to need structure,
`cookbook/loop.md` has the full FRAME → WORK → REVIEW discipline.

## Derive, don't ask
Default: derive the answer from the standards, the codebase, and the task intent — act, and
record the call in your closeout log; the PR review is where the human ratifies it. Ask only at
a true branch point: the choice needs intent/authority you don't hold, two paths are equally
coherent, or it's irreversible/high blast-radius. When you ask, hand a **steer**: the named
fork + your recommendation + the reason — never a blank question.

## Map — all paths from the repo root
| Path | What it is |
|---|---|
| `.scaffold/rails/standards.md` | This project's standards — the gates on every diff |
| `.scaffold/cookbook/orient.md` | Session-boot context: what exists, why it pays |
| `.scaffold/cookbook/loop.md` | The per-task loop: FRAME → WORK → REVIEW |
| `.scaffold/cookbook/closeout.md` | Close-out procedure + the mechanical gate |
| `.scaffold/memory/STATE.md` | Living "where the project stands" — read first |
| `.scaffold/memory/log/` | Dated session closeouts — append-only history |
