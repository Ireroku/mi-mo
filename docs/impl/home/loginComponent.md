# loginComponent モジュール

## 概要

未ログインでサイトホームを開いた時に、右のドロワーへ入っているログインフォームを本文の見える位置へ移す。Moodle が出しているフォームをそのまま動かすだけで、フォーム自体は作らない。

## 関連

- 使う: [`./container.md`](./container.md) — ホームへ差し込む器
- 使う: [`../moodle/user.md`](../moodle/user.md) — ログイン状態の判定
- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 移したフォームの見た目
- 資料: [`../../moodle/home.md`](../../moodle/home.md) — 「ログインコンポーネント」節。フォームの位置と構造、`logintoken` の扱い

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/home/loginComponent.ts` | フォームの移動と見た目 |
| `src/entrypoints/shared.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/home/loginComponent.ts
export function initLoginComponent(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initLoginComponent } from "@/features/home/loginComponent";

initLoginComponent();
```

## 処理の流れ

1. `isLoggedIn()` が true なら何もせず戻る
2. `isSiteHome()` が false なら何もせず戻る
3. `#theme_boost-drawers-blocks section.block_login` を探す。無ければ何もせず戻る
4. `ensureHomeContainer()` を呼ぶ。`undefined` なら何もせず戻る
5. 見つけた `section` を器の先頭へ移す
6. 見た目を整える CSS を `applyStyleSheet` へ渡す。id は `mimo-home-login-component`

### 注入する CSS

```css
body.notloggedin #mimo-home-top .block_login {
  max-width: 28rem;
  margin: 0 auto 1.5rem;
}
```

## 決めごと

- **フォームを作り直さず、Moodle が出しているものを移す。** `form#login` は `logintoken` という CSRF 対策の値を持ち、ページを開くたびに変わる。自前で組み立てると、この値の取得と更新を自分で引き受けることになる。移すだけなら Moodle の認証の流れをそのまま通る
- **複製せず移動する。** 同じ `id`（`form#login`、`input#login_username`）を持つ要素が2つ並ぶと、ラベルとの結び付きが壊れる
- **器の先頭へ入れる。** 未ログインの画面で最初に必要なのはログインで、挨拶や時間割より上に置く。[`./container.md`](./container.md) は呼び出し順に積む形のため、このモジュールは entrypoint の先頭で呼ぶ
- **サイトホームだけを対象にする。** ダッシュボード（`/my/`）は未ログインだとログインページへリダイレクトされ、そこには本文に直接フォームが出る。どちらもこの機能を必要としない
- **ドロワー側に空の枠を残さない。** 移動なので、元の位置からは要素ごと消える
- **[`../ui/quickDrawer.md`](../ui/quickDrawer.md) の非表示設定と競合しない。** あちらはドロワーを CSS で隠すが、こちらは要素を本文へ移すため、隠れたドロワーの中に取り残されることがない
- **`document_idle` で動かす。** ドロワーの中身が描かれた後でなければ移せない
- **設定を持たない。** 仕様書（[`../../features/home/login-component.md`](../../features/home/login-component.md)）に設定項目が無い
- **入力欄へ値を入れる処理を持たない。** 利用者が自分で打ち込む。拡張機能が認証情報を扱わない
