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

[AGENTS.md](../../AGENTS.md) の配置ルールに従う作業メモは検査対象から外してある。

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
| `src/assets/` | グローバルCSSなどの静的アセット。拡張機能のアイコンの元の絵 `icon.svg` もここに置き、`@wxt-dev/auto-icons` がビルドのたびに各サイズの PNG を作る。ツールバーには余白を詰めた別の絵 `icon-toolbar.svg` を使い、[wxt.config.ts](../../wxt.config.ts) のフックが 16px と 32px の PNG を作る |
| `public/` | 拡張機能の直下へそのまま写すファイル（`greetings.txt`）。ここへ置いた物はすべて配られるため、配らない元の絵は置かない |

`<機能名>` は camelCase で書き、リポジトリ直下の [README.md](../../README.md) の機能一覧の見出しに対応させる（`coursePage`、`myCourses`）。`docs/impl/` のディレクトリも同じ名前で揃える。仕様書を置く [`../features/`](../features/) だけはハイフン区切り（`course-page/`）を使い、見出しとの対応より URL の読みやすさを優先する。

### ファイル名のサフィックス

| 形 | 用途 |
|---|---|
| `*.logic.ts` + `*.svelte` | ロジックとUIのペア。ロジックをコンポーネントから分離する |
| `*.dom.ts` | Moodle の特定DOM構造を操作するアダプター |
| `*.manager.ts` | 複数のアダプターへ操作をブロードキャストするマネージャー |
| `*.content.ts` | `src/entrypoints/` 直下に置く content script |
| `*.test.ts` | 単体テスト。対象のファイルの隣に置く |

### パスエイリアス

`$lib` が `src/lib`、`@` が `src` を指す。`vite.config.js` は置かない。WXT が読まないため、Vite の設定は `wxt.config.ts` の `vite` オプションに書く。

エイリアスを増やす場合は2箇所へ書く。テストから使う場合は `vitest.config.ts` にも書く。`tsconfig.json` の `paths` は svelte-check が見るもので、バンドル時の解決には効かない。`wxt.config.ts` の `vite.resolve.alias` が無いと、型チェックを通過したままビルドで `failed to resolve import` になる。`@` は WXT が既定で解決するため書く必要がない。

### import の書き方

自分で書いたモジュール（`src/features/`・`src/moodle/`・`src/utils/`）は import 文を明示的に書く。識別子がどこから来たかを読んで判断できるようにするため。

WXT と Svelte の API（`defineContentScript`・`createShadowRootUi`・`storage`・`onMount` など）は auto-import に任せる。既存のコードがそうなっており、対象の一覧は `.wxt/types/imports.d.ts` に生成される。WXT は既定で `src/utils/` などの export も auto-import へ載せるが、[`wxt.config.ts`](../../wxt.config.ts) の `config:resolved` で走査する場所を空にしている。自分のモジュールを import 無しで使うと、型検査で止まる。

## コードの書式

- `if`・`else` の本体は、文が1つでも必ず波括弧で囲み、複数行で書く。`else if` は連鎖した形で書く。
- 同じ目的を持つ一連の処理は連続して配置し、目的が切り替わる箇所に空行を1行置く。変数の宣言と直後の利用、値の検証とそのガードなど、密接に関連する処理の間は詰める。

## 単体テスト

[Vitest](https://vitest.dev/) を使う。`pnpm test` で全件を1回実行する。

- **対象は純粋な計算に限る。** `*.logic.ts` と `src/utils/` のうち、引数だけで結果が決まる関数を対象にする。Moodle の画面への差し込みや Shadow DOM の描画は対象にせず、[検証の手順](../verify.md) の実機確認で確かめる
- **テストは対象の隣に `<対象の名前>.test.ts` として置く。** `schedule.logic.ts` のテストは `schedule.logic.test.ts` になる
- **DOM を引数に取る関数は、ファイルの先頭に `// @vitest-environment happy-dom` を書く。** 既定の環境は Node で、`DOMParser` が無い。必要なファイルだけが DOM の環境を使う
- **WXT のテスト用プラグイン（`WxtVitest`）は使わない。** 起動時に空きポートを探すため、ポートを開けない環境でテストが起動しない。代わりに `vitest.config.ts` へ `@` のエイリアスだけを書く。このため、テストの対象は WXT の auto-import（`browser`・`storage` など）を読み込み時に使わないモジュールに限る
- **名前が `.logic.ts` でないモジュールも、引数だけで結果が決まれば対象にする。** `src/features/timetable/ics.ts` の `buildIcs` がその例になる
- **現在時刻を読む関数は、`vi.useFakeTimers()` と `vi.setSystemTime()` で時刻を固定する。** `buildIcs` の `DTSTAMP` のように、出力へ現在時刻が入るため
- **Moodle の HTML は、[Moodle 資料](../moodle/README.md) の採取例と同じクラス名で手書きする。** 実機から採った HTML をそのまま置かない。氏名や成績が入るため
- **`innerText` に依る処理はテストで確かめない。** happy-dom の `innerText` は `<br>` を改行にせず、ブラウザと結果が違う。HTML を文字列にする処理は [`utils/markdown.md`](./utils/markdown.md) を使い、`innerText` を避ける
- **日付は `new Date(年, 月, 日)` で作り、ローカル時刻で比べる。** 時間割の日付は実行環境のローカル年月日で扱っている。ISO 文字列で作ると、実行する場所のタイムゾーンで結果が変わる

## アーキテクチャ方針

### entrypoint は薄く保つ

UIロジックを entrypoint 本体に書かない。`src/features/<機能名>/` に実装し、entrypoint からは import して呼び出す。entrypoint が担当するのは設定の取得と初期化だけ。

### 機能の初期化は runFeature で包む

content script の entrypoint は、機能の初期化を1つずつ [`utils/runFeature.md`](./utils/runFeature.md) の `runFeature` で包んで呼ぶ。1つの機能が例外を投げても、後に続く機能を止めないため。`shared.content.ts` は機能を並べて始め、最後にまとめて待つ。待ち方と、順に待つ例外は runFeature の指示書が決める。

```ts
features.push(runFeature("menu", () => initMenu(menuConfig)));
```

各指示書の「インターフェース」に載る呼び出し例は、この包みを省いて書く。entrypoint へ足す時に包む。

### entrypoint は run_at で分ける

entrypoint を機能カテゴリで分けない。同じカテゴリの機能でも必要な実行タイミングが違うため、機能で切ると同じカテゴリ用の entrypoint が複数必要になり、名前が意味を失う。

| ファイル | run_at | 用途 |
|---|---|---|
| `src/entrypoints/shared.content.ts` | 既定（`document_idle`） | DOM が揃ってから動くもの |
| `src/entrypoints/early.content.ts` | `document_start` | 描画前に CSS を注入するものなど |

1つの entrypoint を複数の機能が共有する。そのため複数の指示書が同じ entrypoint を「対象ファイル」に挙げる。各指示書が担当するのは自分の機能を呼び出す行だけで、他の機能の行は触らない。

content script 以外の entrypoint も同じ場所に置く。

| ファイル | 用途 |
|---|---|
| `src/entrypoints/popup/` | ツールバーから開く設定画面 |
| `src/entrypoints/options/` | 拡張機能の管理から開く設定画面。中身はポップアップと同じ |
| `src/entrypoints/background.ts` | content script から呼べない API を実行する。[`utils/download.md`](./utils/download.md) の保存と、[`home/greeting.md`](./home/greeting.md) の既定の一言の選択 |

### WXT と Svelte の前提

公式資料を毎回読まずに済むよう、このコードが頼っている WXT（0.21）と Svelte 5 の振る舞いをここに置く。版を上げた時は、各項目の公式資料と照らし合わせる。

- **content script は、ページの JavaScript と別の世界（isolated world）で動く。** DOM は共有するが、Moodle の JavaScript の変数や関数は見えない。Moodle の JavaScript が後から描画する部分は、DOM の変化を待って読む。[WXT: Content Scripts](https://wxt.dev/guide/essentials/content-scripts.html)、[Chrome: isolated worlds](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#work_in_isolated_worlds)
- **entrypoint はビルド時にも読み込まれる。** DOM や `browser` に触る処理はファイルの先頭に書かず、`main` の中か、`main` から呼ぶ関数に置く。[WXT: Entrypoints](https://wxt.dev/guide/essentials/entrypoints.html)
- **`ctx` が片付けるのは、`ctx` を通して登録したものだけ。** 自前の `MutationObserver` やイベントの登録は、`ctx.onInvalidated` で解除する。拡張機能を更新した後の古い content script が動き続けないようにするため
- **`shared.content.ts` が import する `global.css` は、Shadow DOM の中だけに効く。** `cssInjectionMode: "ui"` で `createShadowRootUi` の中へ入るため。名前に反して Moodle のページ全体へは効かない。Moodle 側へ当てる CSS は [`utils/styleSheet.md`](./utils/styleSheet.md) の経路を使う。[WXT: Shadow Root](https://wxt.dev/guide/essentials/content-scripts#shadow-root)
- **manifest は WXT が生成し、`wxt.config.ts` の `manifestVersion: 3` で両方のブラウザを MV3 にそろえる。** WXT の既定では Firefox だけ MV2 になる。Firefox だけに要る項目（拡張機能の ID、対応する最低の版、データ収集の申告）は、`manifest` を関数にして Firefox の時だけ足す。permission の違いは生成物の `manifest.json` で見る。[WXT: Manifest](https://wxt.dev/guide/essentials/config/manifest.html)
- **`browser` は、実行環境の `browser` か `chrome` を選ぶだけで、足りない API を補わない。** 型があっても、そのブラウザで使えるとは限らない。Safari に `browser.downloads` が無いのがその例になる。[WXT: Extension APIs](https://wxt.dev/guide/essentials/extension-apis.html)
- **Svelte 5 の runes（`$state`・`$derived`・`$effect`・`$props`）で書く。** 1つのコンポーネントの中で `$props` と `export let` を混ぜない。[Svelte 5 移行ガイド](https://svelte.dev/docs/svelte/v5-migration-guide)
- **時刻の進みは、状態ではない。** `new Date()` を `$derived` の中で呼んでも、時間が経つだけでは再計算されない。時計のように進む表示は、タイマーで状態へ現在時刻を入れ直し、タイマーの解除関数を `$effect` から返す。[Svelte: $effect](https://svelte.dev/docs/svelte/$effect)

### 設定は entrypoint が取得し、機能へ引数で渡す

`src/features/` の実装は設定の出所を知らない。設定を引数で受け取り、保存場所も形式も参照しない。

entrypoint が [`utils/settings.md`](./utils/settings.md) 経由で設定を読み、機能へ引数として渡す。設定の内容によっては機能の呼び出し自体を省く。

設定の型は機能側が定義して export し、`src/utils/settings.ts` がそれを import する。逆向きにすると機能が設定モジュールへ依存する。

`early.content.ts` だけは、`storage.local` を待つ前に [`utils/pageCache.md`](./utils/pageCache.md) の写しで CSS を当て、正本を読んだ後に当て直す。待つ間に最初の描画が済み、隠す要素が一瞬見えるため。`early.content.ts` へ機能を足す時は、その設定を写しの型（`EarlySettings`）へ足し、呼び出しを `applyEarly` の中へ置く。各指示書の呼び出し例は `getValue` から直接渡す形で書いてあり、写しを通す形はここが決める。

1つの entrypoint が複数の設定を読む場合、`main()` の先頭の1つの `Promise.all` でまとめて待つ。全体のスイッチ（`extensionSetting`）と、機能の途中で読む保存値も同じ所で読む。指示書はモジュールごとに分かれているため、各指示書の呼び出し例をそのまま並べると直列になる。entrypoint 全体の形は個々の指示書では決まらず、ここで決める。

### Moodle の DOM 操作は Adapter パターンで抽象化する

Moodle は表示モードによってマークアップが異なる。PC表示のトップバー（`nav.navbar`）とモバイル表示のドロワー（`#theme_boost-drawers-primary`）が典型で、同じ「メニュー項目」でも構造が揃っていない。

この差を表示モードごとのアダプターの関数に閉じ込め、Manager が各アダプターへ同じ設定を渡す。呼び出し側はアダプターの存在を意識しない。

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
| `src/assets/global.css` | Tailwind 本体と shadcn のテーマ変数。shadcn の CLI が生成する。主色（`--primary`）は Moodle のリンク色に合わせて書き換えてある。文字の大きさ `text-row`（15px）と `text-note`（13px）もここに置く。Moodle へ差し込む部品（Shadow DOM の中）では、`:host` で `--text-xs` を `0.8em`、`--text-sm` を `0.9em` へ置き換え、周りの Moodle の文字に対する割合にする。em は親に掛かるため、`text-xs` と `text-sm` は入れ子にせず、文字を持つ要素へ直接付ける |
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

**entrypoint と `src/utils/settings.ts` は追記専用として扱う。** 多くのモジュールが同じファイルを対象ファイルに挙げる（`shared.content.ts` へ17本、`src/utils/settings.ts` へ15本、`early.content.ts` へ12本）。実装するときは自分が担当する行だけを足し、既にある他機能の行を消さない。ファイルごと書き直すと、先に実装した機能の呼び出しがまとめて失われる。

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
| [`menu/navbar.md`](./menu/navbar.md) | `src/features/menu/navbar/` | 使う: styleSheet ／ 資料: [`../moodle/navbar.md`](../moodle/navbar.md) |
| [`menu/clock.md`](./menu/clock.md) | `src/features/menu/clock.*` | 参考: navbar / countdownBadge |
| [`menu/countdownBadge.md`](./menu/countdownBadge.md) | `src/features/menu/countdownBadge.*` | 使う: clock の `startClockTicker` ／ utils/periods ／ utils/graphemes ／ timetable/schedule |
| [`menu/drawerClock.md`](./menu/drawerClock.md) | `src/features/menu/drawerClock.svelte`、`src/features/menu/visibility.svelte.ts` | 使う: menu/clock ／ menu/countdownBadge ／ ui/quickDrawer の `DrawerBlock` と `DRAWER_REGION_SELECTOR` ／ メニューで隠れた要素の見張り |
| [`menu/logo.md`](./menu/logo.md) | `src/features/menu/logo.ts` | 使う: styleSheet ／ 資料: [`../moodle/navbar.md`](../moodle/navbar.md) |
| [`home/hideElements.md`](./home/hideElements.md) | `src/features/home/hideElements.ts` | 資料: [`../moodle/home.md`](../moodle/home.md) |
| [`home/container.md`](./home/container.md) | `src/features/home/container.ts` | 使う: moodle/page ／ 挨拶と時間割の器 |
| [`home/loginComponent.md`](./home/loginComponent.md) | `src/features/home/loginComponent.ts` | 使う: home/container ／ moodle/user ／ 資料: [`../moodle/home.md`](../moodle/home.md) |
| [`home/greeting.md`](./home/greeting.md) | `src/features/home/greeting.*` | 使う: home/container ／ moodle/user |
| [`coursePage/reverseSections.md`](./coursePage/reverseSections.md) | `src/features/coursePage/reverseSections.ts` | 使う: styleSheet ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`coursePage/sectionTitleLink.md`](./coursePage/sectionTitleLink.md) | `src/features/coursePage/sectionTitleLink.ts` | 使う: styleSheet ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`coursePage/sectionToggleDesign.md`](./coursePage/sectionToggleDesign.md) | `src/features/coursePage/sectionToggleDesign.ts` | 使う: styleSheet ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`ui/floatingHint.md`](./ui/floatingHint.md) | `src/features/ui/floatingHint.ts` | 使う: styleSheet ／ 資料: [`../moodle/common.md`](../moodle/common.md) |
| [`ui/quickDrawer.md`](./ui/quickDrawer.md) | `src/features/ui/quickDrawer.ts`、`src/features/ui/DrawerBlock.svelte` | 使う: styleSheet ／ moodle/courseList ／ 資料: [`../moodle/drawer.md`](../moodle/drawer.md) |
| [`ui/breadcrumb.md`](./ui/breadcrumb.md) | `src/features/ui/breadcrumb.ts` | 使う: styleSheet ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`ui/landingPage.md`](./ui/landingPage.md) | `src/features/ui/landingPage.logic.ts` | 使う: utils/settings, moodle/user ／ ログイン直後の遷移 |
| [`ui/font.md`](./ui/font.md) | `src/features/ui/font.ts` | 使う: styleSheet ／ utils/settings |
| [`coursePage/autoattendButton.md`](./coursePage/autoattendButton.md) | `src/features/coursePage/autoattendButton.*` | 使う: moodle/page ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`coursePage/autoattendStats.md`](./coursePage/autoattendStats.md) | `src/features/coursePage/autoattendStats.*` | 使う: moodle/page ／ 資料: [`../moodle/course-page.md`](../moodle/course-page.md) |
| [`coursePage/indexToggle.md`](./coursePage/indexToggle.md) | `src/features/coursePage/indexToggle.*` | 使う: moodle/page ／ styleSheet ／ 資料: [`../moodle/drawer.md`](../moodle/drawer.md) |
| [`coursePage/gradeInline.md`](./coursePage/gradeInline.md) | `src/features/coursePage/gradeInline.*` | 使う: moodle/page ／ styleSheet ／ 資料: [`../moodle/grade.md`](../moodle/grade.md) |
| [`coursePage/exportMarkdown.md`](./coursePage/exportMarkdown.md) | `src/features/coursePage/exportMarkdown.*` | 使う: moodle/page ／ [moodle/courseSections](./moodle/courseSections.md) ／ utils/download ／ utils/markdown |
| [`coursePage/pageSave.md`](./coursePage/pageSave.md) | `src/features/coursePage/pageSave.*` | 使う: coursePage/bulkDownload ／ [moodle/courseSections](./moodle/courseSections.md) ／ utils/url ／ utils/download ／ utils/filename ／ utils/markdown ／ 資料: [`../moodle/mod-page.md`](../moodle/mod-page.md) ／ [`../moodle/mod-assign.md`](../moodle/mod-assign.md) |
| [`coursePage/bulkDownload.md`](./coursePage/bulkDownload.md) | `src/features/coursePage/bulkDownload.ts` | 使う: moodle/page ／ [moodle/courseSections](./moodle/courseSections.md) ／ utils/download ／ utils/url |
| [`coursePage/sectionActions.md`](./coursePage/sectionActions.md) | `src/features/coursePage/sectionActions.ts` | 使う: styleSheet ／ coursePage/sectionToggleDesign の見た目 ／ セクションヘッダー右端のボタンの置き場所 |
| [moodle/courseSections](./moodle/courseSections.md) | `src/moodle/courseSections.ts` | コースセクションとヘッダーの共有探索 ／ セクションのタイトル、活動名、活動のリンクの読み取り |
| [`myCourses/clickableCard.md`](./myCourses/clickableCard.md) | `src/features/myCourses/clickableCard.ts` | 使う: styleSheet ／ 資料: [`../moodle/my-courses.md`](../moodle/my-courses.md) |
| [`myCourses/incrementalSearch.md`](./myCourses/incrementalSearch.md) | `src/features/myCourses/incrementalSearch.ts` | 使う: moodle/page ／ styleSheet |
| [`myCourses/todayOrder.md`](./myCourses/todayOrder.md) | `src/features/myCourses/todayOrder.ts` | 使う: moodle/page ／ timetable/schedule ／ utils/url |
| [`timetable/schedule.md`](./timetable/schedule.md) | `src/features/timetable/schedule.logic.ts` | 使う: utils/periods ／ 実日程と回数の計算 |
| [`timetable/panel.md`](./timetable/panel.md) | `src/features/timetable/` | 使う: timetable/schedule ／ moodle/page |
| [`timetable/ics.md`](./timetable/ics.md) | `src/features/timetable/ics.ts` | 使う: timetable/schedule ／ utils/periods |
| [`settings/panel.md`](./settings/panel.md) | `src/features/settings/`（`SettingsPanel`、`FieldRow`、`fields.ts`、`backup.logic`、`BackupButtons`、`reset`、`ResetRows`） | 使う: utils/settings（全体のスイッチ `extensionSetting` を含む） ／ utils/theme ／ utils/download ／ settings/controls ／ settings の各 Fields |
| [`settings/controls.md`](./settings/controls.md) | `src/features/settings/controls/`（`StackedInputs`、`SuggestInput`、`TimePicker`、`DatePicker`、`ConfirmDialog`、`ActionRow`、`OpenRow`、`SectionCard`、`StatusText`、`time.logic`） | 使う: settings/panel の shadcn-svelte の部品 |
| [`settings/menuFields.md`](./settings/menuFields.md) | `src/features/settings/fields/` | 使う: settings/panel ／ settings/controls ／ moodle/menuItems ／ 資料: menu 系3本の型 |
| [`settings/timetableFields.md`](./settings/timetableFields.md) | `src/features/settings/fields/` | 使う: settings/panel ／ settings/controls ／ timetable/ics ／ utils/download |
| [`utils/settings.md`](./utils/settings.md) | `src/utils/settings.ts`、`src/utils/fillDefaults.ts` | 使う: 各機能が export する設定の型 |
| [`utils/periods.md`](./utils/periods.md) | `src/utils/periods.ts` | 使う: menu/clock ／ menu/countdownBadge ／ timetable |
| [`utils/graphemes.md`](./utils/graphemes.md) | `src/utils/graphemes.ts` | 使う: menu/clock ／ menu/countdownBadge |
| [`utils/styleSheet.md`](./utils/styleSheet.md) | `src/utils/styleSheet.ts` | 参考: [`home/hideElements.md`](./home/hideElements.md) |
| [`utils/pageCache.md`](./utils/pageCache.md) | `src/utils/pageCache.ts` | 使う: `early.content.ts` ／ 描画前に読む設定の写し |
| [`utils/theme.md`](./utils/theme.md) | `src/utils/theme.ts` | 資料: [`../../src/assets/global.css`](../../src/assets/global.css) |
| [`utils/filename.md`](./utils/filename.md) | `src/utils/filename.ts` | 参考: coursePage/exportMarkdown ／ coursePage/pageSave |
| [`utils/url.md`](./utils/url.md) | `src/utils/url.ts` | 使う: moodle/courseList ／ myCourses/todayOrder ／ coursePage の gradeInline・bulkDownload・pageSave |
| [`utils/markdown.md`](./utils/markdown.md) | `src/utils/markdown.ts` | 参考: coursePage/exportMarkdown ／ coursePage/pageSave |
| [`utils/download.md`](./utils/download.md) | `src/utils/download.ts` ／ `src/entrypoints/background.ts` | 使う: coursePage の書き出しと一括保存 ／ settings/panel のバックアップ |
| [`utils/runFeature.md`](./utils/runFeature.md) | `src/utils/runFeature.ts` | 使う: content script の entrypoint 2本 |
| [`utils/mountShadowUi.md`](./utils/mountShadowUi.md) | `src/utils/mountShadowUi.ts` | 使う: Shadow DOM で部品を足す各機能（menu のバッジ、home/greeting、timetable、ui/quickDrawer、coursePage の autoattend と indexToggle） |
| [`moodle/page.md`](./moodle/page.md) | `src/moodle/page.ts` | 資料: [`../moodle/`](../moodle/) の各ページ |
| [`moodle/courseList.md`](./moodle/courseList.md) | `src/moodle/courseList.ts` | 資料: [`../moodle/drawer.md`](../moodle/drawer.md) ／ 使う: utils/settings ／ utils/url |
| [`moodle/menuItems.md`](./moodle/menuItems.md) | `src/moodle/menuItems.ts` | 資料: [`../moodle/navbar.md`](../moodle/navbar.md) ／ 使う: utils/settings |
| [`moodle/user.md`](./moodle/user.md) | `src/moodle/user.ts` | 資料: [`../moodle/navbar.md`](../moodle/navbar.md) |

一覧はテーブルのまま保つ。ここを開く目的が「既にあるものを探す」ことなので、名前の探しやすさを優先する。依存関係が言葉で追えなくなった時点で、テーブルへ mermaid の関連図を併記する。
