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
- **設定の型は機能側が持ち、`settings.ts` が import する。** 逆向きにすると `src/features/` が設定モジュールへ依存し、機能が設定の出所を知らないという方針が崩れる
- **キーは機能ごとに分け、`local:<機能>.<設定名>` の形にする。** 全設定を1つのキーにまとめると、`document_start` で動く entrypoint が使わない設定まで読み込む
- **ストレージ領域は `local:` を使う。** `sync:` は1項目 8KB・全体 100KB の制限があり、時間割のような大きい設定が収まらない
- **既定値は `fallback` で与える。** 未設定時に `null` が返らなくなり、呼び出し側の分岐が消える
- **`getValue()` が非同期であることを前提に組む。** 現状は既定値を返すだけなので同期にもできるが、設定画面が保存を始めた時点でシグネチャを変えることになる
- **変数名は `<機能><設定名>Setting` の形にする。** import した先で何の設定か分かるようにするため
- **`menuSetting` と `menuBadgesSetting` の既定値は、`src/features/menu/index.ts` にハードコードされている `menuConfig`・`clockConfig`・`periodTable`・`countdownTargets` の値をそのまま移す。** 移行前後で表示が変わらないようにするため。`countdownTargets` だけは関数を持つため、[`../menu/countdownBadge.md`](../menu/countdownBadge.md) の `CountdownConfig` の形へ書き換える
- **設定画面（[`../../features/ui/settings.md`](../../features/ui/settings.md)）はまだ無い。** 現状このモジュールが返すのは常に `fallback` の値
