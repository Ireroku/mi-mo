# page モジュール

## 概要

今表示しているページが Moodle のどの画面かを判定する。body のクラスを見て、サイトホーム・ダッシュボード・マイコース・コースページの4種を区別する。複数の機能が同じ判定を必要とするため `src/moodle/` に置く。

## 関連

- 資料: [`docs/moodle/home.md`](../../moodle/home.md) — サイトホームとダッシュボードの body クラス
- 資料: [`docs/moodle/my-courses.md`](../../moodle/my-courses.md) — マイコースの body クラス
- 資料: [`docs/moodle/course-page.md`](../../moodle/course-page.md) — コースページの body クラス

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/moodle/page.ts` | ページ種別の型、判定テーブル、判定関数 |

## インターフェース

```ts
// src/moodle/page.ts
export type MoodlePage =
  | "siteHome"
  | "dashboard"
  | "myCourses"
  | "coursePage"
  | "other";

export function getMoodlePage(): MoodlePage;

export function isSiteHome(): boolean;
export function isDashboard(): boolean;
export function isMyCourses(): boolean;
export function isCoursePage(): boolean;
```

## 処理の流れ

### 判定テーブル

ページ種別と、body に付く固有のクラスを次のように対応させる。

| 種別 | クラス | URL |
|---|---|---|
| `siteHome` | `pagelayout-frontpage` | `/` |
| `dashboard` | `pagelayout-mydashboard` | `/my/` |
| `myCourses` | `pagelayout-mycourses` | `/my/courses.php` |
| `coursePage` | `pagelayout-course` | `/course/view.php?id=<id>` |

### getMoodlePage

1. `document.body` が無ければ `"other"` を返す
2. `document.body.classList` を判定テーブルと照合する
3. 一致した種別を返す。どれにも一致しなければ `"other"` を返す

### isSiteHome / isDashboard / isMyCourses / isCoursePage

`getMoodlePage()` の結果を対応する種別と比較した真偽値を返す。判定の実体を持たない。

## 決めごと

- **原則として `is~` を使い、`getMoodlePage()` は複数のページで処理を分ける場合だけ使う。** 呼び出し側の大半は「このページか」を聞くだけで、`is~` の方が短く読める
- **判定の実体は `getMoodlePage()` だけが持ち、`is~` はその比較にとどめる。** 判定テーブルを2箇所に置かないため
- **判定に使うクラスは `pagelayout-*` に統一する。** `path-site` や `page-mycourses` も固有の値ですが、軸を1つに絞ると照合の順序を考えずに済む
- **`course-<id>` と `context-<num>` は使わない。** コースやユーザーごとに変わる
- **呼び出しごとに DOM を読み、結果をキャッシュしない。** 状態は DOM だけが持つ
- **`document_start` の時点では判定できない。** body がまだ無いため常に `"other"` を返す。CSS だけで完結する処理は、この関数を使わずセレクタの先頭に body クラスを書く（[`../home/hideElements.md`](../home/hideElements.md) がその形）
- **4種以外のページは区別しない。** 活動ページ（小テスト、課題など）を扱う機能が出た時点で種別を足す
