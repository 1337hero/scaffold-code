// scaffold-code adapter for Pi (https://pi.dev) — installed globally by `scaffold setup`.
// Keystone: injects .scaffold/BOOT.md into the system prompt every prompt.
// Enforcement lives in the environment (git pre-push hook, installed by `scaffold init/update`)
// and in the outcome gate (cookbook/closeout-check.sh) — this adapter carries no rail logic of
// its own; it only injects BOOT and relays the gate's verdict.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function isScaffoldRepo(cwd: string): boolean {
  return existsSync(join(cwd, ".scaffold", "BOOT.md"));
}

export default function (pi: ExtensionAPI) {
  if (process.env.SCAFFOLD_OFF === "1") return; // explicit human escape hatch

  pi.on("before_agent_start", async (event, ctx) => {
    if (!isScaffoldRepo(ctx.cwd)) return;
    if (event.systemPrompt.includes("scaffold-code — BOOT")) return;
    const boot = readFileSync(join(ctx.cwd, ".scaffold", "BOOT.md"), "utf8");
    return { systemPrompt: `${event.systemPrompt}\n\n${boot}` };
  });

  // outcome gate: nudge the agent once per stale stretch (parity with Claude Code's Stop gate),
  // warn the human on repeats
  let nudged = false;
  pi.on("agent_end", async (_event, ctx) => {
    if (!isScaffoldRepo(ctx.cwd)) return;
    let verdict = "";
    try {
      execSync("bash .scaffold/cookbook/closeout-check.sh", {
        cwd: ctx.cwd,
        stdio: ["ignore", "pipe", "pipe"],
      });
      nudged = false;
      return;
    } catch (e: any) {
      verdict = (e.stdout?.toString() || "closeout check failed").trim();
    }
    if (nudged) {
      ctx.ui.notify(`scaffold closeout gate: ${verdict}`, "warning");
      return;
    }
    nudged = true;
    pi.sendUserMessage(
      `scaffold closeout gate: ${verdict} — finish closeout (.scaffold/cookbook/closeout.md), then re-run \`bash .scaffold/cookbook/closeout-check.sh\`.`,
      { deliverAs: "followUp" },
    );
  });
}
