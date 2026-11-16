# runFeature モジュール

## 概要

content script の entrypoint が機能を1つずつ初期化するための包み。1つの機能が例外を投げても、後に続く機能の初期化を止めない。失敗は機能の名前を添えてコンソールへ出す。

## 関連

- 参考: [`../README.md`](../README.md) — 「機能の初期化は runFeature で包む」の節。entrypoint 全体の形はそちらが決める
- 資料: [`../../verify.md`](../../verify.md) — 実機で失敗を見つける手順

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/runFeature.ts` | 初期化を実行し、失敗を記録する |
| `src/entrypoints/shared.content.ts` | 各機能の初期化を包んで呼ぶ |
| `src/entrypoints/early.content.ts` | 各機能の初期化を包んで呼ぶ |

## インターフェース

```ts
// src/utils/runFeature.ts
export function runFeature(
  name: string,
  init: () => void | Promise<void>,
): Promise<void>;
```

entrypoint からの呼び出し:

```ts
import { runFeature } from "@/utils/runFeature";

await runFeature("font", () => applyFont(uiFont));
await runFeature("greeting", () => initGreeting(ctx, greetingConfig));
```

## 処理の流れ

1. `init()` を呼び、戻り値を `await` する
2. 例外または reject を受けた場合、`console.error("[mi-mo] <name>", error)` を出す
3. どちらの場合も解決する。reject しない

## 決めごと

- **`name` は機能のファイル名（拡張子なし）に揃える。** コンソールの出力からファイルを探せるようにするため。1つの `init` が複数の部品をまとめて起こす場合は、その入口の名前を使う
- **失敗を握りつぶさず、必ずコンソールへ出す。** 黙って続けると、機能が効かない理由を後から辿れない
- **接頭辞は `[mi-mo]` に固定する。** Moodle 自身や他の拡張機能の出力と区別し、コンソールの絞り込みで拾えるようにする。background と設定画面のエラー出力も同じ接頭辞を使う
- **設定の読み出しは包まない。** 設定が読めない場合はどの機能も正しく動かないため、entrypoint ごと止める方が安全側になる
- **機能は順に `await` し、並列にしない。** 同じアンカーへ部品を足す機能があり、順序が表示の並びを決める。初期化はどれも軽く、並列にする利益が小さい
- **画面への通知は行わない。** 失敗するのは多くが Moodle 側の構造の変化で、利用者にできることが無い。開発者がコンソールで気付ければ足りる
