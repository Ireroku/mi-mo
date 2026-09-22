# Moodle ホーム

サイトホーム（`/`）とダッシュボード（`/my/`）の DOM 構造リファレンス。実画面から採取したもの。

Moodle ではこの2つが別物として存在する。サイトホームは「コース」として実装されたトップページ（`format-site`、`course-1`）で、お知らせ・コースカテゴリ・コース検索はここにしかない。ダッシュボードはユーザーごとのブロックレイアウトで、`/my/courses.php`（マイコース）とも別ページ。

このDOMを操作するモジュールの指示書は [`../features/home/`](../features/home/) の5本。

## サイトホーム（`/`）について

セレクタ：`body.path-site.pagelayout-frontpage`

### body クラス

```
limitedwidth format-site course path-site chrome dir-ltr lang-ja yui-skin-sam yui3-skin-sam lms-m41-mie-u-ac-jp pagelayout-frontpage course-1 context-2 theme uses-drawers drawer-open-index jsenabled
```

### 構成

`#region-main` の中身。

```
div#region-main
  span#user-notifications.notifications: ユーザー通知（空のことが多い）
  div（idもclassも無し）
    span#maincontent: スキップリンクの飛び先
    div.course-content: サイトの「トピック0」領域 → お知らせ
      div.sitetopic
        ul.topics.frontpage
          li#section-1.section.course-section.main.clearfix
    a.skip-block.skip.aabtn: 「コースカテゴリへ」のスキップリンク
    div#frontpage-category-names: コースカテゴリ
    span#skipcategories.skip-block-to: スキップリンクの飛び先
    br
    div.box.py-3.d-flex.justify-content-center: コース検索
      div.simplesearchform
    br
```

`#region-main > div`（先頭の無名 div）の直下に、上から お知らせ → コースカテゴリ → コース検索 の順で並ぶ。新規要素を挿入するなら、この3つを隠した後に空く場所として **`div.course-content` の直前**（= `span#maincontent` の直後）が自然。[`timetable.md`](../features/home/timetable.md)・[`greeting.md`](../features/home/greeting.md)・[`last-login.md`](../features/home/last-login.md) の差し込み先はここ。

### お知らせ

[`hide-elements.md`](../features/home/hide-elements.md) が隠す対象。

セレクタ：`div.course-content`

サイトのトピック0に置かれたラベル活動（お知らせ文）の一覧。中身は管理者が編集する固定コンテンツで、「メンテナンス等お知らせ【重要】」「新学期の注意事項」等のラベルが `li.activity.modtype_label` として並ぶ。

```html
<div class="course-content">
  <div class="sitetopic">
    <ul class="topics frontpage">
      <li id="section-1" class="section course-section main clearfix">
        <div class="section-item">
          <div class="course-section-header d-flex">…</div>
          <div id="coursecontentcollapseid1" class="content">
            <div class="my-3">…</div>
            <ul class="section m-0 p-0 img-text d-block">
              <li id="module-837" class="activity activity-wrapper label modtype_label">…</li>
              <li id="module-2460" class="activity activity-wrapper label modtype_label">…</li>
              <!-- 以下、ラベル活動が続く -->
            </ul>
          </div>
        </div>
      </li>
    </ul>
  </div>
</div>
```

**注意：** 「お知らせ」という単語は他の場所にも出る（例：`#inst40` マイコース一覧内に「工学部・工学研究科からのお知らせ」というコース名がある）。それらはこの機能の対象ではない。ここでの「お知らせ」はサイトのトピック0領域だけを指す。

### コースカテゴリ

[`hide-elements.md`](../features/home/hide-elements.md) が隠す対象。

セレクタ：`#frontpage-category-names`

```html
<div id="frontpage-category-names">
  <h2>…</h2>
  <div class="course_category_tree clearfix frontpage-category-names">
    <div class="collapsible-actions">…</div>
    <div class="content">
      <div class="subcategories">
        <div class="category loaded with_children">
          <div class="info">
            <h3 class="categoryname aabtn"><a>…</a><span class="numberofcourse"></span></h3>
          </div>
          <div class="content">
            <div class="subcategories">
              <div class="category notloaded">
                <div class="info"><h4 class="categoryname aabtn">…</h4></div>
                <div class="content"></div>
              </div>
              <!-- 子カテゴリが続く -->
            </div>
          </div>
        </div>
        <!-- トップレベルのカテゴリが18件並ぶ（採取時点） -->
      </div>
    </div>
  </div>
</div>
```

### コース検索

[`hide-elements.md`](../features/home/hide-elements.md) が隠す対象。

セレクタ：`#region-main div.simplesearchform`

`div.simplesearchform` 単体ではページ内に3件ある。残り2件はサイト全体検索のフォーム（placeholder が「検索」、`#region-main` の外）で、こちらは対象ではない。`#region-main` で絞ると1件に特定できる。

親の `div.box.py-3.d-flex.justify-content-center` でも1件に特定できるが、Bootstrap のユーティリティクラスの並びに依存するため、テーマの更新で壊れやすい。

```html
<div class="box py-3 d-flex justify-content-center">
  <div class="simplesearchform">
    <form class="mform d-flex flex-wrap align-items-center simplesearchform">
      <input type="hidden">
      <div class="input-group">
        <label><span class="sr-only">…</span></label>
        <input class="form-control" type="text" placeholder="コースを検索する">
        <div class="input-group-append">
          <button class="btn btn-primary search-icon">
            <i class="icon fa fa-magnifying-glass fa-fw"></i>
          </button>
        </div>
      </div>
    </form>
  </div>
</div>
```

**注意：** 検索入力欄の `id`（`searchinput-6ab152e3…` のような形）は動的に変わる。セレクタに使わない。

## ダッシュボード（`/my/`）について

セレクタ：`body.path-my.pagelayout-mydashboard`

### body クラス

```
limitedwidth format-site path-my chrome dir-ltr lang-ja yui-skin-sam yui3-skin-sam lms-m41-mie-u-ac-jp pagelayout-mydashboard course-1 context-14104 theme uses-drawers drawer-open-index jsenabled
```

サイトホームと違い `format-site` の後ろに `course` が付かない。`context-*` の数値も別（サイトホームは `context-2` 固定、ダッシュボードはユーザーのコンテキストIDで人により変わる）。

### 構成

```
div#region-main
  span#user-notifications.notifications
  div（idもclassも無し）
    span#maincontent
    section#block-region-content.block-region: 中央カラムのブロック領域
      h2#content-block-region-heading.sr-only
      a.sr-only.sr-only-focusable
      section.block_myprofile.block.card.mb-3: プロフィールブロック
      span#sb-6
```

**お知らせ・コースカテゴリ・コース検索はダッシュボードには無い。** サイトホーム（`/`）だけの要素で、`hide-elements.md` の対象は `/` のみで完結する。

中央カラム（`#block-region-content`）には既定でプロフィールブロック（`block_myprofile`）しか無い。新規要素を挿入するなら、**`section.block_myprofile` の直前**（= `#block-region-content` の先頭）が自然な差し込み先。

```html
<section id="inst67615" class="block_myprofile block card mb-3">
  <div class="card-body p-3">
    <div class="d-flex"><h3 class="h5 card-title">…</h3></div>
    <div class="card-text content mt-3">
      <div>
        <div class="myprofileitem picture"><a class="d-inline-block aabtn">…</a></div>
      </div>
      <div class="w-100 no-overflow">
        <div class="myprofileitem fullname">…</div>
        <div class="myprofileitem country">…</div>
        <div class="myprofileitem city">…</div>
        <div class="myprofileitem city">…</div>
      </div>
      <div class="footer"></div>
    </div>
  </div>
</section>
```

右ドロワー（`#theme_boost-drawers-blocks`）には `course_list`（マイコース／`#inst40`）・`private_files`・`online_users`・`badges`・`calendar_upcoming` が並ぶ。これらは中央カラムではなく右ドロワー側のブロックで、home の5仕様書が触る対象ではない。

## ログインコンポーネント

[`login-component.md`](../features/home/login-component.md) は未ログイン時のログインフォームを対象にしているが、**ログイン状態では採取できなかった。** 採取中は常にログイン済みで、ログアウトすると認証情報を失いこの調査自体ができなくなるため、意図的にログアウトしていない。

未ログイン時に `/` を開いた際のフォーム構造は、別途ログアウト済みの状態で調査するか、ユーザーに確認してから進める必要がある。

## 気付いた注意点

- **モバイル表示は確認できなかった。** `resize_window` でウィンドウサイズを変更しても、このページで採取している環境では `window.innerWidth` が変化せず（常に `1540`）、実際のビューポート幅が変わらなかった。Bootstrap のブレークポイントクラス（`d-md-*` 等）が [`navbar.md`](./navbar.md) 同様に効いている可能性はあるが未確認。モバイル実機か、別の手段でビューポートを変えて再確認する必要がある。
- `#region-main` 直下の無名 `div`（`id` も `class` も無し）は、お知らせ・コースカテゴリ・コース検索・新規要素すべての共通の親。ここには安定した名前が無いため、セレクタとして直接参照せず、内部の要素（`div.course-content` 等）を基準にする。
- ダッシュボードの `context-*` はユーザーごとに変わる値なので、body クラスでページ種別を判定する際は `path-my` / `pagelayout-mydashboard` を使う（`context-14104` は使わない）。
- サイトホームの `#frontpage-category-names` 配下、トップレベル以外のカテゴリは `class="category notloaded"` で中身が空（遅延読み込み）。全カテゴリを数えたい場合はクリックで展開が必要。
