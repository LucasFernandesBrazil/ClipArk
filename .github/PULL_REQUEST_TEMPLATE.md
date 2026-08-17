<!--
Thanks for the contribution. Keep this short — the checklist matters more than prose.
-->

## What this changes

<!-- One or two sentences. If it fixes an issue, write "Fixes #123". -->

## Why

<!-- The problem being solved. Skip if it's obvious from the title. -->

## How to check it

<!-- What you did to verify it works. Screenshots or a screen recording help a lot for
     anything that touches the launcher. -->

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `cd src-tauri && cargo check` passes
- [ ] `cargo fmt` and `cargo clippy` are clean (if you touched Rust)
- [ ] Ran it with `npm run tauri dev` and used the feature by hand

## Local-first check

ClipArk sends nothing anywhere. Confirm this PR keeps it that way:

- [ ] No network calls, no new HTTP/analytics/telemetry dependency
- [ ] No new entries in `src-tauri/capabilities/default.json` — or, if there are, they're
      explained above and the README's privacy section is updated to match
- [ ] Clipboard content is not written to logs or stdout

## Anything else

<!-- Trade-offs you made, things you're unsure about, follow-up work you'd like a second
     opinion on. Half-finished is fine as long as it's flagged. -->
