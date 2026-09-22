# 実装指示書について

このディレクトリに実装指示書を置く。規約とテンプレートもここにまとめる。

## 指示書の役割

実装指示書は、実装前は「これから作るものの指示」、実装後は「そのモジュールの設計ドキュメント」として、同じファイルが生き続ける。使い捨てにしない。

そのため文体は宣言形（現在形）で統一する。「〜を作る」ではなく「〜を行う」と書く。実装前の人は「こう作ればいい」と読み、実装後の人は「こうなっている」と読む。一字も書き換えずに役割が切り替わる。

### 文体の規約

docs 配下のすべてに適用する。

- 宣言形（現在形）で書く。命令形・未来形を使わない
- 「だ・である」調を使わない。動詞終止形と体言止めを基本に、硬くなる箇所は「ですます」で緩める
- 日本語で書く。コード識別子・型名・ファイルパスは英語のまま
- コードのコメントに【】や☆、絵文字を使わない

### 検査

文体の規約とリンク切れは機械的に検査する。人の目は自分の書いたものに甘いため、指示書を書き終えたら必ず実行する。

```sh
python3 scripts/checkdocs.py            # docs/ 全体
python3 scripts/checkdocs.py docs/impl  # 一部だけ
```

`docs/superpowers/` は作業ログのため対象から外してある。

## 実装者の責務

実装者の責務は、指示書の内容をプログラム言語で実現すること。設計することではない。

- 実装者は指示書を変更しない
- 指示書に矛盾・実現不可能な点・情報不足を見つけた場合は、実装を中断して設計者に報告する
- 自己判断で設計を補わない

設計と実装の境界は「外から参照されるか」で引く。

| 対象 | 担当 |
|---|---|
| ファイルパス、クラス名、型名、公開メソッド名 | 設計 |
| ローカル変数、プライベートメソッド、外部から import されない内部ファイル | 実装者 |

外から見えない分割は設計判断ではなく実装判断なので、内部ファイルの追加は実装者の裁量に任せる。

## 命名規約

### ディレクトリ

| パス | 用途 |
|---|---|
| `src/entrypoints/` | WXT のファイルベースルーティング対象。ファイル名から manifest が自動生成される |
| `src/features/<機能名>/` | 機能の実装本体。UIロジックはすべてここに置く |
| `src/moodle/` | Moodle からのデータ取得・操作のうち、複数の機能が共有するもの。ページ種別の判定、ユーザー名の取得など |
| `src/utils/` | Moodle に依存しない汎用処理。日付の整形、数値の変換など |
| `src/lib/` | shadcn-svelte が自動生成するコンポーネント・フック用。手動でファイルを作らない |
| `src/assets/` | グローバルCSSなどの静的アセット |

`<機能名>` は camelCase で書き、リポジトリ直下の [README.md](../../README.md) の機能一覧の見出しに対応させる（`coursePage`、`myCourses`）。`docs/impl/` のディレクトリも同じ名前で揃える。仕様書を置く [`../features/`](../features/) だけはハイフン区切り（`course-page/`）を使い、見出しとの対応より URL の読みやすさを優先する。

### ファイル名のサフィックス

| 形 | 用途 |
|---|---|
| `*.logic.ts` + `*.svelte` | ロジックとUIのペア。ロジックをコンポーネントから分離する |
| `*.dom.ts` | Moodle の特定DOM構造を操作するアダプター |
| `*.manager.ts` | 複数のアダプターへ操作をブロードキャストするマネージャー |
| `*.content.ts` | `src/entrypoints/` 直下に置く content script |

### パスエイリアス

`$lib` が `src/lib`、`@` が `src` を指す。`vite.config.js` は存在せず、Vite の設定は `wxt.config.ts` の `vite` オプションに書く。

エイリアスを増やす場合は2箇所へ書く。`tsconfig.json` の `paths` は svelte-check が見るもので、バンドル時の解決には効かない。`wxt.config.ts` の `vite.resolve.alias` が無いと、型チェックを通過したままビルドで `failed to resolve import` になる。`@` は WXT が既定で解決するため書く必要がない。

### import の書き方

自分で書いたモジュール（`src/features/`・`src/moodle/`・`src/utils/`）は import 文を明示的に書く。識別子がどこから来たかを読んで判断できるようにするため。

WXT と Svelte の API（`defineContentScript`・`createShadowRootUi`・`storage`・`onMount` など）は auto-import に任せる。既存のコードがそうなっており、対象の一覧は `.wxt/types/imports.d.ts` に生成される。

## アーキテクチャ方針

### entrypoint は薄く保つ

UIロジックを entrypoint 本体に書かない。`src/features/<機能名>/` に実装し、entrypoint からは import して呼び出す。entrypoint が担当するのは設定の取得と初期化だけ。

### entrypoint は run_at で分ける

entrypoint を機能カテゴリで分けない。同じカテゴリの機能でも必要な実行タイミングが違うため、機能で切ると同じカテゴリ用の entrypoint が複数必要になり、名前が意味を失う。

| ファイル | run_at | 用途 |
|---|---|---|
| `src/entrypoints/shared.content.ts` | 既定（`document_idle`） | DOM が揃ってから動くもの |
| `src/entrypoints/early.content.ts` | `document_start` | 描画前に CSS を注入するものなど |

1つの entrypoint を複数の機能が共有する。そのため複数の指示書が同じ entrypoint を「対象ファイル」に挙げる。各指示書が担当するのは自分の機能を呼び出す行だけで、他の機能の行は触らない。

### 設定は entrypoint が取得し、機能へ引数で渡す

`src/features/` の実装は設定の出所を知らない。設定を引数で受け取り、保存場所も形式も参照しない。

entrypoint が [`utils/settings.md`](./utils/settings.md) 経由で設定を読み、機能へ引数として渡す。設定の内容によっては機能の呼び出し自体を省く。

設定の型は機能側が定義して export し、`src/utils/settings.ts` がそれを import する。逆向きにすると機能が設定モジュールへ依存する。

1つの entrypoint が複数の設定を読む場合、`Promise.all` でまとめて待つ。指示書はモジュールごとに分かれているため、各指示書の呼び出し例をそのまま並べると直列になる。entrypoint 全体の形は個々の指示書では決まらず、ここで決める。

### Moodle の DOM 操作は Adapter パターンで抽象化する

Moodle は表示モードによってマークアップが異なる。PC表示のトップバー（`nav.navbar`）とモバイル表示のドロワー（`#theme_boost-drawers-primary`）が典型で、同じ「メニュー項目」でも構造が揃っていない。

この差を `MenuAdapter` のようなインターフェースの下に隠し、Manager が各アダプターへ同じ操作をブロードキャストする。呼び出し側はアダプターの存在を意識しない。

新しく Moodle の DOM を操作する機能を追加する場合も、「宣言的な設定オブジェクトを受け取る Manager」と「DOM構造ごとの Adapter」に分ける。

参考実装は `src/features/menu/navbar/`。

### 複数の機能が共有する Moodle 操作は src/moodle/ に置く

ページ種別の判定、ユーザー名の取得など、複数の機能が同じ情報を Moodle から取る処理は `src/moodle/` に置く。

単一の機能だけが使う DOM 操作は `src/features/<機能名>/*.dom.ts` に置く。境界は「外から参照されるか」で引く。設計と実装の境界と同じ軸を使う。

Moodle に依存しない汎用処理（日付の整形、数値の変換など）は `src/utils/` に置く。

### DOM 構造の採取結果は docs/moodle/ に残す

Moodle 実画面から採取したセレクタと構造は [`../moodle/`](../moodle/) に置く。複数の機能が同じ DOM を触るため、特定の機能ディレクトリの持ち物にしない。

### スタイリング

Tailwind CSS v4 と shadcn-svelte を使う。**UIは自作せず、shadcn のコンポーネントを入れて組み合わせる。**

| 場所 | 中身 |
|---|---|
| `wxt.config.ts` | `@tailwindcss/vite` を Vite プラグインとして登録する |
| `src/assets/global.css` | Tailwind 本体と shadcn のテーマ変数。shadcn の CLI が生成する |
| `src/lib/components/ui/` | shadcn のコンポーネント。CLI が生成するので手で書かない |
| `components.json` | shadcn の設定。style=nova, baseColor=taupe, iconLibrary=lucide |

content script で Tailwind を使うには、entrypoint から `@/assets/global.css` を import する。

**Shadow DOM 内でも shadcn のテーマが効く。** `createShadowRootUi` が注入前に CSS の `:root` を `:host` へ置換し、`@property` を document 側へ分離するため。Shadow Root には `:host{all:initial}` のリセットも入る。

**フォントを `global.css` へ import しない。** `@fontsource-variable/*` は woff2 を base64 で CSS へ埋め込むため、content script の CSS が 5.85 kB から 888 kB へ膨らむ。Moodle のページには既定のフォントがあり、フォントの差し替えは [`../features/ui/font.md`](../features/ui/font.md) の機能として別に設計する。

## 実装指示書テンプレート

````markdown
# <モジュール名>

## 概要

何をするモジュールか。2〜3行。

## 関連

- 参考: [`<リンク先>`](<相対パス>) — 開く理由
- 使う: [`<リンク先>`](<相対パス>) — 開く理由
- 資料: [`<リンク先>`](<相対パス>) — 開く理由

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/.../xxx.ts` | 役割を1行で |

## インターフェース

```ts
// 型・クラス・公開メソッドのシグネチャを実コードで確定させる
```

## 処理の流れ

1. 手順を日本語の箇条書きで
2. ...

## 決めごと

- 判断が割れる点と、採った選択。理由を1行添える
````

### 各セクションの注意

**関連** を上から2番目に置くのは、末尾のリンク集が読まれないため。実装者が手を動かし始める前に必ず目に入る位置に置く。ラベルは次の3種のみ使う。

| ラベル | 意味 |
|---|---|
| `参考:` | 書き方を真似る対象。依存はしない |
| `使う:` | import して依存する対象 |
| `資料:` | コードではない情報源（DOM構造など） |

説明には開く理由だけ書く。リンク先の中身は説明しない。開かずに判断できる状態にするのが目的。

**対象ファイル** には、manifest へ影響する設定ファイル（`wxt.config.ts` など）も含める。permission の宣言はコードに現れないため、指示書に書かないと漏れる。漏れても型チェックは通り、実行時に初めて失敗する。生成物の `.output/<target>/manifest.json` を見れば確認できる。

**対象ファイル** に新規・変更の区別は書かない。1回目の実装では正しくても2回目の修正で嘘になるため。実装者は「無ければ作る、あれば直す」で判断する。ここに列挙されていないファイルは触らない。これがスコープ境界になる。

**インターフェース** は実コードで書く。他のモジュールがここに依存するため曖昧だと整合が取れず、また型は自然言語より短くて正確なため。実装コード本体は書かない。

entrypoint だけは例外として、呼び出し部分を実コードで書く。設定をどう取得して機能へどう渡すかが設計判断にあたるため。

**決めごと** は、読んだ人が迷う箇所を潰すために書く。「IDを数値にするか文字列にするか」のような、どちらでも動くが決めておかないと食い違う判断を記載する。

### 書き足してよいもの

テンプレートは最小構成として扱う。次のものは必要に応じて足す。ただしセクションを新設せず、既存セクションの中に入れる。

- **概要に mermaid の構成図** — ファイル間の呼び出し関係が言葉だけでは追いにくい場合
- **インターフェースの後に使用例** — 型だけでは使い方を想像しにくい場合
- **処理の流れを小見出しで分割** — クラスや関数ごとに手順が分かれる場合

**対象ファイルには呼び出し元も含める。** そのモジュールを初期化する側（`index.ts` など）は、設定の受け渡しが変わると一緒に直すことになるため、モジュールの一部として扱う。「関連」に書かない。

## 機能仕様書テンプレート

機能仕様書は [`../features/`](../features/) に置く。

````markdown
# <機能名>

## 何ができるか

ユーザーから見た振る舞い。

## なぜ必要か

解決したい不便。動機。

## 対象

どのページ・どの表示モード（PC / モバイルドロワー）で効くか。

## 設定項目

ユーザーが変えられるもの。無ければ「なし」。

## 実装

- [`<指示書へのリンク>`](<相対パス>)
````

「なぜ必要か」を必ず書く。実装方法が変わっても機能の存在意義は揺らがないため、動機だけは残す価値がある。

対応する指示書がまだ無い場合は「実装」セクションごと省く。「未着手」などと書かない。実装状況の記載はリポジトリ直下の README.md だけが持つ。

## モジュール一覧と関連

新しくモジュールを作る場合、まずここで既存のものを確認する。再発明を避けるため。

| 指示書 | 対象 | 主な関連 |
|---|---|---|
| [`menu/navbar.md`](./menu/navbar.md) | `src/features/menu/navbar/` | 資料: [`../moodle/navbar.md`](../moodle/navbar.md) |
| [`menu/clock.md`](./menu/clock.md) | `src/features/menu/clock.*` | 参考: navbar / countdownBadge |
| [`menu/countdownBadge.md`](./menu/countdownBadge.md) | `src/features/menu/countdownBadge.*` | 使う: clock の `startClockTicker` |
| [`home/hideElements.md`](./home/hideElements.md) | `src/features/home/hideElements.ts` | 資料: [`../moodle/home.md`](../moodle/home.md) |
| [`coursePage/reverseSections.md`](./coursePage/reverseSections.md) | `src/features/coursePage/reverseSections.ts` | 使う: styleSheet ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`coursePage/sectionTitleLink.md`](./coursePage/sectionTitleLink.md) | `src/features/coursePage/sectionTitleLink.ts` | 使う: styleSheet ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`myCourses/clickableCard.md`](./myCourses/clickableCard.md) | `src/features/myCourses/clickableCard.ts` | 使う: styleSheet ／ 資料: [`../moodle/my-courses.md`](../moodle/my-courses.md) |
| [`timetable/schedule.md`](./timetable/schedule.md) | `src/features/timetable/schedule.logic.ts` | 使う: utils/periods ／ 実日程と回数の計算 |
| [`timetable/panel.md`](./timetable/panel.md) | `src/features/timetable/` | 使う: timetable/schedule ／ moodle/page |
| [`timetable/ics.md`](./timetable/ics.md) | `src/features/timetable/ics.ts` | 使う: timetable/schedule ／ utils/periods |
| [`settings/panel.md`](./settings/panel.md) | `src/features/settings/` | 使う: utils/settings ／ utils/theme ／ settings の各 Fields |
| [`settings/menuFields.md`](./settings/menuFields.md) | `src/features/settings/fields/` | 使う: settings/panel ／ 資料: menu 系3本の型 |
| [`settings/timetableFields.md`](./settings/timetableFields.md) | `src/features/settings/fields/` | 使う: settings/panel ／ timetable/ics |
| [`utils/settings.md`](./utils/settings.md) | `src/utils/settings.ts` | 使う: 各機能が export する設定の型 |
| [`utils/periods.md`](./utils/periods.md) | `src/utils/periods.ts` | 使う: menu/clock ／ menu/countdownBadge ／ timetable |
| [`utils/styleSheet.md`](./utils/styleSheet.md) | `src/utils/styleSheet.ts` | 参考: [`home/hideElements.md`](./home/hideElements.md) |
| [`utils/theme.md`](./utils/theme.md) | `src/utils/theme.ts` | 資料: [`../../src/assets/global.css`](../../src/assets/global.css) |
| [`moodle/page.md`](./moodle/page.md) | `src/moodle/page.ts` | 資料: [`../moodle/`](../moodle/) の各ページ |

一覧はテーブルのまま保つ。ここを開く目的が「既にあるものを探す」ことなので、名前の探しやすさを優先する。依存関係が言葉で追えなくなった時点で、テーブルへ mermaid の関連図を併記する。
