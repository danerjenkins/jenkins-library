// npm run bug:pull -- <id>
// Writes .bugs/<id8>/{report.md, context.json, row.json, screenshot.png} for the fix-bug skill.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BugMessage, BugReport } from "../src/features/feedback/lib/feedbackTypes.ts";
import { buildRepairMarkdown } from "../src/features/feedback/lib/repairMarkdown.ts";
import {
  createServiceClient,
  repoRoot,
  resolveReportId,
  runCli,
  SCREENSHOT_BUCKET,
} from "./lib/feedbackClient.ts";

await runCli(async () => {
  const input = process.argv[2];
  if (!input) throw new Error("usage: npm run bug:pull -- <id>");

  const client = createServiceClient();
  const id = await resolveReportId(client, input);
  const { data, error } = await client.from("bug_reports").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  const { context, ...row } = data as BugReport;

  const { data: thread, error: threadError } = await client
    .from("bug_messages")
    .select("sender_role, body, created_at")
    .eq("bug_id", id)
    .order("created_at");
  if (threadError) throw new Error(threadError.message);

  // The row is the source of truth, so an older pull is replaced rather than merged.
  const directory = resolve(repoRoot, ".bugs", id.slice(0, 8));
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });

  let markdown = buildRepairMarkdown({ ...row, context });
  const messages = thread as Pick<BugMessage, "sender_role" | "body" | "created_at">[];
  if (messages.length > 0) {
    const lines = messages.map((m) => `- ${m.created_at} **${m.sender_role}:** ${m.body}`);
    markdown += `\n## thread\n${lines.join("\n")}\n`;
  }
  writeFileSync(resolve(directory, "report.md"), markdown);
  writeFileSync(resolve(directory, "context.json"), `${JSON.stringify(context, null, 2)}\n`);
  writeFileSync(resolve(directory, "row.json"), `${JSON.stringify(row, null, 2)}\n`);

  const files = ["report.md", "context.json", "row.json"];
  if (row.screenshot_path) {
    const download = await client.storage.from(SCREENSHOT_BUCKET).download(row.screenshot_path);
    if (download.error) {
      console.warn(`screenshot unavailable: ${download.error.message}`);
    } else {
      const bytes = Buffer.from(await download.data.arrayBuffer());
      writeFileSync(resolve(directory, "screenshot.png"), bytes);
      files.push("screenshot.png");
    }
  }
  console.log(`.bugs/${id.slice(0, 8)}/: ${files.join(", ")}`);
});
