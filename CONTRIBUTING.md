# Contributing to ClipArk

Thanks for taking an interest. ClipArk is a small project, so nothing here is
bureaucratic — the sections below exist so you don't have to guess.

## The one rule

**ClipArk stays local-first.** No networked services, no accounts, no analytics, no
crash reporters, no phoning home for updates. The privacy claim in the README is meant
to be verifiable by reading the source, and every dependency added is a claim someone
else has to verify.

A pull request that breaks this will be declined regardless of how well it is written.
If you think there's an exception worth making, open an issue first and let's talk it
through before you spend time on code.

## Getting set up

You need Node.js 18+, a stable Rust toolchain from [rustup](https://rustup.rs), and the
Xcode command line tools (`xcode-select --install`).

```bash
git clone https://github.com/LucasFernandesBrazil/ClipArk.git
cd ClipArk
npm install
npm run tauri dev
```

The first Rust build takes a few minutes. After that it is incremental.

To fill the launcher with realistic data instead of copying things by hand, use
*Settings → Development → Seed sample clips*. That section only renders in dev builds.

## Before you open a pull request

```bash
npm run typecheck
npm run build
cd src-tauri && cargo check && cargo fmt --check && cargo clippy
```

There is **no test suite yet**. If you are looking for a first contribution that is
genuinely useful, that is the one — the type-detection and normalisation logic in
`src-tauri/src/database/clips.rs` is pure, well isolated and begging for unit tests.

## Code style

- **TypeScript** runs strict, with `noUnusedLocals` and `noUnusedParameters`. A leftover
  import fails the build, not just the linter.
- **Rust** is `cargo fmt` default. Keep `clippy` quiet.
- **Comments explain why, not what.** The existing ones are a good guide: they document
  the non-obvious constraints (why clicking must not steal focus, why the paste path
  waits 120 ms, why the blur handler is suppressed during auto-paste). Restating what
  the line does adds nothing.
- Match the surrounding code rather than introducing a new idiom. Styling goes through
  the Tailwind tokens in `tailwind.config.js` — please don't hardcode hex values in
  components.

## Where things live

| I want to change… | Look at |
|---|---|
| What the launcher looks like | `src/App.tsx`, `src/components/` |
| A keyboard shortcut | `src/hooks/useLauncherKeys.ts` |
| The global shortcut or window placement | `src-tauri/src/shortcuts.rs` |
| Clipboard capture, dedup, type detection | `src-tauri/src/clipboard/`, `src-tauri/src/database/clips.rs` |
| A new IPC command | `src-tauri/src/commands.rs` + `src/lib/tauri.ts` + the handler list in `src-tauri/src/lib.rs` |
| The database schema | `src-tauri/migrations/001_init.sql` |
| The menu bar | `src-tauri/src/tray.rs` |

### A note on migrations

There is no versioned migration runner yet. `001_init.sql` is `include_str!`'d and run as
a batch on every launch, so it must stay idempotent — `CREATE TABLE IF NOT EXISTS`,
`INSERT OR IGNORE`, and so on. If you need a schema change that cannot be expressed that
way, adding a real migration runner is part of the work.

### A note on permissions

`src-tauri/capabilities/default.json` is deliberately minimal. Adding a capability is a
privacy-relevant change: call it out explicitly in your pull request description and say
what needs it.

## Regenerating assets

Every app icon derives from one 1024×1024 master:

```bash
npx tauri icon docs/brand/icon-master-1024.png
```

That rewrites `src-tauri/icons/`. It also emits `android/` and `ios/` directories — this
project has no mobile targets, so delete them. It does **not** touch `tray.png`, which is
a separate hand-built template image.

Brand sources and the recipe for the master and the tray image are in
[docs/brand/README.md](docs/brand/README.md). README media lives in `docs/assets/`.

Keep brand assets out of `public/` — Vite copies that directory wholesale into the app
bundle, so anything parked there ships to users whether the app uses it or not. Only
`favicon.png` belongs there.

## Reporting things

- **Bugs and features** → the [issue tracker](https://github.com/LucasFernandesBrazil/ClipArk/issues).
  Templates will ask for your macOS version and how you installed ClipArk.
- **Security issues** → [SECURITY.md](SECURITY.md), not the public tracker.
- Please don't paste real clipboard contents into an issue. Redact them; they are, by
  definition, whatever you happened to be copying.

## Code of Conduct

Taking part means agreeing to the [Code of Conduct](CODE_OF_CONDUCT.md).
