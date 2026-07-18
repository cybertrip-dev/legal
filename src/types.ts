/** 収益化モデル。サポートページの「Subscription / Purchases」節の出し分けに使う。 */
export type PurchaseModel = "subscription" | "onetime" | "none";

/** 端末機能の利用許可。プライバシーポリシーに開示義務がある項目のみ。 */
export type Permission =
  | "camera"
  | "microphone"
  | "motion"
  | "location"
  | "notifications"
  | "photos"
  | "contacts"
  | "health";

/**
 * 1ゲーム分のページ生成に必要な事実。data/games.json の各要素。
 *
 * 文面は英語（App Store 提出先が英語のため）。genre と mechanic は
 * テンプレートの穴に文法的に収まる形で書く:
 *
 *   Thanks for playing {title}, {genre}. {mechanic}
 *   Your {storedData} are saved only on your device.
 */
export interface Game {
  /** リポジトリ名 = 生成されるディレクトリ名 = URL のパス。 */
  slug: string;
  /** 表示名。各ゲームの capacitor.config.json の appName が正。 */
  title: string;
  /** "a"/"an" で始まる名詞句。末尾にピリオドを付けない。 */
  genre: string;
  /** プレイヤーが実際に何をするか。ピリオドで終わる1〜2文。 */
  mechanic: string;
  /** localStorage に保存される物の列挙。"and settings" で終える。 */
  storedData: string;
  /** ネットワーク無しで遊べるか。 */
  offlinePlayable: boolean;
  /** AdMob のバナー / インタースティシャルを出すか。 */
  hasAds: boolean;
  /** 任意視聴のリワード広告があるか。 */
  hasRewardedAds: boolean;
  purchaseModel: PurchaseModel;
  /**
   * 購入できる物を括弧に収まる形で列挙したもの。例: "Remove Ads, themes, and the bundle"。
   * "All purchases ({purchaseItems}) are one-time..." の穴に入る。
   * 列挙が不要なら空文字（括弧ごと省略される）。
   */
  purchaseItems: string;
  /** 実際に要求する端末機能。無ければ空配列。 */
  permissions: Permission[];
}

export interface GamesFile {
  /** 全ページ共通の「Last updated」。文面を変えたときだけ更新する。 */
  lastUpdated: string;
  publisher: string;
  contactEmail: string;
  games: Game[];
}
