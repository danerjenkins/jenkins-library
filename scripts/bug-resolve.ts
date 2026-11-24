// npm run bug:resolve -- <id> [--resolution fixed|noise|duplicate|wontfix|by_design]
//   [--commit <sha>] [--note <text>] [--duplicate-of <id>] [--via cli|commit] [--reopen]
// A thin wrapper over library.feedback_resolve, the same close path the inbox uses.
import { execSync } from "node:child_process";
import { parseArgs } from "node:util";
import { createServiceClient, resolveReportId, runCli } from "./lib/feedbackClient.ts";

await runCli(async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      resolution: { type: "string", default: "fixed" },
      commit: { type: "string" },
      note: { type: "string" },
      "duplicate-of": { type: "string" },
      via: { type: "string", default: "cli" },
      reopen: { type: "boolean", default: false },
    },
  });
  if (!positionals[0]) {
    throw new Error("usage: npm run bug:resolve -- <id> [--resolution ...] [--note ...]");
  }

  const client = createServiceClient();
  const id = await resolveReportId(client, positionals[0]);
  const shortId = id.slice(0, 8);

  if (values.reopen) {
    const { error } = await client.rpc("feedback_reopen", { p_id: id, p_via: values.via });
    if (error) throw new Error(error.message);
    console.log(`bug ${shortId} reopened`);
    return;
  }

  const isFixed = values.resolution === "fixed";
  const commit = isFixed
    ? (values.commit ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim())
    : null;
  const duplicateOf = values["duplicate-of"]
    ? await resolveReportId(client, values["duplicate-of"])
    : null;

  const { error } = await client.rpc("feedback_resolve", {
    p_id: id,
    p_resolution: values.resolution,
    p_reporter_note: values.note ?? null,
    p_fixed_commit: commit,
    p_duplicate_of: duplicateOf,
    p_via: values.via,
  });
  if (error) throw new Error(error.message);
  console.log(`bug ${shortId} resolved as ${values.resolution}${commit ? ` (${commit})` : ""}`);
});
