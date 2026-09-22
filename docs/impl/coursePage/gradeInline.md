# gradeInline モジュール

## 概要

評定ページを取りに行き、各活動の得点をコースページの該当する活動の横へ差し込む。課題の内容と自分の点数を、ページを行き来せずに見比べられるようにする。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 差し込んだ要素の見た目
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../moodle/grade.md`](../../moodle/grade.md) — 評定表の構造と、行を活動へ結び付ける `cmid`
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 評定ページへのリンクと、活動の `li#module-<cmid>`

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/gradeInline.ts` | 設定の型、取得と差し込み |
| `src/features/coursePage/grade.logic.ts` | 評定表の HTML から値を抜き出す |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/grade.logic.ts
export interface GradeEntry {
  cmid: string;
  grade: string;
  range?: string;
  percentage?: string;
  feedback?: string;
}

export function parseGradeReport(html: string): GradeEntry[];
```

```ts
// src/features/coursePage/gradeInline.ts
export interface GradeInlineConfig {
  enabled: boolean;
}

export async function initGradeInline(
  config: GradeInlineConfig,
): Promise<void>;
```

設定の定義:

```ts
// src/utils/settings.ts
export const coursePageGradeInlineSetting =
  storage.defineItem<GradeInlineConfig>("local:coursePage.gradeInline", {
    fallback: { enabled: true },
  });
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initGradeInline } from "@/features/coursePage/gradeInline";
import { coursePageGradeInlineSetting } from "@/utils/settings";

const config = await coursePageGradeInlineSetting.getValue();
if (config.enabled) {
  await initGradeInline(config);
}
```

## 処理の流れ

### parseGradeReport

1. `DOMParser` で HTML を解く
2. `table.user-grade tr` をすべて取る
3. 各行の `th.column-itemname a[href*="/mod/"]` を探す。無い行は飛ばす
4. `href` のクエリの `id` を `cmid` として取る
5. 同じ行から次を読む。値が `-` の場合は省略した扱いにする

| 項目 | 読み取り元 |
|---|---|
| `grade` | `.column-grade` |
| `range` | `.column-range` |
| `percentage` | `.column-percentage` |
| `feedback` | `.column-feedback` |

6. `grade` と `feedback` がどちらも空の行は結果へ含めない

### initGradeInline

1. `isCoursePage()` が false なら何もせず戻る
2. `.secondary-navigation li[data-key="grades"] a` の `href` を取る。無ければ何もせず戻る
3. その URL を `fetch` する。`credentials` は `same-origin` を指定する
4. 応答が成功でなければ何もせず戻る
5. 本文を `parseGradeReport` へ渡す
6. 差し込み用の CSS を `applyStyleSheet` へ渡す。id は `mimo-course-page-grade-inline`
7. 各 `GradeEntry` について `#module-<cmid>` を探し、その `.activity-name-area` の末尾へ評定の要素を足す

### 差し込む内容

`grade` があれば `<grade> / <range の右側> (<percentage>)` の形で出す。`range` は `0–26` のように範囲で入っているため、右側だけを満点として使う。`feedback` があれば、その下に小さく添える。

`grade` が無く `feedback` だけある場合は、フィードバックのみを出す。

## 決めごと

- **評定ページを `fetch` して必要な部分だけ取り出す。** `iframe` で埋めるとナビゲーションやフッターごと入り、見た目が揃わない。取り出す形なら活動の横へ並べられる
- **行と活動を `cmid` で結び付ける。** `th.column-itemname` のリンクが `/mod/<種別>/view.php?id=<cmid>` を指し、コースページの `li#module-<cmid>` と一致する。活動名の文字列で突き合わせると、同名の活動や表記の揺れで外れる
- **リンクを持たない行を飛ばす。** カテゴリの見出し（`th.level1`）とコース合計（`th.baggt`）にはリンクが無い。手動で追加された評定項目にもリンクが無い可能性があるが、採取したコースには存在せず未確認
- **`grade` が `-` でも `feedback` があれば出す。** 採点前にコメントだけ付く場合がある。資料でも実例を確認している
- **どちらも無い行は差し込まない。** 空の欄が活動の横に並ぶと、かえって読みにくくなる
- **失敗しても黙って戻る。** 評定が無いコース、権限の無いコース、通信の失敗のいずれでも、コースページの表示自体は壊さない
- **毎回取りに行き、結果を控えない。** 点数は更新されるもので、古い値を出す方が害が大きい。`document_idle` の後の非同期処理のため、ページの表示自体は待たせない
- **素の DOM で差し込み、Shadow DOM を使わない。** 活動の数だけ要素を作ることになり、`createShadowRootUi` を回数分呼ぶと重い。見た目は注入した CSS で整える
- **合計点を出さない。** 仕様書が求めているのは課題と点数の見比べで、合計は評定ページ側にある
