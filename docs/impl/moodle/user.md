# user モジュール

## 概要

いまログインしているユーザーの表示名を、ページ右上のユーザーメニューから読み取る。挨拶をはじめ、複数の機能が同じ情報を必要とするため `src/moodle/` に置く。

## 関連

- 資料: [`../../moodle/navbar.md`](../../moodle/navbar.md) — ユーザーメニューの構造と、表示名が入っている属性
- 参考: [`./page.md`](./page.md) — 複数の機能が共有する Moodle 操作の置き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/moodle/user.ts` | 表示名の読み取り |

## インターフェース

```ts
// src/moodle/user.ts
export function readUserName(): string | undefined;
```

## 処理の流れ

1. `#usernavigation [data-region="usermenu"] .avatar.current [title]` を探す
2. 見つかれば `title` 属性の値を返す
3. 見つからない場合、`#usernavigation [data-region="usermenu"] .avatar.current img[alt]` を探し、`alt` の値を返す
4. どちらも見つからない、または値が空の場合は `undefined` を返す

## 決めごと

- **`title` 属性から読み、要素のテキストを使わない。** イニシャル表示の場合、テキストには姓の1文字しか入らない（`<span class="userinitials">小</span>`）。`title` と `aria-label` には氏名が入る
- **`title` を先に見て、無ければ `img[alt]` を見る。** 採取できたのはイニシャル表示の場合だけで、アバター画像を設定した状態は未確認。画像の場合に `alt` へ氏名が入る作りが Moodle の通例のため、両方を辿る
- **`.avatar.current` で絞る。** ユーザーメニューには他の利用者のアバターが並ぶ場面（ロールの切り替えなど）があり、現在のユーザーを指すのは `current` が付いた方
- **未ログインの場合に `undefined` を返す。** ユーザーメニュー自体が出ないため、呼び出し側は名前が取れない場合の表示を用意する
- **結果をキャッシュしない。** 呼び出しのたびに DOM を読む。状態は DOM だけが持つという [`./page.md`](./page.md) と同じ方針にそろえる
- **ユーザーIDやメールアドレスは読まない。** 必要とする機能が無い。増やす場合はこのモジュールへ足す
