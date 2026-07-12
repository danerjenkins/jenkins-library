# Codex Cloud Setup

Use this repo from ChatGPT/Codex cloud when you want to prompt from your phone, review changes, merge them, and test the Vercel deployment.

## One-Time Setup In ChatGPT/Codex

1. Open Codex in ChatGPT.
2. Connect GitHub.
3. Give Codex access to `danerjenkins/jenkins-library`.
4. Create an environment for this repository.
5. Use this setup command:

```bash
npm install
```

6. Use this validation command:

```bash
npm run typecheck
```

## Recommended Phone Workflow

1. Start a Codex task from your phone.
2. Ask it to make the change and follow `AGENTS.md`.
3. Ask it to run `npm run typecheck`.
4. Review the diff.
5. Merge the PR or approve pushing to `main`.
6. Wait for Vercel to finish deploying from `main`.
7. Test the live site on your phone.

## Prompt Template

```text
In danerjenkins/jenkins-library, make this focused change:

<describe the issue and desired behavior>

Follow AGENTS.md and DESIGN_SYSTEM.md. Keep the change small. Run npm run typecheck.
Open a PR with a concise summary and note any validation issues.
```

## Supabase Notes

App-only UI changes can usually be handled entirely in Codex cloud.

Schema changes need extra care. If a task adds or changes Supabase columns, tables, policies, or views:

- add a migration under `supabase/migrations`
- verify the live schema before assuming the deployed app can use it
- avoid changing production data unless the task explicitly requires it

If Codex cloud does not have Supabase credentials, use the local workflow to apply the migration, or set up a separate migration deployment process.
