import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const dirs = ["src", "public", "scripts"];
let count = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const item of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, item);
    if (file.endsWith(".js") || file.endsWith(".mjs")) {
      execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
      count++;
    }
  }
}
for (const file of [
  "public/index.html",
  "public/admin/index.html",
  "public/privacy.html",
  "wrangler.jsonc",
])
  if (!fs.existsSync(file)) throw new Error("Missing " + file);
const html = fs.readFileSync("public/index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)) {
  const file = "public" + match[1];
  if (!fs.existsSync(file)) throw new Error("Missing public asset " + file);
}
console.log(`Syntax and entrypoint checks passed (${count} JavaScript files).`);
