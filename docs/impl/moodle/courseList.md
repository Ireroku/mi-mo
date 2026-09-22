# courseList モジュール

## 概要

Moodle のページに出ている履修コースの一覧を読み取る。設定画面がコースを選ぶ候補として使うため、読み取った結果は entrypoint がストレージへ控える。

## 関連

- 資料: [`../../moodle/drawer.md`](../../moodle/drawer.md) — コース一覧の出どころと、コースIDが `href` にしか無い事情
- 使う: [`../utils/settings.md`](../utils/settings.md) — 控えを置くストレージ項目
- 参考: [`./page.md`](./page.md) — 複数の機能が共有する Moodle 操作の置き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/moodle/courseList.ts` | コース一覧の読み取り |
| `src/utils/settings.ts` | 控えのストレージ項目 |
| `src/entrypoints/shared.content.ts` | 読み取って控えを更新する |

## インターフェース

```ts
// src/moodle/courseList.ts
export interface CourseRef {
  id: string;
  title: string;
  url: string;
}

export function readCourseList(): CourseRef[];
```

控えの定義:

```ts
// src/utils/settings.ts
import type { CourseRef } from "@/moodle/courseList";

export interface CourseListCache {
  courses: CourseRef[];
  updatedAt: string; // ISO の日時
}

export const courseListCacheSetting = storage.defineItem<CourseListCache>(
  "local:moodle.courseList",
  { fallback: { courses: [], updatedAt: "" } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { readCourseList } from "@/moodle/courseList";
import { courseListCacheSetting } from "@/utils/settings";

const courses = readCourseList();
if (courses.length > 0) {
  await courseListCacheSetting.setValue({
    courses,
    updatedAt: new Date().toISOString(),
  });
}
```

## 処理の流れ

### readCourseList

1. `#theme_boost-drawers-blocks section[data-block="course_list"] ul.unlist li a[href]` をすべて取る
2. 各要素の `href` を `URL` で解き、クエリの `id` を取る。取れない場合はその要素を飛ばす
3. `title` は要素の `textContent` の前後の空白を除いたもの
4. `url` は `href` をそのまま使う
5. 同じ `id` が複数あれば最初の1つだけを残す

## 決めごと

- **コースIDを `href` のクエリから読む。** 一覧の `li` にも `a` にも、コースを指す専用の属性が無い。`title` 属性はコースの短縮名で、IDとして使えない
- **表示名は `textContent` から取り、`title` 属性を使わない。** `title` は短縮名で、画面に出ている名前と違う
- **読めなかった場合に控えを上書きしない。** ドロワーの無いページや、ブロックが出ていない場面では空の配列が返る。それで控えを潰すと、設定画面から候補が消える
- **控えは設定画面に出さない。** ユーザーが編集するものではなく、コースを選ぶための候補として使うだけ。`settingsGroups` には入れない
- **ドロワーが閉じていても読める。** 閉じた状態でも中身は DOM にあり、`show` クラスの有無で見た目が変わるだけ
- **`src/moodle/` に置く。** ピン留め（[`../ui/quickDrawer.md`](../ui/quickDrawer.md)）、時間割のリンク先（[`../timetable/panel.md`](../timetable/panel.md)）、マイコースの並び替えが同じ一覧を必要とする
- **更新の時刻を控えに持つ。** 設定画面が「いつ時点の一覧か」を出せるようにする。古い控えしか無い場合でも、ユーザーが Moodle を開き直せば更新される
