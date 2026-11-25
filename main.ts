import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CHARS = 200;
const MIN_CHARS = 1;

function scriptFolder(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return dirname(currentFile);
}

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function loadEntry(folder: string): Buffer {
  const entryPath = join(folder, "entry.txt");
  try {
    return readFileSync(entryPath);
  } catch {
    fail(`cannot read entry.txt next to main.ts at ${entryPath}`);
  }
}

function checkEntry(raw: Buffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    fail("entry.txt is not valid UTF-8");
  }
  const length = [...text].length;
  if (length < MIN_CHARS || length > MAX_CHARS) {
    fail(`entry is ${length} characters, must be ${MIN_CHARS}-${MAX_CHARS}`);
  }
  if (text.trim().length === 0) {
    fail("entry must not be only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    fail("entry must be a single line with no newline characters");
  }
  if (text !== text.trim()) {
    fail("entry must not start or end with whitespace");
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 3) {
    fail("entry is too short to be a joke: it needs at least 3 words");
  }
  return text;
}

function destinationFolder(): string {
  const configured = process.env.MAKEFUN_OUTPUT_DIR;
  if (configured && configured.trim().length > 0) {
    return configured;
  }
  return join(scriptFolder(), "out");
}

function main(): void {
  const folder = scriptFolder();
  const raw = loadEntry(folder);
  const text = checkEntry(raw);
  const outDir = destinationFolder();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), raw);
  console.log(`ok: entry is ${[...text].length} characters, wrote entry.txt`);
}

main();
