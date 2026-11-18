# todayOrder モジュール

## 概要

マイコースの一覧を、今日の授業の順に並べ替える。並び順は時間割の設定から組み立て、今日のコマに当たるコースを上から時限の順に置く。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — マイコースかどうかの判定
- 使う: [`../timetable/schedule.md`](../timetable/schedule.md) — 今日のコマと、コマに結び付いた URL
- 使う: [`../utils/settings.md`](../utils/settings.md) — 時間割の設定と、この機能の設定
- 資料: [`../../moodle/my-courses.md`](../../moodle/my-courses.md) — コース1件を表す属性と、一覧が描き直される場面
- 参考: [`./incrementalSearch.md`](./incrementalSearch.md) — 同じ一覧を対象にし、描き直しを監視する機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/myCourses/todayOrder.ts` | 設定の型、並べ替え |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/myCourses/todayOrder.ts
export interface TodayOrderConfig {
  enabled: boolean;
}

export function initTodayOrder(
  ctx: ContentScriptContext,
  config: TodayOrderConfig,
  timetable: TimetableConfig,
  periods: PeriodSlot[],
): void;
```

設定の定義:

```ts
// src/utils/settings.ts
export const myCoursesTodayOrderSetting = defineSetting<TodayOrderConfig>(
  "local:myCourses.todayOrder",
  { fallback: { enabled: false } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initTodayOrder } from "@/features/myCourses/todayOrder";
import {
  myCoursesTodayOrderSetting,
  timetableSetting,
  periodTableSetting,
} from "@/utils/settings";

const [config, timetable, periodTable] = await Promise.all([
  myCoursesTodayOrderSetting.getValue(),
  timetableSetting.getValue(),
  periodTableSetting.getValue(),
]);

if (config.enabled) {
  initTodayOrder(ctx, config, timetable, periodTable.periods);
}
```

## 処理の流れ

### initTodayOrder

1. `isMyCourses()` が false なら何もせず戻る
2. 今日のコマを時限の順に集める。`buildSchedule` の結果から今日の分を取り、`slot.url` を持つものだけを残す
3. 各コマの `slot.url` からコースIDを読む。`/course/view.php?id=<id>` のクエリを使う
4. コースIDの並びを、今日の授業順として持つ
5. 一覧を並べ替える
6. `.block-myoverview` へ `MutationObserver` を `{ childList: true, subtree: true }` で張り、変化があれば並べ替え直す。`ctx.onInvalidated` で `disconnect` する

### 並べ替え

1. `.block-myoverview [data-region="course-content"]` をすべて取る
2. 各要素の `data-course-id` を読む
3. 今日の授業順に含まれるものを、その順で前へ出す
4. 含まれないものは、元の並びを保ったまま後ろへ続ける
5. 現在のコース順と希望する順が一致すれば、そのまま戻る
6. 順が違う場合だけ、それぞれの要素を親の末尾へ順に付け替える

## 決めごと

- **DOM の順序を変え、CSS の `order` を使わない。** 並べ替えは要素ごとに違う値を与える操作で、CSS だけでは表せない。付け替えなら表示形式（リスト・カード・概要）を問わず効く
- **コースの特定に `data-course-id` を使う。** 3つの表示形式すべてに付く属性で、表示の切り替えに耐える
- **時間割のコマからコースIDを読む。** 時間割は「コマのリンク先」として URL を持っており、そこから拾える。コース名の文字列で突き合わせると、時間割に書いた名前と Moodle のコース名が違う場合に外れる
- **今日のコマに無いコースは元の並びのまま後ろへ置く。** 並べ替えるのは今日の分だけで、それ以外の順序に手を入れない
- **リンク先が設定されていないコマを飛ばす。** 時間割にコマがあっても、リンク先が空ならどのコースか分からない
- **監視を `.block-myoverview` へ張り、コース要素自身には張らない。** 検索・表示形式の切り替え・並べ替えでは、[`../../moodle/my-courses.md`](../../moodle/my-courses.md) が記録している通りブロックの中身がまるごと描き直される。コース要素はそのたびに別のノードへ入れ替わるため、そこを監視すると1度の再描画で外れたノードを見続けることになり、以降の並べ替えが効かなくなる。中身が入れ替わっても残る祖先を選ぶ
- **`MutationObserver` は `childList` と `subtree` を監視する。** 一覧の再描画を拾うために使い、属性だけの変更では並べ替えを実行しない
- **現在と同じコース順なら DOM を変更しない。** 要素の付け替え自体も `childList` の非同期通知を発生させる。変更後の通知では順序比較で戻ることで、監視による再処理を収束させる。同期処理中だけのフラグでは通知時点を覆えない
- **既定では無効にする。** 時間割を設定していない状態では並べ替える材料が無く、有効でも何も起きない。時間割を作った人が入れる形にする
- **休講日は考慮する。** `buildSchedule` が休講を飛ばした実日程を返すため、休みの日は今日のコマが0件になり、並べ替えも起きない
- **`document_idle` で初期化する。** 一覧が描かれた後でなければ並べ替えられない
