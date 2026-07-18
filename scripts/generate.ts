/**
 * data/games.json から全ゲームの法務ページを生成する。
 *
 *   make generate
 *
 * 出力は <slug>/index.html (サポート) と <slug>/privacy.html。
 * 生成物は git 管理下に入る — GitHub Pages がそのまま配信するため。
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { indexPage, privacyPage, supportPage } from "../src/templates.js";
import type { GamesFile } from "../src/types.js";

// make が常にリポジトリ直下で走らせる前提。バンドル後の一時ファイルの場所には依存しない。
const ROOT = process.cwd();

/** 生成物ではない、ルート直下の管理対象。掃除のときに消してはいけない。 */
const KEEP = new Set([
  ".git",
  ".gitignore",
  ".nojekyll",
  "CNAME",
  "Makefile",
  "README.md",
  "data",
  "index.html",
  "node_modules",
  "package.json",
  "package-lock.json",
  "scripts",
  "src",
  "tsconfig.json",
]);

function loadGames(): GamesFile {
  return JSON.parse(readFileSync(join(ROOT, "data", "games.json"), "utf8")) as GamesFile;
}

/**
 * games.json から消えたゲームのディレクトリを削除する。
 * リネームや取り下げのあと、孤児ページが公開され続けるのを防ぐ。
 */
function removeStaleDirs(slugs: Set<string>): string[] {
  const removed: string[] = [];
  for (const entry of readdirSync(ROOT)) {
    if (KEEP.has(entry)) continue;
    if (!statSync(join(ROOT, entry)).isDirectory()) continue;
    if (slugs.has(entry)) continue;
    rmSync(join(ROOT, entry), { recursive: true });
    removed.push(entry);
  }
  return removed;
}

function main(): void {
  const meta = loadGames();
  const slugs = new Set(meta.games.map((g) => g.slug));

  if (slugs.size !== meta.games.length) {
    throw new Error("data/games.json に slug の重複があります");
  }

  for (const game of meta.games) {
    const dir = join(ROOT, game.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), supportPage(game, meta));
    writeFileSync(join(dir, "privacy.html"), privacyPage(game, meta));
  }

  writeFileSync(join(ROOT, "index.html"), indexPage(meta));

  // Jekyll を通さず静的ファイルをそのまま配信させる。
  writeFileSync(join(ROOT, ".nojekyll"), "");

  const removed = removeStaleDirs(slugs);

  console.log(`generated ${meta.games.length} games (${meta.games.length * 2} pages) + index.html`);
  if (removed.length) console.log(`removed stale: ${removed.join(", ")}`);
}

main();
