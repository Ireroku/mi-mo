# 右ブロックドロワー

`/`（サイトホーム）・`/my/`（ダッシュボード）・`/course/view.php?id=<id>`（コースページ）の3ページで採取した、右側のブロックドロワーのDOM構造リファレンス。[`ui/quick-drawer.md`](../features/ui/quick-drawer.md)（ドロワーの削除、コースのピン留め）が対象とする要素を逆算して採取する。

[`home.md`](./home.md) の「ダッシュボード（`/my/`）について」に、右ドロワーの内訳（course_list / private_files / online_users / badges / calendar_upcoming）が概要として書かれている。ここではその詳細と、ページごとの違いを補う。

## ドロワー本体

セレクタ：`#theme_boost-drawers-blocks`

3ページとも存在する。

```html
<div class="drawer drawer-right d-print-none" data-region="fixed-drawer" id="theme_boost-drawers-blocks"
     data-preference="drawer-open-block" data-state="show-drawer-right" data-forceopen="" data-close-on-resize="1"
     aria-hidden="true">
  <div class="drawerheader">…</div>
  <div class="drawercontent drag-container">
    <div class="d-print-none">
      <aside id="block-region-side-pre" class="block-region">
        <!-- section.block がページごとに並ぶ -->
      </aside>
    </div>
  </div>
</div>
```

`#block-region-side-pre` は3ページとも1件で、中の `section` の数と種類だけがページで変わる（後述）。

## 開閉ボタン

| 用途 | セレクタ | 使う機能 |
|---|---|---|
| 開くボタン | `[data-action="toggle"][data-target="theme_boost-drawers-blocks"]` | ドロワーの削除 |
| 閉じるボタン（ドロワー内） | `[data-action="closedrawer"][data-target="theme_boost-drawers-blocks"]` | 参考 |

3ページとも各1件。開くボタンは `<button class="btn icon-no-margin" title="ブロックドロワを開く">`、閉じるボタンはドロワー内の `.drawerheader` にあり、開いている間だけ表示される（閉じている間は `hidden` クラスが付く）。

## 開閉状態の現れ方

**閉じた状態：**

```html
<div class="drawer drawer-right d-print-none" aria-hidden="true" data-state="show-drawer-right" …>
```

**開いた状態（開くボタンをクリック後）：**

```html
<div class="drawer drawer-right d-print-none show" data-state="show-drawer-right" …>
```

`show` クラスの有無と `aria-hidden` 属性の有無が差分。`data-state="show-drawer-right"` はトグル対象名の固定値で、実際の開閉状態を示さない（開閉どちらでも同じ値）。

**注意：`body` のクラスは開閉状態を反映しない。** `body` には3ページとも常に `drawer-open-index` が付くが、これは左側のドロワー（コースインデックス／プライマリメニュー）の `data-preference` 値で、右ブロックドロワー（`data-preference="drawer-open-block"`）の状態とは無関係。右ブロックドロワーを開閉しても `body` のクラスは変化しない。実際に確認するには `#theme_boost-drawers-blocks` 自身の `class`（`show` の有無）か `aria-hidden` を見る必要がある。

開閉状態はページをまたいで保持される（Moodle 側がユーザー設定として記憶する）。あるページで開くと、別のページに遷移しても開いた状態で表示される。

## course_list ブロック（マイコース）

セレクタ：`#theme_boost-drawers-blocks section[data-block="course_list"]`（3ページとも1件、`id="inst40"` で共通）

コースのピン留め機能が対象とする要素。

```html
<section id="inst40" class=" block_course_list block list_block  card mb-3"
          role="navigation" data-block="course_list" data-instance-id="40" aria-labelledby="instance-40-header">
  <div class="card-body p-3">
    <div class="d-flex"><h3 id="instance-40-header" class="h5 card-title">マイコース</h3></div>
    <div class="card-text content mt-3">
      <ul class="unlist">
        <li class="r0">
          <div class="column c1">
            <a title="2024年度生" href="https://lms-m41.mie-u.ac.jp/course/view.php?id=3170">
              <i class="icon fa fa-graduation-cap fa-fw" title="コース"></i>2024年度入学生
            </a>
          </div>
        </li>
        <li class="r1">…</li>
        <!-- 履修コースの数だけ li が続く（採取時点で26件） -->
      </ul>
      <div class="footer"><a href="https://lms-m41.mie-u.ac.jp/course/index.php">すべてのコース</a> ...</div>
    </div>
  </div>
</section>
```

- `li` は `r0` / `r1` が交互に付くだけで、コース固有の値は持たない
- コースを一意に特定できる属性は `a` の `href` だけ。`https://lms-m41.mie-u.ac.jp/course/view.php?id=<courseid>` のクエリ文字列 `id` を読み取る必要がある。`data-course-id` のような専用属性は無い
- `a` の `title` 属性はコースの短縮名（コース設定の「コースの短縮名」）。表示テキストはコースのフルネーム。両方 Moodle 側の値で、拡張機能が独自に付けたものではない
- アイコンは常に `fa-graduation-cap` 固定。お気に入り・ピン留めを示すアイコンや、既存のピン留め機構は無い

## ページごとの違い

| ページ | body クラス（抜粋） | ドロワー内の section |
|---|---|---|
| サイトホーム `/` | `path-site pagelayout-frontpage` | `course_list`（`inst40`）のみ |
| ダッシュボード `/my/` | `path-my pagelayout-mydashboard` | `course_list`（`inst40`）／`private_files`（`inst2037`）／`online_users`（`inst2038`）／`badges`（`inst2039`）／`calendar_upcoming`（`inst2041`） |
| コースページ `/course/view.php?id=2163` | `path-course path-course-view pagelayout-course` | `course_list`（`inst40`）のみ |

`course_list` は3ページとも `id="inst40"` で同一インスタンス。サイト全体で共有される1つのブロックで、ページごとに内容が変わるわけではない。

`private_files` / `online_users` / `badges` / `calendar_upcoming` はダッシュボードにしか無い。ダッシュボード（マイページ）専用のブロックリージョン設定で追加されており、内部構造は今回の仕様（ドロワーの削除・コースのピン留め）が触らないため採取していない。

3ページとも `#theme_boost-drawers-blocks` 自体は存在し、開閉ボタンも機能する。**ドロワーが出ないページは、調査した3ページの中には無かった。**

## 左ドロワー（コースインデックス）との違い

コースページには、右の `#theme_boost-drawers-blocks` とは別に、左側へ `#theme_boost-drawers-courseindex` が存在する（サイトホーム・ダッシュボードには無い）。

```html
<div class="drawer drawer-left d-print-none" data-region="fixed-drawer" id="theme_boost-drawers-courseindex"
     data-preference="drawer-open-index" data-state="show-drawer-left" data-forceopen="0" data-close-on-resize="0"
     aria-hidden="true">
  <div class="drawerheader">…</div>
  <div class="drawercontent drag-container">
    <nav id="courseindex" class="courseindex">…</nav>
  </div>
</div>
```

右ブロックドロワーとの違い：

- 中身が `section.block` の並びではなく、`nav#courseindex` 1つ（そのコースのセクション・活動のツリー）
- `data-preference="drawer-open-index"` を持つ。これが `body` に常に付く `drawer-open-index` クラスの出所
- `data-close-on-resize="0"`（右ブロックドロワーは `"1"`）

クイックドロワー機能（ドロワーの削除・コースのピン留め）はこの左ドロワーを対象としないため、詳細な内部構造は採取していない。

## 未確認

- **モバイル表示は未確認。** [`home.md`](./home.md) と同じ理由で、`resize_window` を使っても採取環境の `window.innerWidth` が変わらず、ビューポート幅を変えて再採取できなかった
- ダッシュボードの `private_files` / `online_users` / `badges` / `calendar_upcoming` の内部DOM構造は未採取（今回の仕様が対象としないため）
- `course_list` 内のコースの並び順が何に基づくか（登録日順か、コース設定順か）は未確認。Moodle 側の並び順をそのまま使っている
- ドロワーが出ないページの有無は、調査した3ページの範囲では確認できなかった。他ページ（管理画面など）は未調査
