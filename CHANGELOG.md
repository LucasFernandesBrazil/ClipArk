# Changelog

All notable changes to ClipArk are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While
ClipArk is pre-1.0, minor versions may contain breaking changes.

## [Unreleased]

## [0.2.0] - 2026-08-18

### Fixed

- Release builds are now signed ad-hoc in CI (`APPLE_SIGNING_IDENTITY=-`). 0.1.0 shipped a
  bundle with no signature at all — `lipo` invalidates the per-slice signature the linker
  writes when it merges the two architectures, and nothing re-signed the `.app` afterwards
  — which macOS reports as *"ClipArk is damaged and can't be opened"*, a dialog with no
  **Open Anyway** button. Signed builds get the ordinary *"Apple could not verify…"*
  prompt instead, which can be dismissed from *Privacy & Security*.
- The release workflow now mounts the finished `.dmg` and fails if the app inside it is
  not validly signed or is not a genuine universal binary, so neither can silently regress.

### Changed

- The install instructions in both READMEs and in the release notes now quote the dialog
  macOS actually shows and give the exact *Privacy & Security → Open Anyway* path for
  macOS 15 and newer.

## [0.1.0] - 2026-08-17

First public release. macOS only, distributed as an unsigned universal disk image.

### Added

- Clipboard history captured by a background poller (850 ms), stored in a local SQLite
  database under `~/Library/Application Support/dev.clipark.desktop/`. Clips are
  normalised and SHA-256 hashed, so re-copying something bumps it to the front instead of
  creating a duplicate.
- Type detection on capture — `color`, `email`, `url`, `json`, `code`, `text` — each with
  its own card rendering.
- A frameless launcher docked to the bottom of the active display, opened with
  <kbd>⌘</kbd><kbd>⇧</kbd><kbd>V</kbd>, with native macOS vibrancy, no Dock icon and no
  ⌘-Tab entry.
- Search across clip content, type and category name, debounced at 110 ms.
- Favourites (<kbd>⌘</kbd><kbd>D</kbd>), exempt from pruning, and user-defined categories
  with names and colours. Deleting a category releases its clips rather than deleting them.
- Auto-paste: <kbd>⏎</kbd> hides the launcher and pastes into the app you came from, using
  macOS Accessibility access. Optional — turn it off and <kbd>⏎</kbd> only copies.
- Keyboard-first navigation: <kbd>⌘1</kbd>–<kbd>⌘9</kbd> quick paste, <kbd>⌘C</kbd> copy,
  <kbd>⌘D</kbd> favourite, <kbd>Tab</kbd> to cycle filters, <kbd>esc</kbd> to close.
- Menu bar tray with Open, Pause/Resume tracking, Settings and Quit.
- Settings: launch at startup, history limit (500 / 1,000 / 5,000 / 10,000 / unlimited),
  pause tracking, clear history, category management, and the auto-paste toggle.
- A confirmation step in front of every destructive action.
- The app version is shown at the bottom of Settings.

### Security

- No network code of any kind: no HTTP client, no telemetry, and no update checker.
  Releases are downloaded by hand, on purpose.
- A minimal Tauri capability allowlist covering clipboard text read/write, global-shortcut
  registration and autostart only — see `src-tauri/capabilities/default.json`.
- Clipboard content is never written to stdout or to a log file.

### Known limitations

- **The history database is not encrypted.** Anything you copy is stored in plain text.
  See [SECURITY.md](SECURITY.md).
- Builds are unsigned and not notarised, so macOS Gatekeeper blocks the first launch and
  Accessibility access may need to be re-granted after an update. (Ad-hoc signing landed
  after this release — see 0.2.0.)
- Text clips only — images and files are not captured yet.

[Unreleased]: https://github.com/LucasFernandesBrazil/ClipArk/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/LucasFernandesBrazil/ClipArk/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/LucasFernandesBrazil/ClipArk/releases/tag/v0.1.0
