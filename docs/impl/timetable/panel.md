# timetable panel モジュール

## 概要

時間割を週の表としてホームへ差し込む。サイトホームとダッシュボードのどちらでも表示し、差し込み先だけをページ種別で切り替える。各コマには科目名と、その週で何回目かを並べる。

## 関連

- 使う: [`./schedule.md`](./schedule.md) — 実日程と回数。表示する値はすべてここから受け取る
- 使う: [`../home/container.md`](../home/container.md) — ホームへ差し込む器。ページ種別ごとの差し込み先はあちらが持つ
- 使う: [`../utils/periods.md`](../utils/periods.md) — 時限の番号と時刻
- 使う: [`../utils/mountShadowUi.md`](../utils/mountShadowUi.md) — Svelte コンポーネントを Shadow DOM で差し込む共通処理

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/timetable/index.ts` | 設定を受け取り、器を取ってマウントする |
| `src/features/timetable/Timetable.svelte` | 週の表の描画 |
| `src/entrypoints/shared.content.ts` | 設定を読み、初期化を呼ぶ |

## インターフェース

```ts
// src/features/timetable/index.ts
export async function initTimetable(
  ctx: ContentScriptContext,
  config: TimetableConfig,
  periods: PeriodSlot[],
): Promise<void>;
```

```ts
// Timetable.svelte の Props
interface Props {
  config: TimetableConfig;
  periods: PeriodSlot[];
  schedule: LessonOccurrence[];
}
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initTimetable } from "@/features/timetable";
import { timetableSetting, periodTableSetting } from "@/utils/settings";

const [timetableConfig, periodTable] = await Promise.all([
  timetableSetting.getValue(),
  periodTableSetting.getValue(),
]);

if (loggedIn && timetableConfig.enabled) {
  await initTimetable(ctx, timetableConfig, periodTable.periods);
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const timetableSetting = defineSetting<TimetableConfig>(
  "local:home.timetable",
  { fallback: /* 空のグリッドと、その年度の開始日 */ },
);
```

## 処理の流れ

### initTimetable

1. `ensureHomeContainer()` を呼ぶ。`undefined` なら何もせず戻る
2. `buildSchedule(config, periods)` で実日程を組み立てる
3. [`mountShadowUi`](../utils/mountShadowUi.md) で `Timetable.svelte` をマウントする

| 設定 | 値 |
|---|---|
| `name` | `mimo-timetable` |
| `position` | `inline` |
| `anchor` | `ensureHomeContainer()` の戻り値 |
| `append` | `last` |

### Timetable.svelte

1. 今日を含む週（月曜から金曜）の5日を求める
2. 各日について `lessonsOn` を呼び、その日のコマを引く
3. 縦に時限、横に曜日を並べた表を描く。行は時限表の配列の順に並べ、見出しに `periodName` の名前と開始・終了時刻を出す。セルは曜日のコマのうち `period - 1` の位置のものを出す
4. 各セルに科目名と、`count` を「第N回」として小さく添える
5. `slot.url` があるセルはリンクにする
6. 今日の曜日の列に背景を敷いて強調する
7. 休講で何も無い日の列は、日付の下に「休講」と出す

### 配色

`config.color` の6色を、ルート要素の `data-mimo-color` 属性で切り替える。既定は `moodle`。色ごとの規則は CSS のカスタムプロパティ（地・文字・外枠・罫線・今日の列）の値だけを決め、当て方は全色で共通の規則1組にまとめる。`moodle` のリンク色だけは別の規則で足す。どの色も1組だけを持ち、OS の配色にかかわらず同じ見た目で出す。授業名は色ごとのトークンを持たず、ルート要素の文字色を引き継ぐ。

| 値 | 見た目 |
|---|---|
| `moodle` | Moodle のカードと同じ色（背景 `#ffffff`、文字 `#1d2125`、罫線 `#dee2e6`、今日の列 `#e7f0f9`、リンク `#0f6cbf`） |
| `white` | 白地 |
| `black` | 黒地 |
| `sky` | 水色 |
| `pink` | ピンク |
| `green` | 緑 |

## 決めごと

- **サイトホームとダッシュボードの両方に出す。** 仕様書の対象が「ホーム」で、Moodle ではこの2つが別ページにあたる。どちらを開いても同じものが見えるようにする
- **差し込み先を自分で探さず、[`../home/container.md`](../home/container.md) の器へ入れる。** 挨拶も同じ場所へ出るため、それぞれが Moodle の DOM へ割り込むと並び順が定まらない。表示側はどのページに出ているかを知らないままで済む
- **`createShadowRootUi` を使い、Moodle の CSS から隔離する。** Moodle 側の表のスタイルが当たると、行の高さや罫線が崩れる
- **表示するのは今週だけにする。** 前後の週へ送る操作は仕様書に無い。学期全体は `.ics` へ書き出して他のアプリで見る形にする
- **回数は表示している週の回数を出す。** 「次に何回目か」ではなく、そのセルが指す授業が何回目かを出す
- **空きコマは空欄にする。** 「なし」などの文字を置くと、埋まっているコマと見分けにくくなる
- **色はカレンダー全体にかけ、コマごとには持たせない。** 仕様書の設定項目が「色」1つのため
- **既定の色を `moodle` にする。** 何も選んでいない状態で、周りの Moodle のカードと地続きに見える
- **OS の配色に合わせて色を変えない。** Moodle 自体は暗い配色を持たず、周りは OS がダークでも白いままになる。OS に合わせて暗くすると、選んだ色と違う見た目になる。暗くしたい場合は `black` を選ぶ
- **授業名に shadcn のトークン（`text-foreground`）を使わない。** トークンはどの配色の地とも合わせて作っていないため、`black` の地では文字が沈む。ルート要素が色ごとに決める文字色を引き継がせる
- **`enabled` が false の時は entrypoint 側で呼ばない。** 設定が切れているときに実日程の計算まで走らせない
- **未ログインの間は entrypoint 側で呼ばない。** 未ログインのホームはログインのための画面で、個人の時間割を出す場面ではない。`loggedIn` は entrypoint が `isLoggedIn()` で1度だけ求めた値を使う
- **マイコースの並び順（[`../../features/my-courses/today-order.md`](../../features/my-courses/today-order.md)）はこのモジュールに含めない。** 同じ設定を読む別の機能として分ける
