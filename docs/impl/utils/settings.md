# settings モジュール

## 概要

拡張機能の設定を保存・読み出しする。機能ごとに独立したストレージキーを持ち、既定値を添えて項目を定義する。参照するのは entrypoint だけで、`src/features/` の実装はこのモジュールを import しない。

## 関連

- 資料: [WXT Storage](https://wxt.dev/storage.html) — `defineItem` の API、キーに付けるストレージ領域の接頭辞
- 使う: [`../home/hideElements.md`](../home/hideElements.md) — 設定の型 `HideElementsConfig` を import する。型を持つのは機能側

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/settings.ts` | 機能ごとのストレージ項目を定義して export する |
| `wxt.config.ts` | `storage` permission を manifest へ宣言する |

## インターフェース

```ts
// src/utils/settings.ts
import { storage } from "wxt/utils/storage";
import type { HideElementsConfig } from "@/features/home/hideElements";
import type { MenuBadgesConfig } from "@/features/menu";
import type { MenuConfig } from "@/features/menu/navbar/types";
import type { PeriodTableConfig } from "@/utils/periods";

export const homeHideElementsSetting = storage.defineItem<HideElementsConfig>(
  "local:home.hideElements",
  {
    fallback: { announcements: true, categories: true, search: true },
  },
);

export const menuSetting = storage.defineItem<MenuConfig>(
  "local:menu.items",
  { fallback: /* 下の決めごとを参照 */ },
);

export const menuBadgesSetting = storage.defineItem<MenuBadgesConfig>(
  "local:menu.badges",
  { fallback: /* 下の決めごとを参照 */ },
);

export const periodTableSetting = storage.defineItem<PeriodTableConfig>(
  "local:periods.table",
  {
    fallback: /* 下の決めごとを参照 */,
    // 版 2 で、番号を変えない値にし、配列の順を表示の順にした（../utils/periods.md）
    version: 2,
    migrations: { 2: (old) => ({ ...old, periods: migratePeriodsFromV1(old.periods ?? []) }) },
  },
);
```

読み出す側:

```ts
const config = await homeHideElementsSetting.getValue();
```

`fallback` を与えているため `getValue()` は `null` を返さず、呼び出し側に未設定時の分岐が要らない。

## 処理の流れ

このモジュールは定義だけを持ち、実行される処理はない。設定項目を1つ増やす手順は次の通り。

1. 機能側で設定の型を定義して export する
2. `settings.ts` でその型を import する
3. `storage.defineItem<型>("local:<機能>.<設定名>", { fallback: 既定値 })` を export する
4. entrypoint から `await <項目名>.getValue()` で読み、機能へ引数として渡す

## 決めごと

- **`wxt.config.ts` の `manifest.permissions` に `"storage"` を宣言する。** WXT は storage API の使用を自動で検出しないため、宣言が無いと `browser.storage` へアクセスできず `getValue()` が失敗する。生成物の `.output/<target>/manifest.json` を見れば宣言されたか確認できる
- **`storage.defineItem(` の引数は、キーとオプションを別の行に書く。** `defineItem<T>("キー", {` のように1行目を `{` で終えると、WXT の auto-import の走査が `fallback` のキー（`scope` など）を export と取り違える。同じ名前の変数を使う別のモジュールへ、存在しない import が差し込まれ、ビルドが `MISSING_EXPORT` で止まる
- **設定の型は機能側が持ち、`settings.ts` が import する。** 逆向きにすると `src/features/` が設定モジュールへ依存し、機能が設定の出所を知らないという方針が崩れる
- **キーは機能ごとに分け、`local:<機能>.<設定名>` の形にする。** 全設定を1つのキーにまとめると、`document_start` で動く entrypoint が使わない設定まで読み込む
- **ストレージ領域は `local:` を使う。** `sync:` は1項目 8KB・全体 100KB の制限があり、時間割のような大きい設定が収まらない
- **既定値は `fallback` で与える。** 未設定時に `null` が返らなくなり、呼び出し側の分岐が消える
- **`fallback` を変えても、値を保存済みの利用者には効かない。** `fallback` は未保存の時だけ使われる。保存済みの値まで変える場合は、`version` と `migrations` で移す
- **`getValue()` が非同期であることを前提に組む。** 値はストレージから読むため、同期にはできない
- **変数名は `<機能><設定名>Setting` の形にする。** import した先で何の設定か分かるようにするため
- **「インターフェース」に並ぶ項目は例示で、全項目の一覧ではない。** どの項目を定義するかは各機能の指示書が自分の分を持つ。ここへ全部を集めると、機能が増えるたびに2箇所を直すことになる
- **時限表は `menuBadgesSetting` の中に入れず、独立した項目にする。** 時計・カウントダウン・時間割の3つが同じ表を使う。バッジの設定の一部にすると、時間割がバッジの設定を読むことになる。キーを `local:periods.table` としたのも、特定の機能に属さないことを示すため
- **値を書き換えるのは設定画面（[`../settings/panel.md`](../settings/panel.md)）だけにする。** 機能の実行中に得た記録（挨拶の直前の一言、コース一覧のキャッシュなど）は設定と分け、設定画面に出さない項目として同じファイルに定義する
- **保存する値は JSON にできる形に限る。** 関数や `Date` を持たせない。カウントダウンの対象のように計算を伴うものは、種類を表す文字列と数値で持ち、機能側が解釈する
