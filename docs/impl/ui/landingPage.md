# landingPage モジュール

## 概要

ログイン直後に開くページを、設定した URL へ差し替える。ログインしていないページを通ったことを控えておき、ログイン後の最初のページが既定の遷移先（ダッシュボード、マイコース、サイトホーム）だった時だけ移動する。

## 関連

- 使う: [`../utils/settings.md`](../utils/settings.md) — 設定と、ログインを通った印を置くストレージ項目
- 使う: [`../moodle/user.md`](../moodle/user.md) — `readLoggedIn` でログイン中かどうかを読む
- 資料: [`../../features/ui/landing-page.md`](../../features/ui/landing-page.md) — 1クリックを削る動機
- 参考: [`../home/greeting.md`](../home/greeting.md) — 判断を純粋な計算に切り出し、保存を entrypoint が行う形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/ui/landingPage.logic.ts` | 設定の型と、移動するかどうかの判断 |
| `src/features/ui/landingPage.logic.test.ts` | 判断の単体テスト |
| `src/utils/settings.ts` | 設定と印のストレージ項目 |
| `src/entrypoints/early.content.ts` | 判断を実行し、印の保存と移動を行う |

## インターフェース

```ts
// src/features/ui/landingPage.logic.ts
export interface LandingPageConfig {
  enabled: boolean;
  url: string;
}

export interface LandingDecision {
  pending: boolean;
  redirectTo?: string;
}

export function decideLanding(
  config: LandingPageConfig,
  pending: boolean,
  loggedIn: boolean,
  location: Pick<Location, "href" | "host" | "origin" | "pathname">,
): LandingDecision;
```

設定と印の定義:

```ts
// src/utils/settings.ts
export const uiLandingPageSetting = defineSetting<LandingPageConfig>(
  "local:ui.landingPage",
  { fallback: { enabled: true, url: "https://lms-m41.mie-u.ac.jp/my/courses.php" } },
);

export const uiLandingPendingFlag = defineSetting<boolean>(
  "local:ui.landingPending",
  { fallback: false },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
import { decideLanding } from "@/features/ui/landingPage.logic";
import { readLoggedIn } from "@/moodle/user";
import { uiLandingPageSetting, uiLandingPendingFlag } from "@/utils/settings";

const [config, pending] = await Promise.all([
  uiLandingPageSetting.getValue(),
  uiLandingPendingFlag.getValue(),
]);

// 切ってある間は body を待たない
const loggedIn = config.enabled ? await readLoggedIn() : true;
const decision = decideLanding(config, pending, loggedIn, window.location);

if (decision.pending !== pending) {
  await uiLandingPendingFlag.setValue(decision.pending);
}
if (decision.redirectTo) {
  window.location.replace(decision.redirectTo);
}
```

## 処理の流れ

### decideLanding

1. `config.enabled` が false の場合、`{ pending: false }` を返す
2. `loggedIn` が false の場合、`{ pending: true }` を返す
3. ここから先はログイン中。`pending` が false か、`location.pathname` が既定の遷移先（`/my/`・`/my/index.php`・`/my/courses.php`・`/`・`/index.php`）でないか、`config.url` が空の場合、`{ pending: false }` を返す（印を使い切り、移動しない）
4. `config.url` を `location.origin` を基準に `URL` として解く。解けない場合、ホストが現在のページと違う場合、現在の場所と同じ場合は `{ pending: false }` を返す
5. それ以外は `{ pending: false, redirectTo: 解いた URL }` を返す

## 決めごと

- **ログインしていないページを通った印を控え、ログイン後の最初のページで使う。** ログイン後のリダイレクトを挟むと `document.referrer` が失われる場合がある。印を置く方が確実に「ログイン直後の1回」を捕まえられる
- **印はログインページではなく、ログインしていないページ全体で付ける。** サイトホームの右ドロワーにもログインフォームがあり（[`../../moodle/home.md`](../../moodle/home.md)）、送信先の `/login/index.php` は POST を受けてすぐリダイレクトする。content script はリダイレクトの応答では動かないため、ログインページだけを見ると印を付け損なう。ログイン状態は `body` の `notloggedin` で見分ける
- **移動するのは既定の遷移先へ着いた時だけにする。** ログイン後にコースページなどへ直接飛ぶ場合、そこはユーザーが開こうとした場所で、横取りしない。Moodle の設定で既定の遷移先がマイコースになる場合があるため、`/my/courses.php` も含める
- **ログイン後の最初のページで、移動の有無にかかわらず印を消す。** 既定の遷移先でないページで印を残すと、後でダッシュボードを開いた時に、ログインと関係なく移動してしまう
- **移動先を Moodle と同じホストに限る。** 設定に外部の URL が入っていても従わない。拡張機能がログインのたびに外部サイトへ飛ばす挙動は、設定した本人にとっても予期しないものになる
- **印は1度使ったら消す。** 消さないと、以降ダッシュボードを開くたびに移動してしまい、ダッシュボード自体を見られなくなる
- **`enabled` が false の時も印を消す。** 機能を切った後に古い印が残っていると、次に入れ直した時に一度だけ意図しない移動が起きる
- **移動先が現在の場所と同じ場合は移動しない。** 設定が `/my/` のままだと、同じページへの移動を繰り返す
- **`location.replace` を使い、`href` への代入を避ける。** 履歴に既定の遷移先が残ると、戻る操作で元の場所へ戻れなくなる
- **判断を純粋な計算にし、保存と移動を entrypoint が行う。** ログイン直後という状態は再現しにくく、条件の組み合わせも多い。引数だけで結果が決まる形にしておく
- **既定で有効にし、移動先をマイコースにする。** ログイン後に上部メニューからマイコースを開く操作を、ほぼ全員が繰り返している（[`../../features/ui/landing-page.md`](../../features/ui/landing-page.md)）。マイコースは誰にでもあるページで、移動しても困る人が少ない
- **`document_start` で判断し、`body` の開始タグが届くまでだけ待つ。** 既定の遷移先が描かれる前に移動できれば、目に入る時間が短くなる。ログイン状態を読むには `body` が要るが、本文の読み込みまでは待たない。機能を切っている間は待たない
- **CSS を当てるだけの機能を、この判断より前に呼ぶ。** `body` を待つ間に、見た目を変える CSS の注入を遅らせない
