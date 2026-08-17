# ClipArk

Everything you copy, kept in one place.

ClipArk is an open source desktop clipboard manager built with Tauri. It runs offline, stores clipboard history locally in SQLite, and gives you a keyboard-first launcher for finding and reusing copied text quickly.

## Features

- Automatic clipboard history capture for text content
- Type detection for text, URLs, email addresses, HEX colors, JSON, and code snippets
- SQLite persistence in the operating system's app data directory
- Deduplication with copied counts and last-copied ordering
- Fast search across clip content, type, and category name
- Favorites, categories, category assignment, and category filtering
- Global quick launcher shortcut
- Keyboard navigation with arrow keys, Enter, Esc, Cmd/Ctrl+F, Cmd/Ctrl+D, and Delete
- System tray with open, pause/resume tracking, settings, and quit actions
- Settings for autostart, maximum history size, tracking pause, and clearing history
- Dark mode interface designed for dense, low-friction use

## Screenshots

Placeholder for initial screenshots.

## Tech Stack

- Tauri 2
- Rust
- React
- TypeScript
- Vite
- SQLite via `rusqlite`
- Tailwind CSS
- Lucide Icons
- Zustand

## Development

Install prerequisites:

- Node.js and npm
- Rust with Cargo
- Tauri system prerequisites for your OS

Install dependencies:

```bash
npm install
```

Run the desktop app in development:

```bash
npm run tauri dev
```

Run frontend-only development:

```bash
npm run dev
```

Run checks:

```bash
npm run typecheck
npm run build
cd src-tauri
cargo check
```

## Build

Create a production desktop bundle:

```bash
npm run tauri build
```

Generated bundles are ignored by git.

## Project Structure

```text
src/
├── components/
├── hooks/
├── lib/
├── stores/
├── types/
├── App.tsx
└── main.tsx

src-tauri/
├── migrations/
└── src/
    ├── clipboard/
    ├── database/
    ├── commands.rs
    ├── models.rs
    ├── paste.rs
    ├── shortcuts.rs
    ├── tray.rs
    └── lib.rs
```

## Privacy

ClipArk is local-first and offline by design.

- No account
- No cloud sync
- No analytics
- No telemetry
- No external API
- No clipboard content in logs

Clipboard history is stored only on your computer in the app data directory selected by Tauri.

## Roadmap

- FTS5-backed search
- Image and file clipboard support
- App exclusion rules
- Sensitive-content filters
- Import/export
- Light mode
- Custom shortcuts

## Contributing

Issues and pull requests are welcome. Please keep changes focused, avoid adding networked services, and preserve the local-first privacy model.

## License

MIT License. See [LICENSE](LICENSE).
