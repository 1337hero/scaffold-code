# Cookbook — ORIENT (session boot, run once)

Build the **minimum** context to work this session well. Pull, don't dump — and pull in
whatever order the task demands; there is no ritual sequence. Run once when the session starts,
not per task. What exists and why it pays:

- **`.scaffold/memory/STATE.md`** — current focus, `Next up`, in-flight branches/PRs, last
  shipped/verified, known issues, and the `Key files / commands` block. Read it in full; it is
  the project's continuity and the whole reason you don't start cold.
- **The build/test/deploy commands** — STATE's `Key files / commands`, or
  `.scaffold/rails/standards.md` → Stack notes. The single highest-value thing to hold; without
  it every session rediscovers test/lint/dev/CI names and app-boot behavior.
- **`.scaffold/rails/`** — the standards your diffs are checked against this session.
- **`.scaffold/memory/log/`** — the latest 1–2 entries (`ls -t`): what was just done, what was
  left open. STATE's `Next up` is the authoritative pointer; the log is the detail.
- **The code you'll touch** — grep the area, then read the 2–3 most similar existing
  implementations before writing anything new; match the patterns already here.
- **Reality** — `git status`/`log`, CI, the running code. If STATE or a doc contradicts the
  code, the **code wins on facts**; note the drift so closeout fixes STATE.

**Done when:** the project's commands are in hand and you can state what "done" looks like for
the session's first task before you edit anything.
