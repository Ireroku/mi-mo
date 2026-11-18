// 開発用のページを作る: Chrome 向けのビルドをコピーし、拡張機能の API を shim.js で代用する
// 使い方: pnpm harness（ビルドの後にこのスクリプトを実行する）
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const source = join(root, ".output/chrome-mv3");
const target = join(root, ".output/harness");
const pages = ["popup.html", "options.html"];

if (!existsSync(source)) {
  console.error(`${source} がありません。先に pnpm build を実行してください`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
cpSync(join(root, "scripts/harness/shim.js"), join(target, "shim.js"));

for (const page of pages) {
  const path = join(target, page);
  const html = readFileSync(path, "utf8");

  if (!html.includes("<head>")) {
    console.error(`${page} に <head> がありません`);
    process.exit(1);
  }

  writeFileSync(path, html.replace("<head>", '<head>\n    <script src="/shim.js"></script>'));
}

console.log(`開発用のページを ${target} に作りました`);
