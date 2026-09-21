# Moodle マイコース

マイコース一覧（`/my/courses.php`）の DOM 構造リファレンス。実画面から採取したもの。

サイトホーム・ダッシュボード（[`home.md`](./home.md)）とは別ページ。ダッシュボードの右ドロワーに出る `course_list` ブロックとも別物で、こちらは中央カラムいっぱいに出る `block_myoverview` 1個だけのページ。

このDOMを操作するモジュールの指示書は [`../features/my-courses/`](../features/my-courses/) の3本。

## 対象URL

`https://lms-m41.mie-u.ac.jp/my/courses.php`

セレクタ：`body.path-my.pagelayout-mycourses`

### body クラス

```
limitedwidth page-mycourses format-site path-my chrome dir-ltr lang-ja yui-skin-sam yui3-skin-sam lms-m41-mie-u-ac-jp pagelayout-mycourses course-1 context-1 theme uses-drawers drawer-open-index jsenabled
```

`page-mycourses` がこのページ固有のクラス。ダッシュボード（`path-my` は共通だが `pagelayout-mydashboard`）と区別する場合はこちらを見る。

## 構成

`#region-main` の中身。

```
div#region-main
  span#user-notifications.notifications
  div（idもclassも無し）
    span#maincontent
    section#block-region-content.block-region
      section.block_myoverview.block.card.mb-3: コース一覧ブロック（このページの主要素）
      span#sb-2
```

コース一覧ブロックのセレクタ：`section.block_myoverview`（1件）。`id`（`#inst982` 等）はインスタンスIDで環境により変わるため使わない。

## コース一覧ブロックの構成

`section.block_myoverview` の中身。

```
section.block_myoverview
  div.card-body.p-3
    div.card-text.content.mt-3
      div.block-myoverview.block-cards: div#block-myoverview-<dynamic>
        div.d-flex.align-items-center.my-2[data-region="filter"]: フィルター行
          div.row.g-0
            div.dropdown: #groupingdropdown（グルーピング：すべて/進行中/未来/過去/星付き/表示削除済み）
            div.mb-1.me-1.flex-grow-1: 検索欄（.simplesearchform）
            div: #sortingdropdown（並べ替え）
            div.dropdown: #displaydropdown（表示形式：カード/リスト/概要）
        div.container-fluid.p-0
          div[data-region="courses-view"]: コース一覧本体
```

`.block-myoverview` 単体は1件（`section.block_myoverview` も1件）。祖先を付けなくても特定できるが、他ブロックとの混同を避けるため実装では `.block-myoverview` 配下として書く。

**コース一覧はAJAXで非同期に読み込まれる。** 初期表示は `.bg-pulse-grey` が付いたスケルトンで、`core_course_get_enrolled_courses_by_timeline_classification` という webservice 呼び出し（`/lib/ajax/service.php`）の完了後に実データへ置き換わる。採取や自動操作の際は `document.querySelectorAll('.course-listitem .bg-pulse-grey').length === 0` を待ってから読む。

## フィルター行

セレクタ：`.block-myoverview [data-region="filter"]`（1件）

グルーピング・検索・並べ替え・表示切り替えの4つのコントロールが並ぶ。**すべて同じ行にあり、検索欄と並べ替えUIが隣接する。** [`today-order.md`](../features/my-courses/today-order.md) の並べ替え機能を実装する際、この行のUI（特に `#sortingdropdown`）と干渉しないよう注意。

### グルーピング（`#groupingdropdown`）

セレクタ：`#groupingdropdown`（1件、ボタン本体）

コース一覧の絞り込みカテゴリ。既定値は「すべて」。

```html
<div class="dropdown mb-1 me-1">
  <button id="groupingdropdown" class="btn btn-outline-secondary dropdown-toggle" data-toggle="dropdown">
    <span data-active-item-text="">すべて</span>
  </button>
  <ul class="dropdown-menu" role="menu" data-show-active-item="" data-skip-active-class="true">
    <li><a class="dropdown-item" data-filter="grouping" data-pref="all" data-value="all">すべて</a></li>
    <li><a class="dropdown-item" data-filter="grouping" data-pref="inprogress" data-value="inprogress">進行中</a></li>
    <li><a class="dropdown-item" data-filter="grouping" data-pref="future" data-value="future">未来</a></li>
    <li><a class="dropdown-item" data-filter="grouping" data-pref="past" data-value="past">過去</a></li>
    <li><a class="dropdown-item" data-filter="grouping" data-pref="favourites" data-value="favourites">星付き</a></li>
    <li><a class="dropdown-item" data-filter="grouping" data-pref="hidden" data-value="hidden">表示削除済み</a></li>
  </ul>
</div>
```

選択中の項目には `aria-current="true"` が付く。

### 検索欄（[`incremental-search.md`](../features/my-courses/incremental-search.md) が対象）

セレクタ：`.block-myoverview [data-region="input"]`（1件、入力欄本体）

```html
<div class="d-flex flex-wrap align-items-center simplesearchform" id="searchform-auto-<dynamic>">
  <div class="input-group searchbar w-100">
    <label for="searchinput-<dynamic>">
      <span class="sr-only">コースを検索する</span>
    </label>
    <input type="text"
           data-region="input"
           data-action="search"
           id="searchinput-<dynamic>"
           class="form-control withclear rounded"
           placeholder="検索"
           name="search"
           autocomplete="off">
    <button class="btn btn-clear d-none" data-action="clearsearch" type="button">
      <i class="icon fa fa-xmark fa-fw"></i>
      <span class="sr-only">検索入力をクリアする</span>
    </button>
  </div>
</div>
```

**`<form>` タグが無い。** 入力欄はただの `<input>` で、送信ボタンも `submit` 型の要素も無い。安定して使えるセレクタは `[data-region="input"]` と `[data-action="search"]`（後者はクリアボタンにも同じ属性が無いため確認要、実際にはクリアボタンは `data-action="clearsearch"` で区別できる）。`id` は `searchform-auto-<hash>` / `searchinput-<hash>` の形で毎回変わる。

**送信先・イベント：** 入力欄に `keyup` イベントが起きると、`core_course_get_enrolled_courses_by_timeline_classification`（`/lib/ajax/service.php`）へ検索語を含めた webservice 呼び出しが飛び、`.block-myoverview` の中身（フィルター行を含むブロック全体）がまるごと再描画される。Enterキー入力やフォーム送信は関与しない（そもそも `<form>` が無い）。`input` イベント単体では発火せず、`keyup` が必要（実機のキー入力では両方同時に発生するため通常は問題にならない）。

再描画のたびに `id`（`searchform-auto-*` 等）を含む祖先要素のIDが新しい値に変わる。**検索後に再取得したセレクタを使う場合、動的IDを保持し続けている前提で書かない。**

検索結果が0件の場合は一覧部分に次の要素が出る。

```html
<div class="text-xs-center text-center mt-3">
  <img class="empty-placeholder-image-lg mt-1">
  <p class="text-muted mt-3">コースなし</p>
</div>
```

### 並べ替え（`#sortingdropdown`）

セレクタ：`#sortingdropdown`（1件、ボタン本体）

[`today-order.md`](../features/my-courses/today-order.md) が実装する「今日の授業順」は、Moodle標準のこの並べ替えUIとは別軸の機能になる。標準の並べ替えを選び直された場合にどちらを優先するかは指示書側の決めごと。

```html
<div class="dropdown">
  <button id="sortingdropdown" class="btn btn-outline-secondary dropdown-toggle" data-toggle="dropdown">
    最終アクセスで並べ替える
  </button>
  <ul class="dropdown-menu" role="menu" data-show-active-item="" data-skip-active-class="true">
    <li><a class="dropdown-item" data-filter="sort" data-pref="title" data-value="fullname">コース名で並べ替える</a></li>
    <li><a class="dropdown-item" data-filter="sort" data-pref="lastaccessed" data-value="ul.timeaccess desc" aria-current="true">最終アクセスで並べ替える</a></li>
  </ul>
</div>
```

選択肢は「コース名」「最終アクセス」の2つのみ。既定値は「最終アクセス」（`aria-current="true"` が付く方）。

### 表示切り替え（`#displaydropdown`）

セレクタ：`#displaydropdown`（1件、ボタン本体）

```html
<div class="dropdown mb-1">
  <button id="displaydropdown" class="btn btn-outline-secondary dropdown-toggle" data-toggle="dropdown">
    リスト
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" data-display-option="display" data-pref="card" data-value="card">カード</a></li>
    <li><a class="dropdown-item" data-display-option="display" data-pref="list" data-value="list">リスト</a></li>
    <li><a class="dropdown-item" data-display-option="display" data-pref="summary" data-value="summary">概要</a></li>
  </ul>
</div>
```

既定値は「リスト」。切り替えるとコース一覧全体（`.block-myoverview` の中身）が再描画され、**表示形式によってコース要素のDOM構造が変わる。** 詳細は次節。

### ページングコントロール

セレクタ：`.block-myoverview [id^="paging-control-limit-container-"]`

表示件数を「12」「24」「すべて」から選べる。既定値は「すべて」で、採取時点（26コース）はページングが発生せず全件が一度にDOMへ並ぶ。件数が多いユーザーで「12」「24」を選んでいる場合、非表示ページのコースはDOMに存在しない可能性がある。[`today-order.md`](../features/my-courses/today-order.md) の並べ替えはDOM上に存在する要素にしか効かない点に注意。

## コース一覧アイテム

**表示形式（カード/リスト/概要）ごとにDOM構造が異なる。** 3種すべてで共通しているのは、コース1件を表す要素に必ず次の属性が付くこと。

```
[data-region="course-content"][data-course-id="<courseid>"]
```

[`today-order.md`](../features/my-courses/today-order.md)（並べ替えの対象コンテナ特定）と [`clickable-card.md`](../features/my-courses/clickable-card.md)（要素全体の特定）は、表示形式を問わずこのセレクタを基準にすると表示切り替えに対して頑丈になる。

**アクションメニュー（星付け・非表示等の「…」ボタン）はどの表示形式でも `.menu` クラスを持つ領域に入る。** [`clickable-card.md`](../features/my-courses/clickable-card.md) で要素全体をクリック可能にする際、`[data-region="course-content"] .menu` の内側はクリックの奪い合いにならないよう除外が必要。

### リスト表示（既定）

コース1件のセレクタ：`.block-myoverview .course-listitem`（26件、コース数と一致）

```html
<li class="list-group-item course-listitem border-start-0 border-end-0 border-top-0 px-2 rounded-0"
    data-region="course-content" data-course-id="1616">
  <div class="row">
    <div class="col-md-2 d-flex align-items-center mb-sm-3 mb-md-0">
      <a class="mw-100 w-100" href="/course/view.php?id=1616" tabindex="-1">
        <div class="rounded list-image mw-100"><span class="sr-only">…</span></div>
      </a>
    </div>
    <div class="col-md-9 d-flex flex-column">
      <a class="aalink coursename" href="/course/view.php?id=1616">
        <span id="favorite-icon-1616-3">…</span>
        コース名テキスト
      </a>
      <div class="text-muted muted d-flex flex-wrap">
        <span class="sr-only">…</span>
        <span class="categoryname">カテゴリ名</span>
      </div>
    </div>
    <div class="col-md-1 p-0 d-flex menu">
      <div class="ms-auto dropdown">
        <button class="btn btn-link btn-icon icon-size-3 coursemenubtn" data-toggle="dropdown">…</button>
        <div class="dropdown-menu dropdown-menu-right">
          <a class="dropdown-item" href="#" data-action="add-favourite" data-course-id="1616">このコースに星を付ける</a>
          <!-- 星を外す・非表示にする 等が続く。表示状態に応じて .hidden で出し分け -->
        </div>
      </div>
    </div>
  </div>
</li>
```

クリック可能なリンクは画像部分（`a.mw-100.w-100`、`tabindex="-1"` で読み上げ対象外）とコース名（`a.aalink.coursename`）の2箇所だけ。行の余白部分はリンクではない（[`clickable-card.md`](../features/my-courses/clickable-card.md) の課題そのもの）。両リンクの `href` は同一（`/course/view.php?id=<courseid>`）。

### カード表示

コース1件のセレクタ：`.block-myoverview .card.course-card`（コース数と一致）

```html
<div class="card course-card mx-1" data-region="course-content" data-course-id="1785" role="listitem">
  <a href="/course/view.php?id=1785" tabindex="-1">
    <div class="card-img-top"><span class="sr-only">…</span></div>
  </a>
  <div class="card-body pe-1 course-info-container" id="course-info-container-1785-6">
    <div class="d-flex align-items-start">
      <div class="w-100 text-truncate">
        <a class="aalink coursename me-2 mb-1" href="/course/view.php?id=1785">
          <span id="favorite-icon-1785-6">…</span>
          <span class="multiline">コース名テキスト</span>
        </a>
        <div class="text-muted muted d-flex flex-wrap">
          <span class="categoryname text-truncate">カテゴリ名</span>
        </div>
      </div>
    </div>
  </div>
  <div class="d-flex align-items-start">
    <div class="card-footer menu border-0 bg-white ms-auto">
      <div class="ms-auto dropdown">
        <button class="btn btn-link btn-icon icon-size-3 coursemenubtn" data-toggle="dropdown">…</button>
        <div class="dropdown-menu dropdown-menu-right">…</div>
      </div>
    </div>
  </div>
</div>
```

カードは `div.col.d-flex.px-0.mb-2` に包まれ、さらに `div.card-grid.mx-0.row.row-cols-1.row-cols-sm-2.row-cols-lg-3` がグリッド全体を包む（Bootstrapのカラムクラスで列数が画面幅に応じて1〜3に変わる。DOM構造自体は変わらない）。

リンク構成はリスト表示と同じで、画像リンク（`tabindex="-1"`）とコース名リンクの2箇所。`href` はどちらも同一の `/course/view.php?id=<courseid>`。

### 概要表示

コース1件のセレクタ：`.block-myoverview .course-summaryitem`（コース数と一致）

```html
<div class="course-summaryitem list-group-item course-listitem border-start-0 border-end-0 border-top-0 px-2 rounded-0"
     data-region="course-content" data-course-id="1785">
  <div class="row">
    <div class="col-md-2 d-flex align-items-center mb-sm-3 mb-md-0">
      <a class="mw-100 w-100" href="/course/view.php?id=1785" tabindex="-1">
        <div class="summary-image rounded mw-100"><span class="sr-only">…</span></div>
      </a>
    </div>
    <div class="col-md-9 d-flex flex-column">
      <a class="aalink coursename" href="/course/view.php?id=1785">コース名テキスト</a>
      <span class="categoryname">カテゴリ名</span>
      <div class="summary"><span class="sr-only">…</span>コース概要テキスト</div>
    </div>
    <div class="col-md-1 p-0 d-flex menu">…</div>
  </div>
</div>
```

リスト表示とほぼ同じ骨格（`.course-listitem` クラスも共存）に、コース概要文を持つ `div.summary` が追加される。`div.list-image` の代わりに `div.summary-image` を使う点以外はリスト表示と構造が一致する。

## 気付いた注意点

- **`section.block_myoverview` の `id`（`#inst982` 等）はブロックインスタンスIDで環境により変わる。** ページ内に1インスタンスしか無いため `section.block_myoverview` で十分特定できる。
- **検索・表示切り替え・並べ替え・グルーピングはすべて同じ仕組み（`core_course_get_enrolled_courses_by_timeline_classification` への webservice 呼び出し）で `.block-myoverview` の中身を丸ごと再描画する。** 1つの操作を実装するときも、他の操作によって自分が採取したセレクタ内の動的IDが変わりうることを前提にする。
- **モバイル表示は明確な差分を確認できなかった。** `resize_window` で幅400pxを指定すると実際は`window.innerWidth`が500になり、正確な幅を再現できていない。この幅でもコース要素のクラス名・構造自体に変化は無く、Bootstrapのユーティリティクラス（`col-md-*`、`row-cols-*`）による見た目のレイアウト変更のみと考えられるが、実機・別手段での再確認が望ましい。
- ページング（表示件数）の既定値は「すべて」。件数を絞っている環境では非表示ページのコースがDOMに存在しない点に注意。
- コース名リンクの `href` はハッシュ等のクエリを持たず `/course/view.php?id=<courseid>` のみ。`data-course-id` 属性からも同じIDが取れるため、リンクをパースせず属性から読む方が安全。
