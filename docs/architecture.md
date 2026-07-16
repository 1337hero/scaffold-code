# Architecture

scaffold-code adds operating rails for AI coding agents to any repo. It drops a `.scaffold/` directory at the repo root, installs a git pre-push hook, and (once per machine) installs runtime adapters. The agent brings the cognition; `.scaffold/` brings the continuity.

## Engine vs state

Every file in a deployed `.scaffold/` belongs to one of two classes, and the split drives everything the [CLI](cli.md) does:

- **Engine** files are stock. `scaffold update` overwrites them freely: `BOOT.md`, `cookbook/orient.md`, `cookbook/loop.md`, `cookbook/closeout.md`, `cookbook/closeout-check.sh`, and `hooks/pre-push`.
- **State** files belong to the project. They are copied once as templates and never overwritten: `rails/standards.md` (the project's enforceable standards) and `memory/` (the `STATE.md` snapshot plus the `log/` of per-intent closeouts).

**Adapters** are the third piece, and they live nowhere in the project. `scaffold setup` installs them machine-globally per runtime (Claude Code, Codex, Pi, opencode). The presence of `.scaffold/BOOT.md` in a repo is what activates them; everywhere else they no-op. See [adapters](adapters.md).

```
project/
├── .git/hooks/pre-push        # installed by scaffold init/update
└── .scaffold/
    ├── BOOT.md                # the keystone (engine)
    ├── VERSION                # deploy stamp: <commit> <date>
    ├── cookbook/              # on-demand procedures + the gate script (engine)
    ├── hooks/pre-push         # canonical copy of the hook (engine)
    ├── rails/standards.md     # project standards (state)
    └── memory/                # STATE.md + log/ (state)
```

## The keystone

The single guarantee an adapter must provide: `BOOT.md` loads at session start. BOOT is short by design. It states the hard rails (branch + PR only, no secrets, no irreversible ops, stay in scope), the precedence order when instructions conflict, and a map of every other `.scaffold/` path. Everything else is pulled on demand, so the standing context cost stays near zero.

## The loop

BOOT points the agent through three phases:

1. **ORIENT** (`cookbook/orient.md`), once per session. Read `memory/STATE.md` as a prior, find the originating issue or task, get the build/test commands in hand, and read the code before editing.
2. **FRAME → WORK → REVIEW** (`cookbook/loop.md`), per task. State what done means and what is out of scope before editing; implement the smallest correct change; review the diff against `rails/standards.md`.
3. **CLOSE OUT** (`cookbook/closeout.md`), once at session end. Append a per-intent log entry to `memory/log/`, update `STATE.md` only if shared operational truth changed, and pass the [closeout gate](closeout-gate.md).

The memory model splits by durability: `STATE.md` holds the shared snapshot, `memory/log/` holds additive per-intent history, and `rails/` holds durable design rules. The routing rule in `closeout.md` keeps STATE from rotting into a task log.

## Enforcement lives in the environment

Prose rails can be phrased around; the two rails that matter are backed by mechanisms an agent cannot talk past:

- The **git pre-push hook** blocks pushes to the default branch regardless of which agent (or human) runs `git push`. It exempts commits touching only `.scaffold/`, so memory maintenance never costs a branch and PR.
- **`cookbook/closeout-check.sh`** is an outcome gate, not a process check. It inspects what actually shipped and fails loudly on code landing without a fresh log entry, code on the default branch, or a secret-looking line in the diff. Adapters only relay its verdict.

Neither mechanism parses agent output, so both work identically for every runtime and for none. `SCAFFOLD_OFF=1` is the universal human escape hatch, honored by the hook and all adapters.

## The template/ nesting trick

The canonical engine lives at `template/.scaffold/` in the source repo, one level below where a deployed `.scaffold/` sits. The adapters activate on `<root>/.scaffold/BOOT.md`, so nesting keeps the source repo itself from booting its own rails while you edit them. `bin/scaffold` still installs it as `<project>/.scaffold`.

## Project registry

`scaffold init` and `update` record each project path in `~/.config/scaffold/projects`, one absolute path per line. `scaffold update --all` and `status --all` walk that list, and `status` compares deployed engine files against the canonical ones by hash. Details in [cli.md](cli.md).
