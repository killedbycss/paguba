import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [source, destination = "content/book.js"] = process.argv.slice(2);
if (!source) throw new Error("Usage: node scripts/extract-book.mjs <source.rtf> [destination.js]");

const titles = [
  "Убийство в доме",
  "Смерть Душегубова",
  "Курьер невинных душ",
  "Военные",
  "Боровик",
  "Ворон",
  "Тёмный сын",
  "Обряд",
];

const result = spawnSync("textutil", ["-convert", "txt", "-stdout", source], { encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr || "Could not convert RTF");

function typograph(value) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|[\s(«„])([А-Яа-яA-Za-z]{1,2}) /g, "$1$2\u00a0")
    .replace(/ (без|вне|для|до|из|из-за|кроме|между|на|над|не|ни|об|от|перед|по|под|при|про|через) /gi, " $1\u00a0")
    .replace(/ — /g, " — ")
    .trim();
}

const lines = result.stdout.split(/\r?\n/);
const starts = titles.map(title => lines.findIndex(line => line.trim() === title));
const chapters = titles.map((title, index) => {
  const start = starts[index] + 1;
  const end = index === titles.length - 1 ? lines.length : starts[index + 1];
  return { title, text: typograph(lines.slice(start, end).join("\n")) };
});

writeFileSync(resolve(destination), `window.BOOK_DATA = ${JSON.stringify(chapters, null, 2)};\n`, "utf8");
console.log(chapters.map((chapter, index) => `${index + 1}. ${chapter.title}: ${chapter.text.split(/\s+/).length} words`).join("\n"));
