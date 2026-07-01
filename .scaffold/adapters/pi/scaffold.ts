// scaffold-code adapter for Pi (https://pi.dev) — copy or symlink into .pi/extensions/
// Keystone: injects .scaffold/BOOT.md into the system prompt every prompt.
// Enforcement: blocks push-to-default; steers the agent back when code changed but closeout
// is incomplete (STATE roll + dated log entry).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

function git(cwd: string, cmd: string): string | null {
  try {
    return execSync(`git ${cmd}`, { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function defaultBranch(cwd: string): string {
  const ref = git(cwd, "symbolic-ref -q --short refs/remotes/origin/HEAD");
  if (ref) return ref.replace(/^origin\//, "");
  for (const b of ["main", "master"]) {
    if (git(cwd, `rev-parse --verify --quiet refs/heads/${b}`)) return b;
  }
  return "main";
}

function sessionBase(cwd: string, def: string): string | null {
  for (const ref of [`origin/${def}`, def]) {
    const base = git(cwd, `merge-base ${ref} HEAD`);
    if (base) return base;
  }
  return null;
}

// token-based, per command segment — "bugfix/main-nav" and prose mentioning "push" don't trip it
function isPushToDefault(cmd: string, branch: string, def: string): boolean {
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
}

function isScaffoldRepo(cwd: string): boolean {
  return existsSync(join(cwd, ".scaffold", "BOOT.md"));
}

function logEntryToday(cwd: string): boolean {
  const top = git(cwd, "rev-parse --show-toplevel");
  if (!top) return true;
  const today = new Date().toLocaleDateString("en-CA");
  try {
    return readdirSync(join(top, ".scaffold", "memory", "log")).some(
      (f) => f.startsWith(today) && f.endsWith(".md"),
    );
  } catch {
    return false;
  }
}

export default function (pi: ExtensionAPI) {
  if (process.env.SCAFFOLD_OFF === "1") return; // explicit human escape hatch
  pi.on("before_agent_start", async (event, ctx) => {
    if (!isScaffoldRepo(ctx.cwd)) return;
    if (event.systemPrompt.includes("scaffold-code — BOOT")) return;
    const boot = readFileSync(join(ctx.cwd, ".scaffold", "BOOT.md"), "utf8");
    return { systemPrompt: `${event.systemPrompt}\n\n${boot}` };
  });

  pi.on("tool_call", async (event, ctx) => {
    if (!isScaffoldRepo(ctx.cwd)) return;
    if (!isToolCallEventType("bash", event)) return;
    const cmd = event.input.command ?? "";
    if (/^\s*SCAFFOLD_OFF=1\s/.test(cmd)) return; // visible-in-transcript escape hatch
    if (!/\bpush\b/.test(cmd)) return;
    const def = defaultBranch(ctx.cwd);
    const branch = git(ctx.cwd, "rev-parse --abbrev-ref HEAD") ?? "";
    if (isPushToDefault(cmd, branch, def)) {
      return {
        block: true,
        reason: `scaffold hard rail: code ships by branch + PR only — never push to ${def}.`,
      };
    }
  });

  // nudge once per stale stretch (like Claude Code's stop_hook_active), warn the human after that
  let nudged = false;
  pi.on("agent_end", async (_event, ctx) => {
    if (!isScaffoldRepo(ctx.cwd)) return;
    const def = defaultBranch(ctx.cwd);
    const base = sessionBase(ctx.cwd, def);
    if (!base) return;
    const changed = (git(ctx.cwd, `diff --name-only ${base}`) ?? "")
      .split("\n")
      .filter(Boolean);
    const codeChanged = changed.some((f) => !f.startsWith(".scaffold/"));
    const missing: string[] = [];
    if (!changed.includes(".scaffold/memory/STATE.md"))
      missing.push("roll .scaffold/memory/STATE.md forward");
    if (!logEntryToday(ctx.cwd)) missing.push("append a dated .scaffold/memory/log/ entry");
    if (!codeChanged || missing.length === 0) {
      nudged = false;
      return;
    }
    if (nudged) {
      ctx.ui.notify(
        `scaffold: closeout still incomplete — ${missing.join(" and ")} before closing out.`,
        "warning",
      );
      return;
    }
    nudged = true;
    pi.sendUserMessage(
      `scaffold closeout: code changed this session but closeout is incomplete — ${missing.join(" and ")} (.scaffold/cookbook/closeout.md), then run \`bash .scaffold/cookbook/closeout-check.sh\`.`,
      { deliverAs: "followUp" },
    );
  });
}
