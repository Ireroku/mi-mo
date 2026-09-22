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

## コースインデックスのセクションの開閉状態

[`index-toggle.md`](../features/course-page/index-toggle.md) が必要とする状態。同じ機能が使う一括開閉の2リンク（`expandallcourseindexsections` / `collapseallcourseindexsections`）自体は [`course-page.md`](./course-page.md) の「コースインデックスの一括開閉ボタン」節に採取済み。2つを1つのトグルへまとめるには、押した時点で全体が開いているか閉じているかを判定する手段が要る。ここではその判定方法だけを補う。

採取に使ったコース：コンパイラ(2026年度)（id=2163、セクション17件）。

### 開閉状態が現れる要素

セレクタ：`#course-index [data-for="section"]`（17件、コースのセクション数と一致）

各セクションの `div[data-for="section"]` 自身に `aria-expanded` 属性が付く。開いていれば `"true"`、閉じていれば `"false"`。**`class` は開閉で変化しない**（常に `courseindex-section` のまま）。

`collapsed` クラスが付くのは子要素の `a.courseindex-chevron`（開閉トグルのシェブロンアイコン）で、`div[data-for="section"]` 自身には付かない。

```html
<!-- 閉じた状態 -->
<div class="courseindex-section  " data-for="section" data-id="28081" aria-expanded="false" ...>
  <div class="courseindex-item d-flex ... courseindex-section-title" data-for="section_item">
    <a data-toggle="collapse" class="courseindex-chevron icons-collapse-expand collapsed"
       aria-expanded="false" aria-controls="courseindexcollapse0" href="#courseindexcollapse0">...</a>
    ...
  </div>
</div>
```

セクション本文を包む `div#courseindexcollapse<n>`（Bootstrap の collapse コンポーネント）も `show` クラスの有無で開閉に追随する。

### 3状態での件数

| 状態 | `[aria-expanded="true"]` | `[aria-expanded="false"]` | `.courseindex-chevron.collapsed` | `[id^="courseindexcollapse"].show` |
|---|---|---|---|---|
| 初期状態（ページを開いた直後） | 17 | 0 | 0 | 17 |
| 「すべてを展開する」実行後 | 17 | 0 | 0 | 17 |
| 「すべてを折りたたむ」実行後 | 0 | 17 | 17 | 0 |

（`[aria-expanded="..."]` の対象はいずれも `#course-index [data-for="section"]`。`.courseindex-chevron.collapsed` と `[id^="courseindexcollapse"].show` の対象は `#course-index` 配下全体）

初期状態は全開。コンパイラ(2026年度) を開いた直後、17セクションすべてが `aria-expanded="true"` だった。「すべてを展開する」実行後に変化が無いのは、既に全開だったため。

### 全体の開閉を1つのセレクタで判定できる

`document.querySelectorAll('#course-index [data-for="section"][aria-expanded="false"]').length` で、閉じているセクションの数を数える。0件なら全開、セクション総数と同じなら全閉と判定できる。

### 混在状態（一部だけ手動で開閉した場合）

全折りたたみの状態から、セクション0とセクション3のシェブロンだけを個別にクリックし、残り15件を閉じたまま確認した。

- `[aria-expanded="true"]` が2件、`[aria-expanded="false"]` が15件になった。各セクションの `aria-expanded` はそのセクション単独の開閉状態をそのまま反映し、他のセクションの開閉には連動しない
- 混在状態でもオプションドロップダウンの2リンク（`expandallcourseindexsections` / `collapseallcourseindexsections`）は両方 DOM に残ったまま。状態に応じて片方を隠す・無効化するような挙動は無い

混在時にトグルをどちらへ倒すか（1件でも閉じていれば「展開」扱いにするか、1件でも開いていれば「折りたたみ」扱いにするか）は、この採取だけでは決まらない。件数を数える上記のセレクタを使えば、どちらの基準でも実装できる。

### `#courseindexdrawercontrolsmenubutton`（オプションボタン）自身の状態

`aria-expanded` 属性を持つが、これはドロップダウンメニュー自体の開閉（開いていれば `"true"`）を示すもので、セクションの開閉状態とは無関係。初期状態・全展開後・全折りたたみ後のいずれでも値は `"false"`（メニューを閉じている間）のまま変化しなかった。セクションの開閉状態を読み取る用途には使えない。

### 未確認

- 17件以外のセクション数、format-weeks 以外のコースフォーマットでも同じ挙動になるかは未確認。コンパイラ(2026年度)（format-weeks、17セクション）1コースのみで確認した

## 幅がないときの挙動

幅 393px（iPhone 16 相当。開発者ツールのデバイスモードで再現）で、コンパイラ(2026年度)（`/course/view.php?id=2163`）とサイトホームから採取した。

### ドロワーは本文を押し出さず、上に重なる

開いた状態の位置関係は次のとおり。本文（`#region-main`）の位置と幅は、ドロワーの開閉で変化しない。

| ドロワー | 開いたときの位置 | 本文の位置 |
|---|---|---|
| 左（コースインデックス） | `left: 0`、幅 285px | `left: 8`、幅 377px のまま |
| 右（ブロック） | `left: 78`、右端が画面端（393px）、幅 315px | `left: 8`、幅 377px のまま |

背景を覆う要素（`.drawer-backdrop` など）は現れない。ドロワーの外側は本文がそのまま見える状態になる。

### 開閉ボタンの出し分け

`[data-toggler="drawers"]` を持つボタンは、幅がないとき次のように分かれる。

| `data-action` | 例 | 幅がないときの表示 |
|---|---|---|
| `toggle`（開く） | `aria-label="コースインデックスを開く"` / `"ブロックドロワを開く"` | `display: inline-block` |
| `closedrawer`（閉じる） | `aria-label="コースインデックスを閉じる"` など | `hidden` クラスが付き `display: none` |

閉じる操作は、ドロワー内の閉じるボタンではなく、開くときと同じ `toggle` のボタンをもう一度押す形になる。

### 初期状態は閉じている

コースページを幅 393px で開いた直後、`#theme_boost-drawers-courseindex` は `aria-hidden="true"`（閉）だった。このとき `body` には `drawer-open-index` が付いたままで、「開閉状態の現れ方」に書いた「`body` のクラスは開閉状態を反映しない」が幅のないときにも当てはまる。

### セクションの一括操作ボタンは残る

`#collapsesections`（`.section-collapsemenu`、「すべてを折りたたむ」）は幅がないときも `display: block` で表示される。

## 未確認

- ダッシュボードの `private_files` / `online_users` / `badges` / `calendar_upcoming` の内部DOM構造は未採取（今回の仕様が対象としないため）
- `course_list` 内のコースの並び順が何に基づくか（登録日順か、コース設定順か）は未確認。Moodle 側の並び順をそのまま使っている
- ドロワーが出ないページの有無は、調査した3ページの範囲では確認できなかった。他ページ（管理画面など）は未調査
