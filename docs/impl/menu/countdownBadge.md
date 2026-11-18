# カウントダウンバッジ

## 概要

指定した時刻までの残り時間を、ナビゲーションメニューに表示する。対象を複数並べられる。対象は2種類ある。日時を指定する対象と、時限の区切り（今の時限の終了か、次の時限の開始）を数える対象。残り時間の長さに応じて、表示の粒度が4段階で切り替わる。切り替わる境界は設定で決める。

## 関連

- 使う: [`clock.md`](./clock.md) — `startClockTicker` でタイマーを回す。`initMenuBadges` の定義とマウントの順もそちらにある
- 使う: [`../utils/periods.md`](../utils/periods.md) — `PeriodSlot` の型と `findPeriodSegment`
- 使う: [`../utils/graphemes.md`](../utils/graphemes.md) — ラベルを書記素で数えて切る
- 使う: [`../timetable/schedule.md`](../timetable/schedule.md) — 時間割に合わせる時の `lessonsOn`・`buildSchedule`・`hasLessons`
- 使う: [`../utils/settings.md`](../utils/settings.md) — 設定の取得。参照するのは entrypoint のみで、機能側は参照しない
- 参考: [`navbar.md`](./navbar.md) — 同じナビゲーションメニューを対象にするが、あちらは実DOMの属性操作、こちらは Shadow DOM への注入
- 資料: [`docs/moodle/navbar.md`](../../moodle/navbar.md) — マウント先のアンカー要素
- 参考: [`drawerClock.md`](./drawerClock.md) — 隠れた件の見張りと、ドロワーのブロック。`layout` と `watch` の使い道

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/menu/countdownBadge.logic.ts` | 残り時間の計算と書式化、時限の区切りの判定、設定から対象への変換 |
| `src/features/menu/countdownBadge.svelte` | 表示 |
| `src/features/menu/index.ts` | 設定を受け取り、時間割に合わせるかを決め、Shadow DOM へマウントする |
| `src/entrypoints/shared.content.ts` | 設定を読み、`initMenuBadges` へ渡す |

## インターフェース

```ts
// countdownBadge.logic.ts
export type CountdownState =
  | { kind: "counting"; label: string; target: Date }
  | { kind: "classesOver" };

export interface CountdownTarget {
  id: string;
  resolve: (now: Date) => CountdownState;
}

export type CountdownSource =
  | { kind: "nextPeriod" }
  | { kind: "fixedDate"; at: string };

export interface CountdownConfig {
  id: string;
  label: string;
  source: CountdownSource;
}

export const COUNTDOWN_ENDED_LABEL = "終了しました";
export const CLASSES_OVER_LABEL = "授業終了";

// 粒度を切り替える境界。どれも「以下」で、その値を含む
export interface CountdownThresholds {
  secondsWithinMinutes: number; // この分数以下で秒まで出す。既定 15、範囲 1〜60
  minutesWithinHours: number; // この時間数以下で分まで出す。既定 24、範囲 1〜72
  hoursWithinDays: number; // この日数以下で日と時間を出す。既定 7、範囲 1〜30
}

export const LABEL_CHARS_PER_LINE = 4;
export const LABEL_MAX_LINES = 2;

export function formatRemaining(
  remainingMs: number,
  thresholds: CountdownThresholds,
): string;
export function wrapLabel(
  label: string,
  perLine?: number,
  maxLines?: number,
): string[];
export function resolvePeriodCountdown(
  now: Date,
  sortedPeriods: readonly PeriodSlot[],
  schedule?: readonly LessonOccurrence[],
): CountdownState;
export function buildCountdownTargets(
  configs: CountdownConfig[],
  sortedPeriods: PeriodSlot[],
  schedule?: readonly LessonOccurrence[],
): CountdownTarget[];
```

`fixedDate` の `at` は `new Date()` が解釈できる日時の文字列。設定画面は `datetime-local` の値（`YYYY-MM-DDTHH:MM`、秒とタイムゾーンを持たない形）をそのまま入れる。`nextPeriod` の `label` は使わない。種類の名前は `nextPeriod` のまま残し、保存済みの設定を読めるようにする。

```ts
// countdownBadge.svelte の Props
interface Props {
  targets: CountdownTarget[];
  thresholds: CountdownThresholds;
  // menu は入りきらない件を切って隠す。drawer は渡された件をすべて出す。既定は menu
  layout?: "menu" | "drawer";
  // 各件（鍵は対象の id）を見張る attachment を返す
  watch?: (id: string) => Attachment;
}
```

`formatRemaining` は残りミリ秒と境界を受け取る純粋関数。既定値は [`../utils/settings.md`](../utils/settings.md) の `menuBadgesSetting` の `fallback` にだけ書く。`wrapLabel` はラベルを表示する行の配列にする純粋関数で、`perLine` と `maxLines` の既定は `LABEL_CHARS_PER_LINE` と `LABEL_MAX_LINES`。

## 処理の流れ

### 表示の更新

1. `countdownBadge.svelte` が `$effect` の中で `startClockTicker` を粒度 `"second"` で呼ぶ
2. tick のたびに `now` を更新し、各 target について `target.resolve(now)` を呼ぶ。時限の区切りは tick ごとに求め直す
3. `counting` なら、`wrapLabel(label)` の行と `formatRemaining(target − now, thresholds)` を出す。`classesOver` なら `授業終了` を1行だけ出す
4. `{#each}` のキーには `target.id` を使う

### 表示の配置

1 件を縦に積み、左揃えにする。上段がラベル、下段が残り時間。対象どうしは下で揃える。対象が無い時は要素を置かない。

カウントダウンは、`index.ts` が `#usernavigation` の前に置く `div.mimo-countdown-slot` の中へ入る。置き場所の幅と CSS は [`clock.md`](./clock.md) の「マウント」にある。置き場所が受け取るのはメニューの残りの幅だけで、入りきらない対象は次のように消える。

1. 外側の要素は `flex flex-wrap justify-end`、高さ `h-12` で、はみ出しを隠す（`overflow-hidden`）
2. 各対象も高さ `h-12` にし、はみ出しを隠す（`overflow-hidden`）。入りきらない対象は2行目へ折り返し、見えなくなる。右寄せの折り返しのため、後ろの対象から先に消える。各対象で隠さないと、中身が上へはみ出した分が1行目に見える
3. 先頭に幅0・高さ `h-12` の要素を置く。1行目は少なくとも1つの要素を持つため、この要素が無いと、入りきらない1件目が切れた姿で残る

時計の時限、日付、時刻の消え方は [`clock.md`](./clock.md) にある。

上の切り方は `layout` が `menu` の時だけ当てる。`drawer` では外側の要素を `flex flex-wrap items-end gap-x-3 gap-y-2` にし、高さで切らず、先頭の幅0の要素も置かない。各対象の `h-12`・`pl-3`・`overflow-hidden` も外す。`watch` を受け取った時は、各対象の要素へ `{@attach watch(target.id)}` を付ける。隠れた件をドロワーへ移す流れは [`drawerClock.md`](./drawerClock.md) にある。

ラベルは `wrapLabel` が返す行を1行ずつ置き、折り返しをブラウザに任せない。文字は時計の時限と同じ `text-xs leading-none text-muted-foreground` にする。`text-xs` は行の高さも 16px に決めるため、`leading-none` で詰めないと2行のラベルと残り時間が `h-12` を越える。全文は `title` 属性で読める。残り時間は折り返さない。`授業終了` は残り時間ではなく補助の文字として、ラベルと同じ `text-xs text-muted-foreground` で出す。

### resolvePeriodCountdown

1. `schedule` があれば、`lessonsOn(now, schedule)` でその日の授業を引き、授業のある時限（`periodIndex + 1`）だけに時限表を絞る
2. `findPeriodSegment(now, 時限表)` で区切りを求める
3. 区切りが無ければ `{ kind: "classesOver" }` を返す
4. 時限の最中なら、ラベルを `「三限 終了まで」`、数える先をその時限の終了にする
5. 時限の前（休み時間と、その日の最初の時限の前）なら、ラベルを `「四限 まで」`、数える先をその時限の開始にする

時限の名前は `periodName` の値。その日の時限がすべて終わった後は、翌日の時限へ回さない。

### wrapLabel

1. ラベルの前後の空白を除き、空白の位置で語に分ける
2. 各語を書記素で数え、`perLine` 文字ずつに区切って行にする（`chunkGraphemes`）
3. 行が `maxLines` を超える場合、先頭の `maxLines` 行を残し、最終行を `perLine − 1` 文字に詰めて末尾へ「…」を足す
4. 空のラベルでは空の配列を返す

| ラベル | 結果 |
|---|---|
| `三限 終了まで` | `["三限", "終了まで"]` |
| `前期試験まで` | `["前期試験", "まで"]` |
| `前期定期試験の初日まで` | `["前期定期", "試験の…"]` |

### 残り時間の書式

`formatRemaining` が4段階で整形する。境界はすべて「以下」で、その値自体を含む。表の境界は既定値の場合。

| 残り | 出力例 | 上位が0の場合 |
|---|---|---|
| 0以下 | `終了しました` | — |
| `secondsWithinMinutes` 分（15分）以下 | `12分34秒` | `34秒` |
| `minutesWithinHours` 時間（24時間）以下 | `3時間45分` | `45分` |
| `hoursWithinDays` 日（7日）以下 | `2日と5時間` | `2日` |
| それより長い | `10日` | — |

境界は上の行から順に判定する。境界の大小が逆に設定されていても、先に当たった行の粒度で出す。

### buildCountdownTargets

保存できる形の `CountdownConfig[]` を、実行時の `CountdownTarget[]` へ変換する。

1. 各 `CountdownConfig` の `source.kind` を見る
2. `"nextPeriod"` の場合、`resolve` を `(now) => resolvePeriodCountdown(now, sortedPeriods, schedule)` にする。保存されたラベルは使わない
3. `"fixedDate"` の場合、`new Date(source.at)` が読めない日時（空の値を含む）なら対象から外す。読めれば `resolve` を `() => ({ kind: "counting", label, target })` にする
4. `id` はそのまま引き継ぐ

### 時間割に合わせる

`initMenuBadges` が次の3つをすべて満たす時にだけ、`buildSchedule` で作った授業の並びを `buildCountdownTargets` へ渡す。

1. 時間割が有効（`timetable.enabled`）
2. 時間割の設定「カウントダウンを時間割に合わせる」（`syncCountdown`）が `false` でない。キーが無い保存済みの設定は合わせる側に倒す
3. 時間割に授業が1つ以上ある（`hasLessons`）

満たさない時は `schedule` を渡さず、時限表のすべての時限を数える。

### マウント

`index.ts` の `initMenuBadges` が、受け取った設定を `buildCountdownTargets` で変換してから `createShadowRootUi` で差し込む。差し込む順と右へ寄せるスタイルは [`clock.md`](./clock.md) にある。

| 設定 | 値 |
|---|---|
| `name` | `mimo-countdown-badge` |
| `position` | `inline` |
| `anchor` | `div.mimo-countdown-slot`（置き場所） |
| `append` | `last` |

## 決めごと

- **`resolve` を値ではなく関数として持ち、ラベルと数える先を一緒に返す。** 時限の対象は、時刻によって数える先とラベルが同時に変わる。固定の日時と同じ形で扱える
- **時限の対象は、最中なら終了まで、時限の前なら開始まで数える。** 授業中に知りたいのは終わるまで、休み時間に知りたいのは始まるまでのため
- **時限の対象のラベルは自動で作り、利用者に書かせない。** 区切りによって内容が変わるため、1つの固定のラベルでは合わない
- **その日の時限が終わったら「授業終了」と出し、翌日へ回さない。** 翌日の一限まで十数時間を数えても、知りたい情報にならない。消すと、設定を間違えたのか終わったのかを区別できない
- **時間割に合わせる時は、授業のある時限だけを数える。** 授業の無い空き時限の終わりを数えても、利用者の予定と合わない
- **時間割が空の時は合わせない。** 合わせる先が無く、すべての日が「授業終了」になる
- **日時の読めない対象は表示しない。** 設定画面で足しただけの行がポップアップを閉じて残っても、`NaN日` のような壊れた表示を出さない
- **保存する形（`CountdownConfig`）と実行時の形（`CountdownTarget`）を分ける。** `resolve` が関数のため、`CountdownTarget` をそのまま storage へ保存できない
- **変換は `initMenuBadges` の内部で行い、entrypoint には出さない。** entrypoint の担当を設定の取得と受け渡しだけに保つため
- **目標時刻を過ぎたら、非表示にせず「終了しました」と表示する。** 消えてしまうと、設定を間違えたのか終わったのかを区別できない
- **境界値はすべて「以下」の側へ含める。** 既定の境界で残りちょうど15分なら秒表示にする
- **境界は `MenuBadgesConfig` の `thresholds` に持ち、カウントダウンの対象ごとには持たない。** 粒度は読み方の好みで、対象ごとに変える場面が無い
- **境界の大小を検査しない。** 上から順に判定するため、逆に設定しても表示は崩れず、ある粒度が出なくなるだけになる
- **上位の単位が0の時は省く。** 「0分34秒」ではなく「34秒」と出す
- **表示が分単位や日単位でも、タイマーは1秒ごとに回す。** 粒度が切り替わる瞬間（残りが15分を切るなど）を取りこぼさないため
- **残り時間を主役にし、ラベルは `text-xs leading-none text-muted-foreground` で落とす。** ラベルは何のカウントダウンかを示す補助で、読みたいのは残り時間そのもののため
- **ラベルと残り時間を横に並べず、縦に積む。** 横に並べると、ラベルが長いほど際限なく幅を取る。縦に積むと、幅はラベルの上限（4文字）で止まる
- **ラベルは常に出し、1行4文字、2行までにする。** 残り時間（`3時間45分`）とおおむね同じ幅に収まり、狭い画面でもラベルを消さずに済む
- **空白の位置で先に改行する。** `三限 終了まで` を `三限` と `終了まで` に分けると、意味の切れ目で折れる。利用者も空白で折る位置を決められる
- **ラベルの折り返しを文字数で決め、CSS の幅と `line-clamp` に任せない。** 日本語のラベルは単語の切れ目が無く、幅で折ると行あたりの文字数がフォントで変わる。文字数で切ると、どの環境でも同じ位置で折れ、テストで確かめられる
- **文字数は書記素で数える。** 濁点の結合文字や絵文字の途中で切ると、文字が壊れて表示される
- **ラベルの文字を時計の日付と同じ形にする。** どちらも主役（時刻、残り時間）に添える補助の段で、同じ役割を同じ形で示す
- **対象どうしは下で揃える。** ラベルが 1 行の対象と 2 行の対象が並んでも、残り時間が同じ高さに並ぶ
- **ラベルと残り時間を左揃えにする。** 横書きの日本語は左から読むため、行頭が揃っている方が読みやすい
- **メニューに入りきらない時は、後ろの対象から順に消す。** 1 件目は利用者が最も上に置いた対象のため。時計より先に消すのは、時計が常に出る基準の位置のため
- **消す条件を画面の幅の区切りで決めず、メニューの残りの幅で決める。** 区切りで決めると、空きがあるのに消える幅が残る
- **残りの幅を JS で測らず、CSS の折り返しで決める。** 置き場所は `flex-basis: 0` で伸びるだけで、メニューから幅を奪わない。Moodle が上部メニューに収まる項目数を計算する時、バッジの有無で結果が変わらない。縮む側に回す（`flex-shrink` を大きくする）方法は使わない。Moodle のメニューも比例してわずかに縮み、項目が「さらに」へ送られる（実機で確認）
- **数字には `tabular-nums` を当てる。** 桁ごとに幅が変わると、1秒ごとに横幅が揺れる
- **ルート要素へ `font-sans` を明示する。** `createShadowRootUi` が `:host{all:initial}` でリセットするため、指定しないとブラウザ既定のフォントに落ちる
