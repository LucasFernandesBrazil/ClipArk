#!/usr/bin/env node
/**
 * Extracts one version's section out of CHANGELOG.md (Keep a Changelog format).
 *
 * One parser, two consumers: scripts/release.mjs uses it to validate that a section
 * exists before cutting a tag, and .github/workflows/release.yml uses it to build the
 * GitHub Release body. Keeping them on the same code path is what stops the two from
 * drifting apart.
 *
 *   node scripts/changelog-section.mjs 0.2.0
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CHANGELOG = join(dirname(fileURLToPath(import.meta.url)), "..", "CHANGELOG.md");

/** Body of `## [<version>] - <date>`, heading excluded. `null` when absent or empty. */
export function changelogSection(markdown, version) {
  const lines = markdown.split("\n");
  const heading = new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`);
  // Stop at the next section *or* at the trailing link-reference block — that block sits
  // after the last section, so without this the newest release would swallow it.
  const stop = /^(## \[|\[[^\]]+\]:\s)/;

  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (stop.test(lines[i])) {
      end = i;
      break;
    }
  }

  const body = lines.slice(start + 1, end).join("\n").trim();
  return body.length > 0 ? body : null;
}

export function readChangelogSection(version) {
  return changelogSection(readFileSync(CHANGELOG, "utf8"), version);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const version = process.argv[2];
  if (!version) {
    console.error("usage: changelog-section.mjs <version>");
    process.exit(2);
  }
  const body = readChangelogSection(version);
  if (!body) {
    console.error(`CHANGELOG.md has no non-empty section for ${version}`);
    process.exit(1);
  }
  process.stdout.write(`${body}\n`);
}
