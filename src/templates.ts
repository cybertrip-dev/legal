/**
 * 全ゲーム共通のページテンプレート。
 *
 * 文面は neon-glide / shape-shift / rush-hour-relay の3ゲームで既に公開・運用している
 * ものをそのまま踏襲している。文言を変えると全ゲームの法務ページが一斉に変わるので、
 * 変更したら data/games.json の lastUpdated も更新すること。
 */

import type { Game, GamesFile, Permission } from "./types.js";

const STYLE_SUPPORT = `  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a2e; }
  h1 { font-size: 1.6rem; } h2 { font-size: 1.15rem; margin-top: 2rem; }
  a { color: #0a63c9; }`;

const STYLE_PRIVACY = `${STYLE_SUPPORT}
  .updated { color: #666; font-size: 0.9rem; }
  code { background: #f0f2f8; padding: 1px 5px; border-radius: 4px; }`;

/** HTML のテキストノードに値を差し込むためのエスケープ。 */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 段落を手書き相当の幅で折り返す。生成物の diff を人間が読めるようにするためだけの処理で、
 * 表示には影響しない。実体参照は空白を含まないので分断されない。
 */
function wrap(text: string, width = 84): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function page(title: string, style: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${style}
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

/** 端末機能ごとの開示文。「その場で使うだけで保存も送信もしない」ことを明示する。 */
const PERMISSION_COPY: Record<Permission, string> = {
  camera:
    "<strong>Camera</strong> &mdash; used to drive gameplay. The image is processed on your device in real time and is never recorded, stored, or sent anywhere.",
  microphone:
    "<strong>Microphone</strong> &mdash; used to drive gameplay. Audio is processed on your device in real time and is never recorded, stored, or sent anywhere.",
  motion:
    "<strong>Motion sensors</strong> &mdash; the accelerometer and gyroscope are read to control the game. The readings are used only in the moment and are never stored or sent anywhere.",
  location:
    "<strong>Location</strong> &mdash; used to drive gameplay. It is used only in the moment and is never stored or sent anywhere.",
  notifications:
    "<strong>Notifications</strong> &mdash; reminders are scheduled locally on your device. We do not operate a push server and cannot send you messages.",
  photos:
    "<strong>Photo library</strong> &mdash; accessed only when you choose to save or pick an image. We never read your library in the background.",
  contacts:
    "<strong>Contacts</strong> &mdash; accessed only when you explicitly choose to use the feature. Contacts are never uploaded.",
  health:
    "<strong>Health data</strong> &mdash; read only with your permission and never stored or sent anywhere.",
};

/** iOS 設定アプリで許可を取り消す場所。permissions がある場合に「Your choices」へ足す。 */
const PERMISSION_SETTINGS: Record<Permission, { label: string; path: string }> = {
  camera: { label: "camera", path: "Settings &rarr; Privacy &amp; Security &rarr; Camera" },
  microphone: { label: "microphone", path: "Settings &rarr; Privacy &amp; Security &rarr; Microphone" },
  motion: { label: "motion sensor", path: "Settings &rarr; Privacy &amp; Security &rarr; Motion &amp; Fitness" },
  location: { label: "location", path: "Settings &rarr; Privacy &amp; Security &rarr; Location Services" },
  notifications: { label: "notification", path: "Settings &rarr; Notifications" },
  photos: { label: "photo library", path: "Settings &rarr; Privacy &amp; Security &rarr; Photos" },
  contacts: { label: "contacts", path: "Settings &rarr; Privacy &amp; Security &rarr; Contacts" },
  health: { label: "health data", path: "Settings &rarr; Privacy &amp; Security &rarr; Health" },
};

export function supportPage(game: Game, meta: GamesFile): string {
  const sections: string[] = [];

  sections.push(`<h1>${esc(game.title)} &mdash; Support</h1>`);
  sections.push(
    `<p>${wrap(`Thanks for playing ${esc(game.title)}, ${esc(game.genre)}. ${esc(game.mechanic)}`)}</p>`,
  );

  sections.push(`<h2>Contact</h2>
<p>For help, questions, or bug reports, email us at
<a href="mailto:${meta.contactEmail}">${meta.contactEmail}</a>. We usually reply within a
few business days.</p>`);

  if (game.purchaseModel === "subscription") {
    sections.push(`<h2>Subscription</h2>
<p>The optional "Remove Ads" subscription removes all ads. Manage or cancel it any time
in iOS <strong>Settings &rarr; [your name] &rarr; Subscriptions</strong>.</p>`);
  } else if (game.purchaseModel === "onetime") {
    const items = game.purchaseItems ? ` (${esc(game.purchaseItems)})` : "";
    sections.push(`<h2>Purchases</h2>
<p>${wrap(`All purchases${items} are one-time, non-consumable products &mdash; there is no subscription. If you reinstall the app or switch devices, use <strong>Settings &rarr; Restore purchases</strong> inside the game to restore them.`)}</p>`);
  }

  sections.push(`<h2>Privacy</h2>
<p>See our <a href="privacy.html">Privacy Policy</a>.</p>`);

  return page(`Support — ${game.title}`, STYLE_SUPPORT, sections.join("\n\n"));
}

export function privacyPage(game: Game, meta: GamesFile): string {
  const sections: string[] = [];

  sections.push(`<h1>Privacy Policy &mdash; ${esc(game.title)}</h1>
<p class="updated">Last updated: ${meta.lastUpdated}</p>`);

  sections.push(
    `<p>${wrap(`${esc(game.title)} ("the app") is published by ${meta.publisher} ("we", "us"). This policy explains what data the app handles.`)}</p>`,
  );

  const offline = game.offlinePlayable ? " The game is fully playable offline." : "";
  sections.push(`<h2>Data we store on your device</h2>
<p>${wrap(`Your ${esc(game.storedData)} are saved <strong>only on your device</strong> (local storage). We do not operate a server and do not receive, sell, or share this data.${offline} This data exists only for as long as the app is installed &mdash; deleting the app permanently deletes it, and we keep no copy.`)}</p>`);

  if (game.hasAds || game.hasRewardedAds) {
    const removal =
      game.purchaseModel === "subscription"
        ? 'You can remove all ads by purchasing the optional "Remove Ads" subscription.'
        : game.purchaseModel === "onetime"
          ? 'You can remove all ads with the one-time "Remove Ads" purchase.'
          : "";
    const rewarded = game.hasRewardedAds
      ? "Rewarded ads are always optional and never gate game content."
      : "";
    const closing = [removal, rewarded].filter(Boolean).join(" ");

    sections.push(`<h2>Advertising</h2>
<p>The app shows ads through <strong>Google AdMob</strong>. To serve ads, Google may
collect and process data such as a device advertising identifier, ad interaction data,
and approximate, coarse information about your device. Depending on your choices and
region, ads may be personalized or non-personalized.</p>
<ul>
  <li>On iOS, we ask for permission via <strong>App Tracking Transparency (ATT)</strong>
      before any tracking for personalized ads. If you decline, you still see ads, but
      non-personalized ones.</li>
  <li>In the European Economic Area and the United Kingdom, a consent dialog is
      shown before any ads are served. Personalized ads are shown only with your
      consent; otherwise ads are non-personalized.</li>
  <li>Google's handling of this data is governed by its own policy:
      <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
  <li>How Google uses data from apps that use its services:
      <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a></li>
</ul>${closing ? `\n<p>${wrap(closing)}</p>` : ""}`);
  } else {
    sections.push(`<h2>Advertising</h2>
<p>The app does not show ads and does not include any advertising or analytics SDK.</p>`);
  }

  if (game.permissions.length > 0) {
    const items = game.permissions
      .map((p) => `  <li>${PERMISSION_COPY[p]}</li>`)
      .join("\n");
    sections.push(`<h2>Device permissions</h2>
<p>The app asks for the following permissions. iOS shows a prompt before any of them is
used, and declining does not prevent you from using the rest of the app.</p>
<ul>
${items}
</ul>`);
  }

  if (game.purchaseModel === "subscription") {
    sections.push(`<h2>Purchases</h2>
<p>Subscriptions are processed by <strong>Apple</strong> through the App Store using
StoreKit. We never receive your payment details. Apple's privacy policy applies:
<a href="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</a></p>`);
  } else if (game.purchaseModel === "onetime") {
    sections.push(`<h2>Purchases</h2>
<p>All purchases are one-time, non-consumable products processed by <strong>Apple</strong>
through the App Store using StoreKit. We never receive your payment details.
Apple's privacy policy applies:
<a href="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</a></p>`);
  }

  sections.push(`<h2>Children</h2>
<p>The app is not directed at children under 13 and does not knowingly collect
personal information from them.</p>`);

  const choices: string[] = [];
  if (game.hasAds || game.hasRewardedAds) {
    choices.push(`  <li>Change tracking permission any time in iOS <strong>Settings &rarr; Privacy &amp;
      Security &rarr; Tracking</strong>.</li>`);
    choices.push(`  <li>Reset the advertising identifier in iOS Settings.</li>`);
  }
  for (const p of game.permissions) {
    const { label, path } = PERMISSION_SETTINGS[p];
    choices.push(
      `  <li>Revoke ${label} access any time in iOS <strong>${path}</strong>.</li>`,
    );
  }
  if (game.purchaseModel === "subscription") {
    choices.push(`  <li>Manage or cancel the subscription in <strong>Settings &rarr; [your name] &rarr;
      Subscriptions</strong>.</li>`);
  }
  choices.push(`  <li>Delete the app to delete all locally stored game data.</li>`);

  sections.push(`<h2>Your choices</h2>
<ul>
${choices.join("\n")}
</ul>`);

  sections.push(`<h2>Contact</h2>
<p>Questions about this policy: <a href="mailto:${meta.contactEmail}">${meta.contactEmail}</a></p>`);

  return page(`Privacy Policy — ${game.title}`, STYLE_PRIVACY, sections.join("\n\n"));
}

/** ルートの索引。全ゲームのサポート/プライバシーページへのリンク一覧。 */
export function indexPage(meta: GamesFile): string {
  const rows = [...meta.games]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(
      (g) =>
        `  <li><a href="${g.slug}/">${esc(g.title)}</a> &mdash; <a href="${g.slug}/privacy.html">Privacy Policy</a></li>`,
    )
    .join("\n");

  const style = `${STYLE_SUPPORT}
  ul { padding-left: 1.2rem; }
  li { margin: 0.35rem 0; }
  .updated { color: #666; font-size: 0.9rem; }`;

  const body = `<h1>${meta.publisher} &mdash; Game Support &amp; Privacy</h1>
<p class="updated">Last updated: ${meta.lastUpdated}</p>

<p>Support and privacy pages for every game published by ${meta.publisher}. Pick a game
below, or email us at <a href="mailto:${meta.contactEmail}">${meta.contactEmail}</a>.</p>

<h2>Games (${meta.games.length})</h2>
<ul>
${rows}
</ul>`;

  return page(
    `${meta.publisher} — Game Support & Privacy`,
    style,
    body,
  );
}
