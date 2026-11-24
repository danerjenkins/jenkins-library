// Point git at .githooks/ (the feedback post-commit hook). Runs on `npm install`.
import { execSync } from "node:child_process";

try {
  execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  execSync("git config core.hooksPath .githooks", { stdio: "ignore" });
} catch {
  // Not a git checkout (for example a deploy build), so there is nothing to wire.
}
