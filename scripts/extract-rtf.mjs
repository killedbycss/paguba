import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [source, destination = "content/cases.js"] = process.argv.slice(2);
if (!source) throw new Error("Usage: node scripts/extract-rtf.mjs <source.rtf> [destination.js]");

const result = spawnSync("textutil", ["-convert", "txt", "-stdout", source], { encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr || "Could not convert RTF");

const headingPattern = /^(Материалы|Сводка)/;
const chapters = [];
let chapter = null;
let quote = null;

for (const sourceLine of result.stdout.split(/\r?\n/)) {
  const line = sourceLine.trim();
  if (headingPattern.test(line)) {
    chapter = { sourceTitle: line, documents: [] };
    chapters.push(chapter);
    quote = null;
    continue;
  }
  if (!chapter) continue;
  if (quote === null && line.startsWith("«")) quote = line.slice(1);
  else if (quote !== null) quote += `\n${line}`;
  if (quote !== null && /»[.!?,…]*$/.test(line)) {
    chapter.documents.push(quote.slice(0, quote.lastIndexOf("»")).trim());
    quote = null;
  }
}

const js = `window.CASE_DATA = ${JSON.stringify(chapters, null, 2)};\n`;
writeFileSync(resolve(destination), js, "utf8");
console.log(chapters.map((item, index) => `0${index + 1}: ${item.documents.length}`).join("\n"));
