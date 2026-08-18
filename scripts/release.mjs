#!/usr/bin/env node
/**
 * Cuts a ClipArk release: syncs every version file, commits, and creates an annotated
 * tag. Pushing that tag is what triggers .github/workflows/release.yml.
 *
 *   npm run release 0.2.0
 *   npm run release -- 0.2.0 --dry-run
 *
 * Nothing is pushed. The commit and tag stay local until you push them by hand, so
 * `git tag -d vX.Y.Z && git reset --hard HEAD~1` is always a complete undo.
 *
 * Note: this shells out to `npm version --no-git-tag-version`, so a preversion/version/
 * postversion script added to package.json later would fire from inside here.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readChangelogSection } from "./changelog-section.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRACKED = [
  "package.json",
  "package-lock.json",
  "src-tauri/Cargo.toml",
  "src-tauri/Cargo.lock",
  "src-tauri/tauri.conf.json",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noVerify = args.includes("--no-verify");
const version = args.find((arg) => !arg.startsWith("-"));

const abs = (path) => join(ROOT, path);
const read = (path) => readFileSync(abs(path), "utf8");
const die = (message) => {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
};
const ok = (message) => console.log(`  ✓ ${message}`);
const run = (cmd, argv, opts = {}) =>
  execFileSync(cmd, argv, { cwd: ROOT, encoding: "utf8", ...opts }).trim();
const git = (...argv) => run("git", argv);
// Probes whose failure is a meaningful answer, not an error: stderr stays quiet.
const tryGit = (...argv) => {
  try {
    return run("git", argv, { stdio: ["pipe", "pipe", "ignore"] });
  } catch {
    return null;
  }
};

// -- 1. input ---------------------------------------------------------------------
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
if (!version) die("usage: npm run release <version>   (e.g. 0.2.0)");
if (!SEMVER.test(version)) die(`"${version}" is not X.Y.Z or X.Y.Z-prerelease`);
const tag = `v${version}`;

// -- 2. git preconditions ---------------------------------------------------------
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main" && !process.env.CLIPARK_RELEASE_ALLOW_BRANCH) {
  die(`releases are cut from main, not "${branch}" (set CLIPARK_RELEASE_ALLOW_BRANCH=1 to rehearse)`);
}
if (git("status", "--porcelain") !== "") die("working tree is not clean — commit or stash first");
if (tryGit("rev-parse", "-q", "--verify", `refs/tags/${tag}`)) die(`tag ${tag} already exists locally`);
if (tryGit("ls-remote", "--exit-code", "--tags", "origin", tag)) die(`tag ${tag} already exists on origin`);
if (tryGit("fetch", "--quiet", "origin", branch) !== null) {
  const divergence = tryGit("rev-list", "--left-right", "--count", `HEAD...origin/${branch}`);
  if (divergence && divergence.replace(/\s+/g, " ") !== "0 0") {
    die(`local ${branch} and origin/${branch} have diverged (${divergence.replace(/\s+/g, " ")}) — pull/push first`);
  }
  ok(`in sync with origin/${branch}`);
} else {
  console.warn("  ! could not reach origin — skipping the up-to-date check");
}
ok(`on ${branch}, clean tree, ${tag} is free`);

// -- 3. the five files must already agree -----------------------------------------
const CARGO_TOML_VERSION = /^version = "([^"]+)"$/m;              // [package] only; deps use inline tables
const CARGO_LOCK_VERSION = /(name = "clipark"\nversion = ")([^"]+)(")/;
const JSON_VERSION = /^(\s*"version":\s*")([^"]+)(")/m;           // first top-level key wins

const current = {
  "package.json": JSON.parse(read("package.json")).version,
  "package-lock.json": JSON.parse(read("package-lock.json")).version,
  "src-tauri/Cargo.toml": CARGO_TOML_VERSION.exec(read("src-tauri/Cargo.toml"))?.[1],
  "src-tauri/Cargo.lock": CARGO_LOCK_VERSION.exec(read("src-tauri/Cargo.lock"))?.[2],
  "src-tauri/tauri.conf.json": JSON.parse(read("src-tauri/tauri.conf.json")).version,
};
const distinct = [...new Set(Object.values(current))];
if (distinct.length !== 1 || distinct[0] === undefined) {
  die(
    `version files disagree:\n${Object.entries(current)
      .map(([file, value]) => `      ${file}: ${value}`)
      .join("\n")}`,
  );
}
const from = distinct[0];

const compare = (a, b) => {
  const [, aMajor, aMinor, aPatch, aPre] = SEMVER.exec(a);
  const [, bMajor, bMinor, bPatch, bPre] = SEMVER.exec(b);
  for (const [left, right] of [[+aMajor, +bMajor], [+aMinor, +bMinor], [+aPatch, +bPatch]]) {
    if (left !== right) return left - right;
  }
  if (!aPre && bPre) return 1; // 1.0.0 > 1.0.0-rc.1
  if (aPre && !bPre) return -1;
  if (aPre === bPre) return 0;
  return aPre > bPre ? 1 : -1;
};
if (!SEMVER.test(from)) die(`the current version "${from}" is not valid semver`);
if (compare(version, from) <= 0) die(`${version} is not greater than the current ${from}`);
ok(`${from} → ${version} (all ${TRACKED.length} files agree)`);

// -- 4. changelog -----------------------------------------------------------------
const notes = readChangelogSection(version);
if (!notes) {
  die(
    `CHANGELOG.md needs a non-empty "## [${version}] - ${new Date().toISOString().slice(0, 10)}" section.\n` +
      `    Promote the entries under "## [Unreleased]" by hand, then re-run.`,
  );
}
if (!read("CHANGELOG.md").includes(`\n[${version}]: `)) {
  console.warn(`  ! CHANGELOG.md has no "[${version}]: .../compare/v${from}...${tag}" link reference`);
}
ok(`CHANGELOG.md section found (${notes.split("\n").length} lines)`);

if (dryRun) {
  console.log(
    `\n  dry run — nothing written. Would:\n` +
      `    • bump ${TRACKED.join(", ")}\n` +
      `    • commit "chore(release): ${tag}"\n` +
      `    • tag ${tag} (annotated) with:\n\n${notes
        .split("\n")
        .map((line) => `      ${line}`)
        .join("\n")}\n`,
  );
  process.exit(0);
}

// -- 5. write ---------------------------------------------------------------------
// npm owns package.json and package-lock.json; let it do the writing.
run("npm", ["version", version, "--no-git-tag-version"], { stdio: "pipe" });
ok("package.json + package-lock.json");

const patch = (file, pattern, replacement) => {
  const source = read(file);
  const hits = source.match(new RegExp(pattern.source, `${pattern.flags}g`)) ?? [];
  if (hits.length !== 1) die(`expected exactly 1 version match in ${file}, found ${hits.length}`);
  writeFileSync(abs(file), source.replace(pattern, replacement), "utf8");
  ok(file);
};
patch("src-tauri/Cargo.toml", CARGO_TOML_VERSION, `version = "${version}"`);
patch("src-tauri/Cargo.lock", CARGO_LOCK_VERSION, `$1${version}$3`);
patch("src-tauri/tauri.conf.json", JSON_VERSION, `$1${version}$3`);

// -- 6. prove the lockfile is still coherent --------------------------------------
// `--locked` makes cargo fail rather than rewrite when Cargo.lock and Cargo.toml disagree,
// which turns the regex above into a checked edit for free.
if (!noVerify) {
  const metadata = (offline) => {
    const argv = ["metadata", "--locked", "--format-version", "1", "--manifest-path", "src-tauri/Cargo.toml"];
    if (offline) argv.splice(2, 0, "--offline");
    // stdout is discarded, not captured: the metadata JSON for this dependency tree is
    // several MB and would blow past execFileSync's 1 MB maxBuffer, failing the check
    // with an empty error for reasons that have nothing to do with the lockfile.
    return execFileSync("cargo", argv, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    });
  };
  try {
    // --offline first because it is instant, but an incomplete registry cache makes it
    // fail for reasons that have nothing to do with the lockfile. Only a failure that
    // survives a networked retry is a real skew.
    try {
      metadata(true);
    } catch (offlineError) {
      if (offlineError.code === "ENOENT") throw offlineError;
      metadata(false);
    }
    ok("cargo metadata --locked (Cargo.lock is coherent)");
  } catch (error) {
    if (error.code === "ENOENT") console.warn("  ! cargo not on PATH — skipped the Cargo.lock check");
    else die(`cargo rejected the lockfile:\n${error.stderr ?? error.message}`);
  }
}

// -- 7. commit + annotated tag ----------------------------------------------------
git("add", "--", ...TRACKED);
git("commit", "-m", `chore(release): ${tag}`);
// --cleanup=verbatim, or git would strip the "### Added" headings as comments.
execFileSync("git", ["tag", "-a", tag, "--cleanup=verbatim", "-F", "-"], {
  cwd: ROOT,
  input: `ClipArk ${tag}\n\n${notes}\n`,
});
ok(`committed and tagged ${tag}`);

console.log(
  `\n  Next:\n    git push origin ${branch} && git push origin ${tag}\n` +
    `\n  To undo:\n    git tag -d ${tag} && git reset --hard HEAD~1\n`,
);
