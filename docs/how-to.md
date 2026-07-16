# How to use scaffold-code

## What you get

scaffold-code drops a `.scaffold/` directory into a repo and wires your coding agents to it. Every session then starts the same way: the agent reads `BOOT.md`, orients from the project's memory, works each task on a feature branch through a FRAME → WORK → REVIEW loop, and cannot finish until it writes a dated log entry the next session will read. A git pre-push hook blocks pushes to the default branch, and a closeout gate blocks the agent from stopping with shipped code and silent memory. The result: agents that pick up where the last one left off instead of starting cold.

## Install once per machine

You need `bun` and `git`. Then:

```bash
curl -fsSL https://raw.githubusercontent.com/1337hero/scaffold-code/main/install.sh | bash
```

This clones the repo to `~/.scaffold-code`, symlinks `scaffold` into `~/.local/bin`, and runs `scaffold setup`, which installs machine-global adapters for Claude Code, Codex, Pi, and opencode (any tool you don't have is skipped). The adapters are dormant in repos without a `.scaffold/` directory, so installing them costs nothing elsewhere.

Codex users have one extra step: Codex requires you to review non-managed command hooks. Run `/hooks` inside Codex once and trust the scaffold entries, or they never execute.

## Set up a repo

```bash
scaffold init ~/code/acme-storefront
```

This copies the engine (`BOOT.md`, `cookbook/`, the pre-push hook) plus two state templates (`rails/standards.md`, `memory/STATE.md`) into `.scaffold/`, installs the hook into `.git/hooks/pre-push`, and stamps a `VERSION`. Engine files are stock and get refreshed by `scaffold update`; `rails/` and `memory/` are yours and never touched again.

Now fill in the two templates. This is the part only you can do, and it is what makes the agent useful on day one.

**`rails/standards.md`** holds the rules every diff is checked against. It ships with sane defaults (simplicity ladder, root-cause bug fixes, testing tiers); add project specifics under Conventions and Stack notes. For a Next.js client project:

```markdown
## Conventions
- App Router only; no pages/ directory. **Check:** path grep.
- Server Components by default; "use client" needs a reason in the PR. **Judgment:** (review).
- Tailwind for styling; no new CSS files. **Check:** lockfile + path grep.

## Stack notes
- `bun dev` / `bun run build` / `bun test`
- Deploys via Vercel on merge to main; preview per PR.
```

**`memory/STATE.md`** is the shared snapshot of where the project stands, read first every session:

```markdown
# Project State
_Last updated: 2026-07-15 by Mike_

## What this project is
Storefront for Acme Outdoors: Next.js 15 app, Stripe checkout, Sanity CMS.

## Current focus
Checkout redesign (epic in issue #42).

## Key files / commands
| File / command | Why it matters |
|---|---|
| `bun test` | Full suite; CI runs the same |
| `src/lib/stripe.ts` | All payment logic routes through here |
```

That's it. Open any supported agent in the repo and scaffold is live.

## What a session looks like

You open Claude Code in `acme-storefront` and ask it to fix a bug where the cart total ignores discount codes. Here is what happens.

**Boot.** The SessionStart hook injects `.scaffold/BOOT.md` before the agent sees your message. The agent now knows the hard rails (branch + PR only, no secrets, stay in scope) and its two imperatives: read STATE first, never stop with work shipped and the memory silent.

**Orient.** The agent reads `memory/STATE.md`, picks up the test command and the pointer to `src/lib/stripe.ts`, and skims the latest entries in `memory/log/` for context on the checkout work. One session's worth of context, pulled in seconds instead of rediscovered.

**Work.** The agent frames the task (shape: fix; done means: discounted totals correct, proven by a test that failed first), creates `bugfix/cart-discount-total`, writes the failing test, fixes the root cause in the shared total function, and checks the diff against `rails/standards.md`. If it tried `git push origin main` instead, the pre-push hook would reject it cold.

**Closeout.** Before finishing, the agent writes `memory/log/2026-07-15-issue-57-cart-discount-total.md`:

```markdown
# 2026-07-15 — cart discount total (issue #57)

**Origin:** issue #57 (shape: fix)
**Delivery:** PR #61. Key files: src/lib/cart.ts, src/lib/cart.test.ts
**Proof:** cart.test.ts "applies discount before tax" — red before the fix.
**Open / next:** merge PR #61; watch for rounding on multi-code carts.
**Derived decisions:** applied discount pre-tax (matches Stripe docs) — ratify in PR?
```

**The gate.** When the agent tries to end the session, the Stop hook runs `cookbook/closeout-check.sh`. Suppose it had skipped the log entry and stayed on main. The check fails:

```
FAIL: code changed on main — branch first
```

The agent is blocked from stopping and steered back to finish: branch, open the PR, write the log entry. You see the gate's verdict in the transcript; once it prints `OK: closeout floor satisfied`, the session ends clean. A session that shipped nothing passes untouched, so read-only work owes no ceremony.

## Day-2 operations

```bash
scaffold status          # drift check against the canonical engine (--all for every repo)
scaffold update          # refresh engine files after pulling a new scaffold-code version
```

`update` never touches `rails/` or `memory/`; your standards and history are safe. To pick up new scaffold-code releases, `git pull` in `~/.scaffold-code` (or rerun the curl installer), then `scaffold update --all`.

To bypass everything as a human, set the escape hatch:

```bash
SCAFFOLD_OFF=1 git push origin main
```

To remove scaffold from a repo, delete the directory and the hook:

```bash
rm -rf .scaffold .git/hooks/pre-push
```

The machine-global adapters stay installed but no-op in that repo from then on.

## Troubleshooting

**Agent starts cold, no BOOT injection.** Check three things: the adapter is installed (`scaffold setup` reports each tool), `.scaffold/BOOT.md` exists at the repo root, and `SCAFFOLD_OFF` is unset in your environment.

**Codex hooks never fire.** Codex distrusts non-managed hooks until you approve them. Run `/hooks` in Codex and trust the scaffold entries; repeat after any `scaffold setup` rerun.

**Closeout gate keeps failing.** In a set-up repo it fails for three reasons: code changed on the default branch (move to a feature branch), no log entry as fresh as the last code change (write one in `.scaffold/memory/log/`), or a possible secret in the diff (reference secrets by name, never by value). The full condition table is in [closeout-gate.md](closeout-gate.md).

**`scaffold status` reports DRIFT.** Someone edited engine files in place. Run `scaffold update` to restore them; put project rules in `rails/standards.md`, which update never overwrites.

## Going deeper

[architecture.md](architecture.md) explains the mental model, [cli.md](cli.md) covers every command, [adapters.md](adapters.md) details each runtime and how to wire an unsupported one, and [closeout-gate.md](closeout-gate.md) specifies the gate.
