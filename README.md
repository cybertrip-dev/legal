# legal — 全ゲームのサポート / プライバシーページ

App Store Connect に登録する **サポート URL** と **プライバシーポリシー URL** を、
全ゲーム分まとめてホストするリポジトリ。GitHub Pages がそのまま配信する。

ゲームごとに repo を分けず 1 つに集約しているのは、文面の変更が必ず全ゲーム一斉に
発生するため（AdMob の仕様変更、GDPR / ATT 対応、会社表記の変更など）。
1 コミットで 100 ゲーム分が直る。

## URL

```
https://cybertrip-dev.github.io/legal/<repo名>/            サポート
https://cybertrip-dev.github.io/legal/<repo名>/privacy.html プライバシーポリシー
```

例: `https://cybertrip-dev.github.io/legal/neon-glide/privacy.html`

索引ページは https://cybertrip-dev.github.io/legal/ 。

## 使い方

```sh
make            # 生成 + 検査（通常はこれだけ）
make generate   # data/games.json から HTML を生成
make check      # games.json と生成済み HTML の検査
make preview    # ローカルで見た目を確認
```

`<repo名>/index.html` と `<repo名>/privacy.html` は **生成物**。直接編集しない。
編集するのは `data/games.json`（事実）と `src/templates.ts`（文面）の 2 つだけ。

## ゲームを追加する

1. `data/games.json` の `games` に 1 要素足す。フィールドの意味は `src/types.ts` を参照。
2. `make` を実行。
3. 差分をコミットして push。GitHub Pages が数十秒で反映する。
4. App Store Connect に上記 2 つの URL を登録。

`genre` と `mechanic` と `storedData` はテンプレートの穴に文法的に収まる形で書く:

```
Thanks for playing {title}, {genre}. {mechanic}
Your {storedData} are saved only on your device.
```

`make check` がこの整合性（"a" で始まるか、ピリオドで終わるか等）を検査する。

## 文面を変える

`src/templates.ts` を編集し、`data/games.json` の `lastUpdated` を更新して `make`。
全ゲームのページが一斉に書き換わる。

## 注意 — 収益化の事実は実装に追従させる

`hasAds` / `purchaseModel` / `permissions` は **各ゲームの実装を調べて記入した事実** で、
プライバシーポリシーの記載内容そのものになる。実装が変わったら（広告を入れた、
サブスクを買い切りに変えた、カメラを使い始めた）、`data/games.json` を直して
`make` を実行し直すこと。ズレたまま提出すると審査で落ちる。

`purchaseModel` の値と出力の対応:

| 値 | サポートページ | プライバシーポリシー |
| --- | --- | --- |
| `subscription` | Subscription 節（解約導線） | 自動更新サブスクとして記載 |
| `onetime` | Purchases 節（復元導線） | 非消耗型 IAP として記載 |
| `none` | 節ごと省略 | 節ごと省略 |

## 移行元

`neon-glide-legal` / `shape-shift-legal` / `rush-hour-relay-legal` の 3 リポジトリを
統合した。旧 URL は当面そのまま生かしてある。
