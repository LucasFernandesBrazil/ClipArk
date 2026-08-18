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

## Releasing

Versions live in five files. **Never edit one by hand** — `scripts/release.mjs` is the only
supported path, and it refuses to run if the five disagree.

1. Promote the entries under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) to a new
   `## [X.Y.Z] - YYYY-MM-DD` heading, add the `[X.Y.Z]: …/compare/vPREV...vX.Y.Z` link
   reference at the bottom, repoint `[Unreleased]`, and commit. The release script aborts
   if the section is missing or empty.
2. Rehearse, then cut:

   ```bash
   npm run release:dry -- X.Y.Z
   npm run release X.Y.Z
   ```

   That syncs `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`,
   `src-tauri/Cargo.lock` and `src-tauri/tauri.conf.json`, commits `chore(release): vX.Y.Z`
   and creates an annotated `vX.Y.Z` tag. Nothing is pushed, so
   `git tag -d vX.Y.Z && git reset --hard HEAD~1` undoes all of it.
3. Push. The tag is what triggers the build:

   ```bash
   git push origin main && git push origin vX.Y.Z
   ```

4. `.github/workflows/release.yml` builds a universal `.dmg` on a macOS runner (~30–45 min)
   and opens a **draft** release with the disk image and a `SHA256SUMS.txt` attached.
5. Download that `.dmg`, check it on a Mac that has never run a local build, then publish
   the release. If something is wrong, delete the draft and the tag — nothing was public.

To check that the universal build still compiles without cutting a release, run the
workflow manually from the Actions tab with **publish** off; it uploads the `.dmg` as a
workflow artifact and creates no tag and no release.

## Reporting things

- **Bugs and features** → the [issue tracker](https://github.com/LucasFernandesBrazil/ClipArk/issues).
  Templates will ask for your macOS version and how you installed ClipArk.
- **Security issues** → [SECURITY.md](SECURITY.md), not the public tracker.
- Please don't paste real clipboard contents into an issue. Redact them; they are, by
  definition, whatever you happened to be copying.

## Code of Conduct

Taking part means agreeing to the [Code of Conduct](CODE_OF_CONDUCT.md).
