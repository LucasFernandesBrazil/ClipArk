# Security Policy

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/LucasFernandesBrazil/ClipArk/security/advisories/new)
on this repository. Include what you found, how to reproduce it, and what an attacker
could do with it.

This is a small project maintained in spare time. Expect a first reply within about a
week. If a fix is warranted, it lands before the issue is discussed publicly, and you get
credit in the release notes unless you'd rather not.

## Supported versions

ClipArk is pre-1.0 and has no published releases yet. Only the current `main` branch is
supported.

## What ClipArk is and is not

Being honest about this matters more than a reassuring paragraph would.

### What holds up

- **No network code.** No HTTP client, no fetch plugin, no analytics, no telemetry, no
  update checker. Clipboard content has nowhere to go.
- **A minimal permission allowlist.** `src-tauri/capabilities/default.json` grants only
  clipboard text read/write, global-shortcut registration, and autostart toggling.
- **Nothing is logged.** Clipboard content never reaches stdout or a log file.
- **Accessibility permission is used for exactly one thing** — synthesising a ⌘V
  keystroke in `src-tauri/src/paste.rs` after the launcher hides. It is optional: turn
  auto-paste off and ClipArk never asks for it.

### What does not

> [!WARNING]
> **The history database is not encrypted.**

`~/Library/Application Support/dev.clipark.desktop/clipark.sqlite3` is a plain SQLite
file with the permissions of your user account. That means:

- Anything you copy is stored in **plain text** — including passwords pasted from a
  password manager, API keys, tokens and 2FA codes — until it is pruned by the history
  limit or you clear the history by hand.
- **Favourites are exempt from pruning.** A favourited secret stays until you delete it.
- Any process running as your user, and any backup that includes your Application Support
  directory (Time Machine, cloud-synced backups), can read that file.
- **Sensitive-content filtering is on the roadmap and does not exist yet.** ClipArk does
  not detect password-manager clipboard writes, does not honour the macOS
  `org.nspasteboard.ConcealedType` hint, and does not expire clips on a timer.

Until that changes, use **Pause tracking** — in the tray menu or *Settings → History* —
before handling secrets, and **Clear history** afterwards.

ClipArk also does not defend against a compromised account: an attacker who can already
run code as you can read the clipboard directly, with or without ClipArk installed.

## In scope

- Clipboard data reaching anywhere outside the local database
- Privilege escalation via the Tauri IPC surface or the capability allowlist
- The auto-paste path being usable to inject keystrokes beyond a single ⌘V
- SQL injection in the query layer
- Anything that contradicts a privacy claim made in the README

## Out of scope

- The unencrypted database itself — documented above, and tracked as a roadmap item
- Physical access to an unlocked Mac
- Vulnerabilities in Tauri, Rust crates or npm packages: report those upstream, though a
  heads-up here is appreciated if ClipArk needs to pin or patch
- Unsigned build warnings from Gatekeeper: builds from source are expected to be unsigned
