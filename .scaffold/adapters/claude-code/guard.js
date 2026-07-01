#!/usr/bin/env node
// scaffold-code guard for Claude Code hooks (PreToolUse + Stop) — reads hook JSON on stdin.
// PreToolUse(Bash): blocks git push to the default branch.
// Stop: blocks ending with code changed but closeout incomplete (STATE roll + dated log entry).
const { execSync } = require("child_process");
const { readdirSync } = require("fs");
const { join } = require("path");

if (process.env.SCAFFOLD_OFF === "1") process.exit(0); // explicit human escape hatch

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let hook = {};
  try {
    hook = JSON.parse(raw || "{}");
  } catch {}
  const cwd = hook.cwd || process.cwd();
  const git = (cmd) => {
    try {
      return execSync(`git ${cmd}`, { cwd, stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      return null;
    }
  };
  const defaultBranch = () => {
    const ref = git("symbolic-ref -q --short refs/remotes/origin/HEAD");
    if (ref) return ref.replace(/^origin\//, "");
    for (const b of ["main", "master"]) if (git(`rev-parse --verify --quiet refs/heads/${b}`)) return b;
    return "main";
  };
  // token-based, per command segment — "bugfix/main-nav" and prose mentioning "push" don't trip it
  const isPushToDefault = (cmd, branch, def) => {
    for (const seg of cmd.split(/&&|\|\||[;|\n]/)) {
      const tokens = seg.trim().split(/\s+/);
      const g = tokens.indexOf("git");
      if (g === -1) continue;
      const p = tokens.indexOf("push", g + 1);
      if (p === -1) continue;
      // any push while sitting on the default branch — switch branches first
      if (branch === def) return true;
      if (tokens.slice(p + 1).some((t) => t === def || t.endsWith(`:${def}`))) return true;
    }
    return false;
  };

  if (hook.hook_event_name === "PreToolUse") {
    const cmd = (hook.tool_input && hook.tool_input.command) || "";
    if (/^\s*SCAFFOLD_OFF=1\s/.test(cmd)) process.exit(0); // visible-in-transcript escape hatch
    if (/\bpush\b/.test(cmd)) {
      const def = defaultBranch();
      const branch = git("rev-parse --abbrev-ref HEAD") || "";
      if (isPushToDefault(cmd, branch, def)) {
        console.error(`scaffold hard rail: code ships by branch + PR only — never push to ${def}.`);
        process.exit(2);
      }
    }
    process.exit(0);
  }

  if (hook.hook_event_name === "Stop" && !hook.stop_hook_active) {
    const def = defaultBranch();
    let base = null;
    for (const ref of [`origin/${def}`, def]) {
      base = git(`merge-base ${ref} HEAD`);
      if (base) break;
    }
    if (base) {
      const changed = (git(`diff --name-only ${base}`) || "").split("\n").filter(Boolean);
      const codeChanged = changed.some((f) => !f.startsWith(".scaffold/"));
      if (codeChanged) {
        const logEntryToday = () => {
          const top = git("rev-parse --show-toplevel");
          if (!top) return true;
          const today = new Date().toLocaleDateString("en-CA");
          try {
            return readdirSync(join(top, ".scaffold", "memory", "log")).some(
              (f) => f.startsWith(today) && f.endsWith(".md"),
            );
          } catch {
            return false;
          }
        };
        const missing = [];
        if (!changed.includes(".scaffold/memory/STATE.md"))
          missing.push("roll .scaffold/memory/STATE.md forward");
        if (!logEntryToday()) missing.push("append a dated .scaffold/memory/log/ entry");
        if (missing.length) {
          console.log(
            JSON.stringify({
              decision: "block",
              reason: `Code changed but closeout is incomplete — ${missing.join(" and ")} (.scaffold/cookbook/closeout.md) before stopping.`,
            }),
          );
        }
      }
    }
    process.exit(0);
  }

  process.exit(0);
});
