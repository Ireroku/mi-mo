# landingPage モジュール

## 概要

ログイン直後に開くページを、設定した URL へ差し替える。ログインページを通ったことを控えておき、次に既定の遷移先（ダッシュボードかサイトホーム）へ着いた時だけ移動する。

## 関連

- 使う: [`../utils/settings.md`](../utils/settings.md) — 設定と、ログインを通った印を置くストレージ項目
- 資料: [`../../features/ui/landing-page.md`](../../features/ui/landing-page.md) — 1クリックを削る動機
- 参考: [`../home/greeting.md`](../home/greeting.md) — 判断を純粋な計算に切り出し、保存を entrypoint が行う形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/ui/landingPage.ts` | 設定の型と、移動するかどうかの判断 |
| `src/utils/settings.ts` | 設定と印のストレージ項目 |
| `src/entrypoints/early.content.ts` | 判断を実行し、印の保存と移動を行う |

## インターフェース

```ts
// src/features/ui/landingPage.ts
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
  location: Location,
): LandingDecision;
```

設定と印の定義:

```ts
// src/utils/settings.ts
export const uiLandingPageSetting = storage.defineItem<LandingPageConfig>(
  "local:ui.landingPage",
  { fallback: { enabled: false, url: "" } },
);

export const uiLandingPendingFlag = storage.defineItem<boolean>(
  "local:ui.landingPending",
  { fallback: false },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
import { decideLanding } from "@/features/ui/landingPage";
import { uiLandingPageSetting, uiLandingPendingFlag } from "@/utils/settings";

const [config, pending] = await Promise.all([
  uiLandingPageSetting.getValue(),
  uiLandingPendingFlag.getValue(),
]);

const decision = decideLanding(config, pending, window.location);

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
2. `isLoginPage(location.pathname)`（[`../moodle/user.md`](../moodle/user.md)）が真の場合、`{ pending: true }` を返す
3. `pending` が false の場合、`{ pending: false }` を返す
4. `location.pathname` が `/my/` でも `/` でもない場合、`{ pending: true }` を返す（印を保ったまま何もしない）
5. `config.url` を `URL` として解き、ホストが現在のページと違う場合、`{ pending: false }` を返す
6. 解いた URL が現在の場所と同じ場合、`{ pending: false }` を返す
7. それ以外は `{ pending: false, redirectTo: 解いた URL }` を返す

## 決めごと

- **ログインページを通った印を控え、次の遷移先で使う。** ログイン後のリダイレクトを挟むと `document.referrer` が失われる場合がある。印を置く方が確実に「ログイン直後の1回」を捕まえられる
- **移動するのは既定の遷移先（`/my/` と `/`）へ着いた時だけにする。** ログイン後にコースページなどへ直接飛ぶ場合、そこはユーザーが開こうとした場所で、横取りしない
- **移動先を Moodle と同じホストに限る。** 設定に外部の URL が入っていても従わない。拡張機能がログインのたびに外部サイトへ飛ばす挙動は、設定した本人にとっても予期しないものになる
- **印は1度使ったら消す。** 消さないと、以降ダッシュボードを開くたびに移動してしまい、ダッシュボード自体を見られなくなる
- **`enabled` が false の時も印を消す。** 機能を切った後に古い印が残っていると、次に入れ直した時に一度だけ意図しない移動が起きる
- **移動先が現在の場所と同じ場合は移動しない。** 設定が `/my/` のままだと、同じページへの移動を繰り返す
- **`location.replace` を使い、`href` への代入を避ける。** 履歴に既定の遷移先が残ると、戻る操作で元の場所へ戻れなくなる
- **判断を純粋な計算にし、保存と移動を entrypoint が行う。** ログイン直後という状態は再現しにくく、条件の組み合わせも多い。引数だけで結果が決まる形にしておく
- **既定は無効にする。** 移動先が空のまま有効にしても何も起きず、設定した覚えのない移動が起きる方の害が大きい
- **`document_start` で判断する。** 既定の遷移先が描かれる前に移動できれば、目に入る時間が短くなる
