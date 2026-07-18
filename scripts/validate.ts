/**
 * data/games.json と生成済み HTML の検査。
 *
 *   make check
 *
 * App Store に出す文書なので、文法的に壊れた文や取りこぼした穴を機械で潰す。
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Game, GamesFile } from "../src/types.js";

// make が常にリポジトリ直下で走らせる前提。
const ROOT = process.cwd();
const errors: string[] = [];

function fail(where: string, message: string): void {
  errors.push(`${where}: ${message}`);
}

function checkGame(game: Game): void {
  const at = game.slug;

  if (!/^[a-z0-9-]+$/.test(game.slug)) fail(at, "slug は英小文字・数字・ハイフンのみ");
  if (!game.title.trim()) fail(at, "title が空");

  // "Thanks for playing {title}, {genre}." に収まる形か
  if (!/^an? /.test(game.genre)) fail(at, `genre は "a"/"an" で始めること: "${game.genre}"`);
  if (game.genre.trim().endsWith(".")) fail(at, "genre の末尾にピリオドは不要");

  if (!game.mechanic.trim().endsWith(".")) fail(at, "mechanic はピリオドで終えること");
  if (game.mechanic.trim().length < 25) fail(at, "mechanic が短すぎる（具体性の欠如を疑う）");

  // "Your {storedData} are saved only on your device." に収まる形か
  if (!game.storedData.includes("and settings")) {
    fail(at, `storedData は "and settings" で終えること: "${game.storedData}"`);
  }
  if (/^(your|the) /i.test(game.storedData)) fail(at, "storedData の先頭に Your/The は不要");

  if (game.purchaseModel === "none" && game.purchaseItems) {
    fail(at, "purchaseModel が none なのに purchaseItems がある");
  }
  if (game.purchaseItems.trim().endsWith(".")) fail(at, "purchaseItems の末尾にピリオドは不要");

  // 広告除去を売っているのに広告が無い、という矛盾
  if (!game.hasAds && !game.hasRewardedAds && /remove ads/i.test(game.purchaseItems)) {
    fail(at, "広告が無いのに Remove Ads を販売している");
  }

  if (new Set(game.permissions).size !== game.permissions.length) {
    fail(at, "permissions が重複している");
  }
}

/** 生成ページ共通の検査。ゲームページにもルートの索引にも同じだけ効かせる。 */
function checkPageHtml(html: string, at: string): void {
  if (/\{[A-Z_]+\}|\$\{/.test(html)) fail(at, "未置換のプレースホルダが残っている");
  if (html.includes("undefined") || html.includes("[object Object]")) {
    fail(at, "undefined / [object Object] が混入している");
  }
  // "playing X, a game.." や "INC.. Pick" のような二重句読点
  if (/[,.]\s*[,.]/.test(html)) fail(at, "句読点が重複している");
  if (!html.trimEnd().endsWith("</html>")) fail(at, "HTML が閉じていない");

  const opens = (html.match(/<(p|ul|li|h1|h2)\b/g) ?? []).length;
  const closes = (html.match(/<\/(p|ul|li|h1|h2)>/g) ?? []).length;
  if (opens !== closes) fail(at, `タグの開閉数が不一致 (open ${opens} / close ${closes})`);
}

function checkHtml(game: Game): void {
  for (const file of ["index.html", "privacy.html"]) {
    const path = join(ROOT, game.slug, file);
    if (!existsSync(path)) {
      fail(game.slug, `${file} が未生成（make generate を実行）`);
      continue;
    }
    const html = readFileSync(path, "utf8");
    const at = `${game.slug}/${file}`;

    checkPageHtml(html, at);
    if (!html.includes(game.title)) fail(at, "タイトルが本文に出てこない");
  }

  const support = readFileSync(join(ROOT, game.slug, "index.html"), "utf8");
  if (!support.includes('href="privacy.html"')) {
    fail(`${game.slug}/index.html`, "privacy.html へのリンクが無い");
  }
}

function main(): void {
  const meta = JSON.parse(
    readFileSync(join(ROOT, "data", "games.json"), "utf8"),
  ) as GamesFile;

  if (!meta.games.length) fail("games.json", "ゲームが 0 件");
  if (!/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(meta.lastUpdated)) {
    fail("games.json", `lastUpdated は "July 18, 2026" 形式にすること: "${meta.lastUpdated}"`);
  }

  for (const game of meta.games) {
    checkGame(game);
    checkHtml(game);
  }

  const index = join(ROOT, "index.html");
  if (!existsSync(index)) {
    fail("index.html", "未生成");
  } else {
    const html = readFileSync(index, "utf8");
    checkPageHtml(html, "index.html");
    for (const game of meta.games) {
      if (!html.includes(`href="${game.slug}/"`)) {
        fail("index.html", `${game.slug} へのリンクが無い`);
      }
    }
  }

  if (errors.length) {
    console.error(`\n${errors.length} 件の問題:\n`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  console.log(`ok — ${meta.games.length} games, ${meta.games.length * 2 + 1} pages`);
}

main();
