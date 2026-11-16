# Moodle DOM リファレンス

Moodle 実画面から採取した DOM 構造とセレクタを置く。実装指示書がここを `資料:` として参照する。

## なぜ採取するか

実装指示書にセレクタを書くには、実際の DOM を見る必要がある。推測で書いたセレクタを載せた指示書は「読めばそのまま実装できる」水準に届かない。

## 採取の手順

`claude-in-chrome` を使う。

1. ToolSearch で必要なツールを1回でまとめて読み込む
   ```
   select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool
   ```
2. `tabs_context_mcp` を `createIfEmpty: true` で呼び、専用のタブグループを作る
   - 人が手で開いたタブはこのグループの外にあるため操作できない
3. `navigate` で対象ページを開く。Chrome のプロファイルを共有するのでログイン済みの状態で読める
4. `javascript_tool` で DOM を読む

`read_page` と `get_page_text` は使わない。必要なのは見た目やテキストではなくセレクタのため。

### 幅の狭い表示を採るとき

`resize_window` では `window.innerWidth` が変わらず、Bootstrap のブレークポイントをまたげない。**人に開発者ツールのデバイスモード（Chrome なら `Cmd+Shift+M`）で幅を変えてもらい、その状態のタブを読む。** 採取を始める前に `window.innerWidth` を読んで、狙った幅になっているか確かめる。

デバイスモードでは UA も入れ替わるため、`body` のブラウザ判定クラスが `chrome` から `ios` などへ変わる。このクラスを条件に使う実装は、実機とデバイスモードで同じ扱いになる点に注意する。

## 採取するもの

**ページの全要素を網羅しない。** そのページを触る機能が必要とする要素だけを採取する。対象は [`../features/`](../features/) の仕様書から逆算する。

| ファイル | 対象URL | 参照する仕様書 |
|---|---|---|
| [`navbar.md`](./navbar.md) | 全ページ共通（上部メニュー） | [`ui/menu.md`](../features/ui/menu.md) |
| [`common.md`](./common.md) | 全ページ共通（上部メニュー以外） | [`ui/floating-hint.md`](../features/ui/floating-hint.md) |
| [`drawer.md`](./drawer.md) | 右のブロックドロワー（全ページ共通） | [`ui/quick-drawer.md`](../features/ui/quick-drawer.md) |
| [`home.md`](./home.md) | `/` と `/my/` の両方 | [`home/`](../features/home/) の5本 |
| [`my-courses.md`](./my-courses.md) | `/my/courses.php` | [`my-courses/`](../features/my-courses/) の3本 |
| [`course-page.md`](./course-page.md) | `/course/view.php?id=<id>` | [`course-page/`](../features/course-page/) の10本 |
| [`mod-page.md`](./mod-page.md) | `/mod/page/view.php?id=<id>` | [`course-page/page-save.md`](../features/course-page/page-save.md) |
| [`grade.md`](./grade.md) | `/grade/report/user/index.php?id=<id>` | [`course-page/grade-inline.md`](../features/course-page/grade-inline.md) |

コースページは2種類を見る。autoattend を含まない一般的なコースと、含むコース。autoattend 系2機能は後者でしか採取できない。

## 書き方

[`navbar.md`](./navbar.md) に倣う。

- **セレクタを明示する。** 「ヘッダーの中のボタン」ではなく `#page-header .btn-toggle` と書く
- **PC表示とモバイル表示で構造が違う場合は両方書く。** Moodle はビューポート幅でマークアップが変わる
- **どの機能がその要素を必要とするか**を併記する。後から読む人が採取意図を辿れる
- 採取した HTML はそのまま貼らず、構造が分かる形に整形する

### セレクタは一致数を確認してから書く

書く前に `document.querySelectorAll(sel).length` で数える。**1件でなければ、そのセレクタでは特定できない。**

Moodle は同じクラス名を複数箇所で使う。実例として、サイトホームの `div.simplesearchform` は3件あり、うち2件はサイト全体検索のフォーム。`#region-main` のような祖先で絞ると1件になる。

### 動的に生成されるIDを使わない

ドロワーなどに `drawer-6ab152e3965776ab152e39388d4` のようなIDが付くことがある。これはページを開くたびに変わるため、セレクタとして使えない。クラス名、`data-*` 属性、または構造上の位置で特定する。

安定して使えるもの:

| 種類 | 例 |
|---|---|
| 固定ID | `#page-header`, `#region-main`, `#theme_boost-drawers-primary` |
| `data-*` 属性 | `[data-region="..."]`, `[data-key="..."]` |
| Moodle のクラス | `.block`, `.list-group-item`, `.dropdown-menu` |
| body のクラス | `.path-site`, `.pagelayout-frontpage`, `.format-site` |

`body` のクラスはページ種別の判定に使える。サイトホームなら `path-site pagelayout-frontpage`、コースページなら `format-*` が付く。
