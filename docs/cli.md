# CLI reference

`bin/scaffold` is a Bun script. It deploys the engine from the canonical checkout (the repo containing the script) into project repos, and installs the machine-global adapters. On any error it prints `scaffold: <message>` to stderr and exits 1.

```
scaffold init <dir>           set up .scaffold/ in a repo
scaffold update [<dir>|--all] refresh engine files; never touches rails/ or memory/
scaffold status [<dir>|--all] show drift against the canonical engine
scaffold setup                install machine-global adapters
scaffold list                 print registered projects
```

`<dir>` defaults to the current directory. `--all` (update, status) runs against every registered project instead.

## Engine vs state, in file terms

The commands treat two file sets differently (see [architecture](architecture.md)):

- **Engine** (always overwritten): `BOOT.md`, `cookbook/orient.md`, `cookbook/loop.md`, `cookbook/closeout.md`, `cookbook/closeout-check.sh`, `hooks/pre-push`, `adapters/claude-code/guard.js`.
- **State templates** (copied only if missing, never overwritten): `rails/standards.md`, `memory/STATE.md`, `memory/log/*.example`.

## scaffold init

Creates `<dir>` if needed, runs `git init` if it is not a repo, and refuses to run anywhere but the repo root. Fails if `.scaffold/BOOT.md` already exists (use `update`). Then it copies engine files and state templates, installs the pre-push hook into `.git/hooks/`, merges the Claude Code hooks into the project's committed `.claude/settings.json` (see [adapters](adapters.md)), writes the VERSION stamp, and registers the project.

If `.git/hooks/pre-push` already exists and does not contain the string `scaffold-code`, init leaves it alone and prints a warning; chain `.scaffold/hooks/pre-push` into your hook manually.

## scaffold update

Overwrites engine files (including the vendored Claude Code guard), fills in any missing state templates, reinstalls the pre-push hook, refreshes the project's committed `.claude/settings.json` hooks, restamps VERSION, and re-registers the project. It never overwrites `rails/` or `memory/` content that exists. Fails if the project has no `.scaffold/`.

## scaffold status

Prints one line per project: `in sync` or `DRIFT`, with the deployed VERSION and the canonical version, then a line per drifted file. A file counts as drifted when it is missing or its SHA-256 differs from the canonical copy. State files are never checked; only the engine can drift. Exits 0 when everything is in sync, 1 otherwise, which makes it usable in scripts and CI.

## scaffold setup

Installs the adapters machine-globally, skipping any runtime whose config directory is absent:

- **Pi**: copies the extension to `~/.pi/agent/extensions/scaffold.ts`.
- **opencode**: copies the plugin to `~/.config/opencode/plugins/scaffold.js`.
- **Claude Code**: merges SessionStart and Stop hooks into `~/.claude/settings.json`.
- **Codex**: merges SessionStart and Stop hooks into `~/.codex/hooks.json` (trust them with `/hooks` afterward).

The JSON merges are idempotent and self-updating: any prior hook entry mentioning `.scaffold/` is replaced with the current one, entries under events scaffold no longer uses are removed, and the previous file is backed up as `*.bak-scaffold` before any write. Per-runtime behavior is in [adapters.md](adapters.md).

## scaffold list

Prints the registry, `~/.config/scaffold/projects`, one absolute path per line. init and update append to it; nothing removes entries automatically, so prune it by hand if you delete a project.

## VERSION and the drift model

Each deploy writes `.scaffold/VERSION`:

```
f9746b7 2026-07-15
```

The first field is the canonical repo's short commit hash, suffixed `-dirty` when `template/.scaffold` or `bin` have uncommitted changes; the second is the deploy date. The stamp is informational. Drift detection ignores it and compares file hashes directly, so a hand-edited engine file shows as drifted even under a current stamp, and `scaffold update` converges every project back to canonical.

## install.sh

The curl bootstrapper: `curl -fsSL <raw url>/install.sh | bash`. It requires `bun` and `git` (exits 1 if either is missing), then:

1. Picks the canonical checkout: the directory containing the script if run from inside one, else `$SCAFFOLD_HOME` (default `~/.scaffold-code`), which it `git pull --ff-only`s or clones from `$SCAFFOLD_REPO` (default the GitHub repo).
2. Symlinks `bin/scaffold` into `~/.local/bin/scaffold`.
3. Runs `scaffold setup`.

It prints a reminder if `~/.local/bin` is not on your PATH. Re-running it is the upgrade path: pull, re-link, re-setup.
