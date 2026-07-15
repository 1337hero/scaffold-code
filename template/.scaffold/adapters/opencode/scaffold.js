// scaffold-code adapter for opencode (https://opencode.ai) — installed globally by `scaffold setup`.
// Keystone: injects .scaffold/BOOT.md into the system prompt every request.
// Enforcement lives in the environment (git pre-push hook, installed by `scaffold init/update`)
// and in the outcome gate (cookbook/closeout-check.sh) — this adapter carries no rail logic of
// its own; it only injects BOOT and relays the gate's verdict.
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";

function scaffoldRoot(cwd) {
  let dir = resolve(cwd || process.cwd());
  while (true) {
    if (existsSync(join(dir, ".scaffold", "BOOT.md"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export const Scaffold = async ({ client, directory, worktree }) => {
  if (process.env.SCAFFOLD_OFF === "1") return {}; // explicit human escape hatch
  const root = scaffoldRoot(worktree || directory);
  if (!root) return {};

  // outcome gate: nudge the agent once per stale stretch (parity with Claude Code's Stop gate),
  // warn the human on repeats
  const nudged = new Set();
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      if (output.system.some((s) => s.includes("scaffold-code — BOOT"))) return;
      output.system.push(readFileSync(join(root, ".scaffold", "BOOT.md"), "utf8"));
    },
    event: async ({ event }) => {
      if (event.type !== "session.idle") return;
      const sessionID = event.properties.sessionID;
      const session = await client.session.get({ path: { id: sessionID } });
      if (!session.data || session.data.parentID) return; // gate speaks to top-level sessions only
      let verdict = "";
      try {
        execFileSync("bash", [".scaffold/cookbook/closeout-check.sh"], {
          cwd: root,
          stdio: ["ignore", "pipe", "pipe"],
        });
        nudged.delete(sessionID);
        return;
      } catch (error) {
        verdict = error.stdout?.toString().trim() || "closeout check failed";
      }
      if (nudged.has(sessionID)) {
        await client.tui.showToast({
          body: { message: `scaffold closeout gate: ${verdict}`, variant: "warning" },
        });
        return;
      }
      nudged.add(sessionID);
      await client.session.prompt({
        path: { id: sessionID },
        body: {
          parts: [
            {
              type: "text",
              text: `scaffold closeout gate: ${verdict} — finish closeout (.scaffold/cookbook/closeout.md), then re-run \`bash .scaffold/cookbook/closeout-check.sh\`.`,
            },
          ],
        },
      });
    },
  };
};
