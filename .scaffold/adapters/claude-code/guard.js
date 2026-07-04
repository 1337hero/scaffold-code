#!/usr/bin/env node
// scaffold-code guard for Claude Code (Stop hook) — reads hook JSON on stdin.
// Enforcement lives in the environment (git pre-push hook, installed by `scaffold init/update`);
// this guard carries no rail logic of its own — it only relays the outcome gate
// (cookbook/closeout-check.sh), blocking a stop while the gate fails.
const { execSync } = require("child_process");

if (process.env.SCAFFOLD_OFF === "1") process.exit(0); // explicit human escape hatch

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let hook = {};
  try {
    hook = JSON.parse(raw || "{}");
  } catch {}
  if (hook.hook_event_name !== "Stop" || hook.stop_hook_active) process.exit(0);
  const cwd = hook.cwd || process.cwd();
  try {
    execSync("bash .scaffold/cookbook/closeout-check.sh", { cwd, stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    const verdict = (e.stdout ? e.stdout.toString().trim() : "") || "closeout check failed";
    console.log(
      JSON.stringify({
        decision: "block",
        reason: `scaffold closeout gate: ${verdict} — finish closeout (.scaffold/cookbook/closeout.md) before stopping.`,
      }),
    );
  }
  process.exit(0);
});
