#!/usr/bin/env node
// scaffold-code adapter for Codex — installed globally by `scaffold setup`.
// SessionStart injects BOOT.md as developer context; Stop relays the portable closeout gate.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

if (process.env.SCAFFOLD_OFF === "1") process.exit(0);

function scaffoldRoot(cwd) {
  let dir = path.resolve(cwd || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(dir, ".scaffold", "BOOT.md"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let hook = {};
  try {
    hook = JSON.parse(raw || "{}");
  } catch {
    process.exit(0);
  }

  const root = scaffoldRoot(hook.cwd);
  if (!root) process.exit(0);

  if (hook.hook_event_name === "SessionStart") {
    process.stdout.write(fs.readFileSync(path.join(root, ".scaffold", "BOOT.md"), "utf8"));
    return;
  }

  if (hook.hook_event_name !== "Stop") process.exit(0);
  try {
    execFileSync("bash", [".scaffold/cookbook/closeout-check.sh"], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const verdict = error.stdout?.toString().trim() || "closeout check failed";
    const reason = `scaffold closeout gate: ${verdict} — finish closeout (.scaffold/cookbook/closeout.md) before stopping.`;
    console.log(JSON.stringify({ continue: false, stopReason: reason, systemMessage: reason }));
  }
});
