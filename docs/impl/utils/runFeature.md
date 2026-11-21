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

// early.content.ts は順に待つ
await runFeature("font", () => applyFont(uiFont));

// shared.content.ts は並べて始め、最後にまとめて待つ
features.push(runFeature("menu", () => initMenu(menuConfig)));
await Promise.all(features);
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
- **`shared.content.ts` は機能を並べて始め、最後に `Promise.all` でまとめて待つ。** 成績の取得（`gradeInline`）や Shadow DOM の CSS の読み込みを待つ機能があり、順に待つと後の機能の表示がその分遅れる。`runFeature` は reject しないため、1つの失敗で `Promise.all` が途中で抜けることはない
- **表示の並びが始める順に左右される機能だけを、1本の流れの中で順に待つ。** 挨拶と時間割は同じ入れ物の末尾へ足すため、挨拶を待ってから時間割を始める。メニューの項目名を控える処理は、名前を読む所が最初の `await` より前にあり、後に始める `initMenu` より先に終わる
- **`early.content.ts` は順に待つ。** どの機能も CSS を入れるだけで同期的に終わり、並べる利益が無い。最初の画面の判断（`landingPage`）は `body` を待つことがあるため最後に置く
- **画面への通知は行わない。** 失敗するのは多くが Moodle 側の構造の変化で、利用者にできることが無い。開発者がコンソールで気付ければ足りる
