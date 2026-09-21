# Moodle コースページ

コースページ（`/course/view.php?id=<id>`）の DOM 構造リファレンス。実画面から採取したもの。

このDOMを操作するモジュールの指示書は [`../features/course-page/`](../features/course-page/) の10本。

## 採取に使ったコース

| コース | id | フォーマット | autoattend | 用途 |
|---|---|---|---|---|
| コンパイラ(2026年度) | 2163 | format-weeks | なし | 一般コースの基本構造 |
| ソフトウェア工学（2026） | 4743 | format-weeks | あり | assign / url / forum の活動構造 |
| システム工学 2026 | 5681 | format-weeks | なし | label / page / quiz の活動構造 |
| 暗号と情報セキュリティ (2026) | 1785 | format-weeks | あり | autoattend 2機能の採取対象 |

**注意：autoattend は珍しくない。** 「オペレーティングシステム (2026)」「ソフトウェア工学（2026）」など、一見関係なさそうなコースにも autoattend 活動が置かれている。一般コースの採取には autoattend が無いことを個別に確認した「コンパイラ(2026年度)」を使った。

**フォーマットは format-weeks しか確認できていない。** 履修コースが偏っており、format-topics のコース（例：INFOSS情報倫理）は自己登録ページ（`/enrol/index.php`）止まりで中身を見られなかった。セクション一覧のコンテナ（後述）はクラス名がフォーマット依存（`ul.weeks`）だが、`data-for="course_sectionlist"` 属性はコア共通のテンプレートに由来するため他フォーマットでも同じはずだが、実機では未確認。

### body クラス

```
format-weeks limitedwidth  path-course path-course-view chrome dir-ltr lang-ja yui-skin-sam yui3-skin-sam lms-m41-mie-u-ac-jp pagelayout-course course-<id> context-<num> category-<num> theme uses-drawers drawer-open-index jsenabled
```

`format-weeks` の部分がコースフォーマットで変わる（`format-topics` 等）。`course-<id>` と `context-<num>` はコースごとに変わるので判定に使わない。ページ種別の判定には `path-course path-course-view pagelayout-course` を使う。

## パンくずリスト

[`breadcrumb.md`](../features/course-page/breadcrumb.md) が対象にする要素。

セレクタ：`#page-header .breadcrumb`（1件）

```html
<ol class="breadcrumb">
  <li class="breadcrumb-item">
    <a href="https://lms-m41.mie-u.ac.jp/course/index.php?categoryid=7">工学部・研究科</a>
  </li>
  <li class="breadcrumb-item">
    <a href="https://lms-m41.mie-u.ac.jp/course/index.php?categoryid=8">総合工学科（コース）</a>
  </li>
  <li class="breadcrumb-item">
    <span>情報工学コース・専攻</span>
  </li>
</ol>
```

カテゴリの階層のみが並ぶ。**コース名自体はパンくずリストに含まれない**（最後の `<li>` はコースの所属カテゴリで止まる）。末尾がリンクか `<span>` かは、そこが現在地かどうかで決まる（現在地は `<span>`、それ以外は `<a>`）。

## セクションの一括開閉ボタン

[`section-toggle-design.md`](../features/course-page/section-toggle-design.md) が対象にする要素。コース内容の右上に1つだけ表示される、単一のトグルリンク。

セレクタ：`#collapsesections`（1件、固定ID）

```html
<a id="collapsesections" class="section-collapsemenu" href="#" aria-expanded="true"
   role="button" data-toggle="toggleall"
   aria-controls="collapsesectionid28081 collapsesectionid28082 ...">
  <span class="collapseall text-nowrap">すべてを折りたたむ</span>
  <span class="expandall text-nowrap">すべてを展開する</span>
</a>
```

`aria-controls` の値（`collapsesectionid<数値>`）はセクションごとの内部IDの列挙で、コースが変われば数値も変わる。この要素自体をセレクタに使う必要はない。`collapseall` と `expandall` の2つの `<span>` が両方常に DOM に存在し、`aria-expanded` の状態と CSS で表示が切り替わる（テキストが2つとも DOM にあるので、スタイル変更時はどちらを対象にするか意識する）。

## コースインデックスの一括開閉ボタン

[`index-toggle.md`](../features/course-page/index-toggle.md) が対象にする要素。左のコースインデックス（`#theme_boost-drawers-courseindex`）のヘッダーにある「オプション」ドロップダウンの中。**現状は「すべて展開する」「すべて折りたたむ」の2つが別リンクとして並んでいる**（トグル化前の状態）。

セレクタ：`#courseindexdrawercontrolsmenu`（1件、固定ID）

```html
<div class="dropdown-menu dropdown-menu-right" role="menu" id="courseindexdrawercontrolsmenu"
     aria-labelledby="courseindexdrawercontrolsmenubutton">
  <a class="dropdown-item" href="#" data-action="expandallcourseindexsections" role="menuitem">
    すべてを展開する
  </a>
  <a class="dropdown-item" href="#" data-action="collapseallcourseindexsections" role="menuitem">
    すべてを折りたたむ
  </a>
</div>
```

呼び出し元のトグルボタンは `#courseindexdrawercontrolsmenubutton`（ドロップダウンを開くボタン、固定ID）。2つのリンクは `data-action` 属性（`expandallcourseindexsections` / `collapseallcourseindexsections`）で区別する。これはクリックのたびにメニューを開く手間があるため、1つのトグルボタンにまとめる余地がある。

## コース内容の構造と評定リンク

[`grade-inline.md`](../features/course-page/grade-inline.md) が対象にする要素。

### セクション一覧のコンテナ

```
#region-main
  div.course-content
    div（idもclassも無し、course-format-<動的ID> が付く）  ← 動的IDなのでセレクタに使わない
      ul[data-for="course_sectionlist"].weeks   ← セクション一覧
        li#section-0.section.course-section[data-number="0"]   （トピック0 = 「一般」）
        li#section-1.section.course-section[data-number="1"]
        li#section-2.section.course-section[data-number="2"]
        ...
```

セレクタ：`#region-main div.course-content > div > ul[data-for="course_sectionlist"]`（1件）

`ul` のクラス名（`weeks`）はコースフォーマット依存だが、`data-for="course_sectionlist"` はコア共通の属性なので、フォーマットが変わってもこちらの方が安定する（他フォーマットでの実機確認はできていない。上記「採取に使ったコース」の注記を参照）。

**注意：`ul[data-for="course_sectionlist"]` は祖先を絞らないと2件ヒットすることがある。** コンパイラ(2026年度) のあるセクションの概要文（`summarytext`）内に、Moodle のセクション一覧を模した HTML の断片が教員によって貼り付けられており、同じ `data-for` 属性を持つ `<ul>` が紛れ込んでいた。`div.course-content > div > ul[...]` のように直下の子で辿ると1件に絞れる。

各 `li.section.course-section` は `data-number`（0始まりの表示順）、`data-id`（セクションの内部ID）、`data-sectionname` を持つ。**DOM上の並び順と `data-number` の昇順は一致している。**

### 評定へのリンク

セレクタ：`.secondary-navigation li[data-key="grades"] a`（1件）

コース名の下にあるタブ列（`コース | 参加者 | 評定 | コンピテンシ | ...`）の中の1つ。

```html
<div class="secondary-navigation d-print-none">
  <nav class="moremenu navigation observed">
    <ul class="nav more-nav nav-tabs" role="menubar">
      <li data-key="coursehome" class="nav-item"><a class="nav-link active active_tree_node" href="...">コース</a></li>
      <li data-key="grades" class="nav-item">
        <a role="menuitem" class="nav-link" href="https://lms-m41.mie-u.ac.jp/grade/report/index.php?id=<courseid>">評定</a>
      </li>
      <li data-key="competencies" class="nav-item">...</li>
    </ul>
  </nav>
</div>
```

**注意：`a[href*="/grade/report/"]` だけで絞ると2件ヒットする。** もう1件はページ最上部のグローバルナビゲーション（`nav.navbar`）内、「コース」ドロップダウンのカルーセル（`.carousel-item`）に入っている評定リンクで、これはコースページ固有の要素ではない。`.secondary-navigation` で絞るとタブの1件だけに特定できる。

リンク先は `/grade/report/index.php?id=<courseid>` で、コースページとは別ページ。埋め込み表示するには別途 fetch するか iframe にする必要がある。

## セクションタイトルのリンク

[`section-title-link.md`](../features/course-page/section-title-link.md) が対象にする要素。

セレクタ：`#region-main .sectionname`（コースのセクション数だけヒット。例：コンパイラ(2026年度) で17件）

```html
<h3 class="h4 sectionname course-content-item d-flex align-self-stretch align-items-center mb-0"
    id="sectionid-<内部ID>-title" data-for="section_title" data-id="<内部ID>" data-number="1">
  <a href="https://lms-m41.mie-u.ac.jp/course/section.php?id=<内部ID>">第1回(4/16)</a>
</h3>
```

トピック0（`data-number="0"`、通常「一般」という名前）を含め、**すべてのセクションタイトルがリンクになっている**。リンク先は `course/section.php?id=<セクションの内部ID>`（`course/view.php` ではない）。`id` 属性（`sectionid-<内部ID>-title`）は内部IDを含むため、個別のセクションを指す固定セレクタとしては使えるが、コースをまたいで同じ値にはならない。

## セクション内アクティビティの構造

[`export-markdown.md`](../features/course-page/export-markdown.md) が対象にする要素。

すべての活動は `li.activity` を共通の親に持ち、`modtype_<種別>` というクラスで種別を判別できる（例：`modtype_resource`、`modtype_assign`）。採取できた種別は次の通り。

| 種別 | クラス | リンク | 特記事項 |
|---|---|---|---|
| 資料（ファイル） | `modtype_resource` | `/mod/resource/view.php?id=<id>` | 詳細は次節「ファイルリンクと拡張子判定」 |
| 課題 | `modtype_assign` | `/mod/assign/view.php?id=<id>` | 開始・期限日時が `[data-region="activity-dates"]` に入る（後述） |
| URL | `modtype_url` | `/mod/url/view.php?id=<id>` | 外部リンク |
| フォーラム | `modtype_forum` | `/mod/forum/view.php?id=<id>` | アナウンスメント用に1件は既定で存在 |
| ページ | `modtype_page` | `/mod/page/view.php?id=<id>` | Moodle 内で完結するテキストページ |
| ラベル | `modtype_label` | リンクなし | 下記参照 |
| 小テスト | `modtype_quiz` | 未詳細採取 | 一覧に存在するのみ確認 |
| autoattend（出欠） | `modtype_autoattendmod` | `/mod/autoattendmod/view.php?id=<id>` | 「autoattend を含むコースについて」節を参照 |

**フォルダ（`modtype_folder`）は今回のコースでは見つからなかった。** 複数ファイルをまとめた資料がある場合に使われる形式だが、採取したコースには無かったため未確認。

### リンクを持つ活動の共通構造（資料の例）

```html
<li class="activity activity-wrapper resource modtype_resource hasinfo" id="module-<id>" data-for="cmitem" data-id="<id>">
  <div class="activity-item focus-control" data-activityname="第1回講義資料(PowerPoint)" data-region="activity-card">
    <div class="activity-grid">
      <div class="activity-icon activityiconcontainer smaller content courseicon">
        <img src=".../theme/image.php/boost/core/<rev>/f/powerpoint" class="activityicon" data-region="activity-icon">
      </div>
      <div class="activity-name-area activity-instance d-flex flex-column">
        <div class="activitytitle modtype_resource position-relative">
          <div class="activityname">
            <a href="https://lms-m41.mie-u.ac.jp/mod/resource/view.php?id=<id>" class="aalink stretched-link">
              第1回講義資料(PowerPoint)&nbsp;ファイル
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</li>
```

リンクテキスト（`.activityname a` の textContent）には、教員が付けた活動名に続けて種別のラベル（「ファイル」「フォーラム」等）がアクセシビリティ用に付与されている。表示用に使う場合はこのラベル部分を取り除く必要がある。

### 課題の日時表示

```html
<div data-region="activity-dates" class="activity-dates me-sm-2">
  <div><strong>開始:</strong> 2026年 04月 10日(金曜日) 00:00</div>
  <div><strong>期限:</strong> 2026年 04月 10日(金曜日) 23:59</div>
</div>
```

一覧表示の時点で開始日時・期限が `li.activity.modtype_assign` の中に既に入っている（活動ページへ遷移しなくても取得できる）。

### ラベルの構造

ラベルはリンクを持たず、本文がそのまま `li.activity` の中に入る。

セレクタ（本文）：`li.activity.modtype_label .activity-altcontent`

```html
<li class="activity activity-wrapper label modtype_label hasinfo">
  <div class="activity-item focus-control activityinline" data-activityname=" " data-region="activity-card">
    <div class="activity-grid noname-grid">
      <div class="activity-altcontent text-break">
        <div class="no-overflow"><div class="no-overflow">
          <!-- 本文のHTML（段落・リンク等）がそのまま入る -->
        </div></div>
      </div>
    </div>
  </div>
</li>
```

本文が空（半角スペースのみ）のラベルも多く存在する（レイアウト調整用に使われている）。書き出し対象にする場合は空文字列の除外が必要になる。

### セクションが折りたたまれていても中身は DOM に存在する（遅延読み込みではない）

セクション本文を包む `div.course-content-item-content` は Bootstrap の collapse コンポーネントで、折りたたみは `show` クラスの有無と `display:none` で行われているだけで、**中身の要素は折りたたみ時も DOM から削除されない。** 実際に `#section-1` の開閉トグルをクリックして確認した。

| 状態 | クラス | 活動要素の数 |
|---|---|---|
| 展開時 | `content course-content-item-content collapse show` | 2 |
| 折りたたみ時 | `content course-content-item-content collapse`（`display: none`） | 2（変化なし） |

したがって [`export-markdown.md`](../features/course-page/export-markdown.md) も [`bulk-download.md`](../features/course-page/bulk-download.md) も、セクションを事前に展開させる操作は不要。ページ読み込み時点で `querySelectorAll` すれば全セクションの活動を取得できる。

## ファイルリンクと拡張子判定

[`bulk-download.md`](../features/course-page/bulk-download.md) が対象にする要素。

資料（`modtype_resource`）のリンク先 `/mod/resource/view.php?id=<id>` は中間ページで、**リンクのテキストやDOM上のどこにもファイル名・拡張子は出てこない。** 活動アイコンの画像（`img.activityicon` の `src`）はファイル種別ごとの汎用アイコン（例：`f/powerpoint`、`f/pdf`）であり、種別の見分けはつくが実際の拡張子とは限らない（例：`f/powerpoint` は `.ppt` と `.pptx` の両方に使われうる）。

**実際の拡張子は、`/mod/resource/view.php?id=<id>` へのリクエストがリダイレクトした先の URL からしか分からない。** リダイレクト先は `/pluginfile.php/<contextid>/mod_resource/content/<revision>/<元のファイル名>` で、ここに本来のファイル名と拡張子がそのまま入っている。

採取例（`fetch(url, {redirect: 'follow'})` の `response.url` で確認）：

| 資料名 | リダイレクト先の末尾 |
|---|---|
| 第1回講義資料(PowerPoint) | `Compiler2026_01.pptx` |
| 講義スライド | `2-2026年度暗号と情報セキュリティ-ファイヤーウォールv1.pdf`（URLエンコードされた状態で入る） |

**決めごとが必要な点：** 拡張子の判定にはファイルごとに1回のHTTPリクエスト（リダイレクト追跡）が要る。ファイル数が多いコースでは一括ダウンロード前にこの往復が発生する。DOM だけで完結する軽量な判定方法は無い。

## セクションの並び順

[`reverse-sections.md`](../features/course-page/reverse-sections.md) が対象にする要素。

「コース内容の構造と評定リンク」節で示した `ul[data-for="course_sectionlist"]` が、セクションの並び順を決めているコンテナそのもの。`li.section.course-section` が DOM に書かれている順（= `data-number` の昇順）がそのまま画面の表示順になる。逆転させるには、この `ul` の子要素を並べ替えるか、CSS の `flex-direction: column-reverse`（`display: flex` 化が前提）等で対応することになる。

トピック0（`data-number="0"`、「一般」）も同じ `ul` の最初の子として並ぶため、逆転の対象に含めるかどうかは実装側の決めごとになる。

## autoattend を含むコースについて

autoattend が設置されたコースには、通常の活動一覧とは別に、右側のブロックドロワーに「自動出欠ブロック」が追加で表示される。**出席リンクと出席統計は別々の場所にある。**

### 出席リンク（autoattend-button.md）

出席（出欠確認）へのリンクは2箇所にある。どちらも構造は通常の活動リンクと同じで、特別なマークアップは無い。

1. **コース内容のアクティビティとして**（セクション内、他の資料等と同列）

   セレクタ：`#region-main li.activity.modtype_autoattendmod`（1件）

   ```html
   <li class="activity activity-wrapper autoattendmod modtype_autoattendmod">
     <div class="activity-item focus-control" data-activityname="出欠確認">
       <div class="activity-icon activityiconcontainer smaller other courseicon">
         <img src=".../theme/image.php/boost/autoattendmod/<rev>/monologo">
       </div>
       <div class="activityname">
         <a href="https://lms-m41.mie-u.ac.jp/mod/autoattendmod/view.php?id=<id>" class="aalink stretched-link">
           出欠確認&nbsp;自動出欠
         </a>
       </div>
     </div>
   </li>
   ```

2. **コースインデックス内**（左のドロワー、セクションツリーの1項目として）

   セレクタ：`#theme_boost-drawers-courseindex a.courseindex-link[href*="autoattend"]`（1件）。クラス・親要素は他のコースインデックス項目（資料や課題へのリンク）と同じ `courseindex-item` 構造。

**コースページ内では完結しない。** `/mod/autoattendmod/view.php?id=<id>` にリクエストすると、`fetch(url, {redirect:'follow'})` で確認した限り `/blocks/autoattend/index.php?course=<courseid>` へHTTPリダイレクトされる。これは完全に別のページ（コースページの一部ではない、独立した `page-blocks-autoattend-index` ページ）で、埋め込み表示するには別途取得が要る。

今回アクセスした時点（進行中の出席受付セッションが無い状態）では、遷移先は出席コードの入力フォームではなく、後述する「本人の出席状況を表示する画面」だった（`<form name="updateuserinfo">` は「戻る」ボタンのみを持つフォームで、出席コード入力欄は無かった）。**出席受付中に開いた場合の画面（コード入力フォームが出るかどうか）は未確認。** 授業時間外にしか採取できなかったため、実装前に授業時間中の画面を確認するか、担当者に確認する必要がある。

### 出席数・出席率（autoattend-stats.md）

**コースページ自体に、常時表示のブロックとして既に存在する。** 別ページ（出欠確認ページ側）に行かなくても、コースページの右側ブロックドロワーに表示されている。

セレクタ：`.block_autoattend`（1件）。配置場所は `#theme_boost-drawers-blocks`（右の「ブロック」ドロワー）内の `aside#block-region-side-pre`。ドロワーを開かないと画面には見えないが、DOM には常に存在する。

```html
<section id="inst<動的ID>" class="block_autoattend block card mb-3">
  <div class="card-body p-3">
    <div class="d-flex"><h3 class="h5 card-title">自動出欠ブロック</h3></div>
    <div class="card-text content mt-3">
      クラス: クラスなし<br>
      出席: &lt;回数&gt;<br>
      遅刻: &lt;回数&gt;<br>
      早退: &lt;回数&gt;<br>
      欠席: &lt;回数&gt;<br>
      出席率: &lt;割合&gt; %<br>
      出席点: &lt;獲得点&gt; / &lt;満点&gt;<br>
      得点率: &lt;割合&gt; %<br>
      <a href="https://lms-m41.mie-u.ac.jp/blocks/autoattend/index.php?course=<courseid>">詳細 ...</a>
      <div class="footer">
        <hr>
        <a href="..." target="_blank">アンケート</a><br>
        <a href="..." target="_blank"><i>Autoattend 2.7.5</i></a>
      </div>
    </div>
  </div>
</section>
```

`id="inst<動的ID>"` はブロックインスタンスごとに変わるので使わない。カード内のテキストは `<br>` 区切りの1つの `div.card-text` で、項目ごとに独立した要素には分かれていない（「出席: 10」のような文字列をテキストベースでパースする必要がある）。

数値は「出席」「遅刻」「早退」「欠席」「出席率」「出席点」（獲得点 / 満点）「得点率」の7項目。**この7項目だけで [`autoattend-stats.md`](../features/course-page/autoattend-stats.md) の要件（出席回数・出席率の常時表示）は満たせる。**

参考として、「詳細 ...」のリンク先 `/blocks/autoattend/index.php?course=<courseid>` は同じ数値に加えて、回ごとの出欠ログ（日付・時刻・出欠・接続元等）を持つ `table.generaltable` を含む個人別のページ（`[プロファイル] [出席点] [印刷画面]` のタブ付き）。氏名・学籍番号などの個人情報も表示されるページなので、採取した実データはこのファイルには残していない。

## 気付いた注意点

- **モバイル表示は確認できなかった。** [`home.md`](./home.md) と同じ環境上の制約で、`resize_window` でウィンドウサイズを変えても `window.innerWidth` が変化しない（1400 に固定）。
- **`ul[data-for="course_sectionlist"]` は祖先を絞らないと2件ヒットすることがある。** 教員が貼り付けたコンテンツの中に、たまたま同じ属性を持つ `<ul>` が紛れ込んでいたため（「コース内容の構造と評定リンク」節を参照）。他のコースでも起こりうる前提でセレクタを書く必要がある。
- **`a[href*="/grade/report/"]` は2件ヒットする。** グローバルナビゲーションのコースドロップダウンと、コースページのセカンダリタブの両方に評定リンクがある。コースページ固有の要素を指すなら `.secondary-navigation` で絞る。
- **autoattend は珍しい機能ではない。** 一般コースの採取用に、autoattend を含まないことを個別に確認したコースを選ぶ必要があった。
- **資料の拡張子はDOMだけでは分からない。** `/mod/resource/view.php` へのリダイレクトを追跡しないと実際のファイル名・拡張子が得られない（「ファイルリンクと拡張子判定」節を参照）。
- **コースフォーマットは format-weeks しか確認できていない。** format-topics のコースは自己登録が必要で中身にアクセスできなかった。
- **autoattend の出席受付中の画面は未確認。** 授業時間外にしかアクセスできず、コード入力フォームの構造は採取できていない。
