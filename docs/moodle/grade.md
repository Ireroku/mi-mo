# Moodle 評定ページ

評定ページ（`/grade/report/index.php?id=<courseid>`）の DOM 構造リファレンス。実画面から採取したもの。

このDOMを参照する機能は [`../features/course-page/grade-inline.md`](../features/course-page/grade-inline.md)。

## 採取に使ったコース

| コース | id | 用途 |
|---|---|---|
| ソフトウェア工学（2026） | 4743 | 評定項目・得点・フィードバックが入っている。主な採取対象 |
| コンパイラ(2026年度) | 2163 | 評定項目が0件のコース。空の状態の確認用 |
| 暗号と情報セキュリティ (2026) | 1785 | 評定項目1件のコースとして確認 |
| システム工学 2026 | 5681 | 評定項目5件のコースとして確認 |

`../moodle/course-page.md` の採取に使ったコースと同じ4件。いずれも単一カテゴリで、サブカテゴリの小計行を持つコースは見つからなかった（未確認）。

## URLと遷移

`/grade/report/index.php?id=<courseid>` を学生アカウントで開くと、次のURLへHTTPリダイレクトされる。

```
/grade/report/user/index.php?id=<courseid>
```

4件すべてのコースで同じ遷移を確認した。「評定の概要」（`/grade/report/overview/`）へのリダイレクトは発生しなかった。教員権限で開いた場合の挙動（グレーダーレポートがそのまま表示されるか等）は未確認。

ページ種別の判定に使える body クラス：`path-grade path-grade-report path-grade-report-user pagelayout-report`。

## 評定表全体を指すセレクタ

セレクタ：`#region-main table.user-grade`（1件）

```
#region-main
  table.generaltable.boxaligncenter.user-grade
    tr（ヘッダー行）
    tr（コース名の行）
    tr.cat_<カテゴリID>.spacer（区切り、中身なし）
    tr.cat_<カテゴリID>（評定項目の行が並ぶ）
    ...
    tr.cat_<カテゴリID>.lastrow（コース合計の行）
```

`user-grade` はコア共通のクラス名で、コースごとに変わらない。`cat_<カテゴリID>` の数値部分はコース・カテゴリ依存なのでセレクタには使わない。

## ヘッダー行（列の並び）

セレクタ：`table.user-grade tr:first-child th`（7件、今回採取した4コースすべてで共通）

| 列クラス | 見出し |
|---|---|
| `column-itemname` | 評定項目 |
| `column-weight` | 計算済み加重 |
| `column-grade` | 評点 |
| `column-range` | 範囲 |
| `column-percentage` | パーセンテージ |
| `column-feedback` | フィードバック |
| `column-contributiontocoursetotal` | コース合計への寄与 |

各データ行のセルも同じ `column-*` クラスを持つため、列の対応はクラス名で取れる（列の並び順に依存しなくてよい）。

## 評定項目1件を表す行

セレクタ：`table.user-grade th.level2`（コースの評定項目数だけヒット。ソフトウェア工学（2026）で34件）

評定項目の行は `<tr class="cat_<カテゴリID>">` で、1列目が `<th class="level2 item ... column-itemname ...">`、残り6列が `<td>`。採取例（ソフトウェア工学（2026）、自動出欠の行）：

```html
<tr class="cat_4298">
  <th class="level2 item b1b column-itemname cell c0">
    <a href="https://lms-m41.mie-u.ac.jp/mod/autoattendmod/view.php?id=160596">
      自動出欠<span class="...">autoattendmod</span>
    </a>
  </th>
  <td class="level2 item b1b itemcenter column-weight cell c1"
      headers="cat_4298_1334 row_33459_1334 weight1334">-</td>
  <td class="level2 item b1b itemcenter column-grade cell c2"
      headers="cat_4298_1334 row_33459_1334 grade1334">13.00</td>
  <td class="level2 item b1b itemcenter column-range cell c3"
      headers="cat_4298_1334 row_33459_1334 range1334">0–26</td>
  <td class="level2 item b1b itemcenter column-percentage cell c4"
      headers="cat_4298_1334 row_33459_1334 percentage1334">50.00 %</td>
  <td class="level2 item b1b feedbacktext column-feedback cell c5"
      headers="cat_4298_1334 row_33459_1334 feedback1334"></td>
  <td class="level2 item b1b itemcenter column-contributiontocoursetotal cell c6 lastcol"
      headers="cat_4298_1334 row_33459_1334 contributiontocoursetotal1334">-</td>
</tr>
```

`headers` 属性の数値（例：`1334`）は評定項目の内部IDで、コースが変われば値も変わる。セレクタには使わない。

読み取れる値：

| 値 | 取得元 | 備考 |
|---|---|---|
| 項目名 | `th.column-itemname` の textContent | 種別ラベル（`autoattendmod` 等）が続けて入る。コースページの活動名と同様、表示用には整形が要る |
| 得点 | `td.column-grade` の textContent | 未入力時は `-`（下記「評定が未入力の場合」参照） |
| 満点・範囲 | `td.column-range` の textContent | `0–26` のように「最小–最大」がハイフンでなく `–`（en dash）区切りで1つのセルに入る。満点だけを取り出すには分割が要る |
| パーセンテージ | `td.column-percentage` の textContent | `50.00 %` のように単位付きの文字列。数値だけを使うには変換が要る |
| フィードバック | `td.column-feedback` の textContent | 空文字列のことが多い。採取例は「評定が未入力でもフィードバックだけ入る場合」を参照 |
| 加重・コース合計への寄与 | `td.column-weight` / `td.column-contributiontocoursetotal` | 今回採取した4コースはすべて `-` だった。加重設定を使うコースでの表示は未確認 |

## 行と活動を紐付ける手段

**`th.column-itemname` 内の `<a>` のリンク先に `cmid` が含まれ、コースページの `li#module-<cmid>` と一致する。**

評定表のリンク：

```
https://lms-m41.mie-u.ac.jp/mod/<種別>/view.php?id=<cmid>
```

コースページの活動要素（`docs/moodle/course-page.md` 参照）：

```
<li class="activity activity-wrapper ... modtype_<種別>" id="module-<cmid>" data-id="<cmid>">
```

ソフトウェア工学（2026）で実際に突き合わせて確認した。

| 評定表の項目 | 評定表のリンク先 | コースページの `li#module-<cmid>` |
|---|---|---|
| 自動出欠 | `/mod/autoattendmod/view.php?id=160596` | `id="module-160596"`、`data-activityname="出欠確認"` |
| 今回の感想・質問・要望等 | `/mod/assign/view.php?id=160605` | `id="module-160605"`、`data-activityname="今回の感想・質問・要望等"` |
| 今回の感想・質問・要望等 | `/mod/assign/view.php?id=160618` | `id="module-160618"`、`data-activityname="今回の感想・質問・要望等"` |

`id` の数値（`cmid`）が両ページで完全に一致するため、文字列一致に頼らず確実に紐付けられる。

ソフトウェア工学（2026）の34件の評定項目（`th.level2`）は全件が `<a>` を持ち、リンクなしの項目は無かった（`document.querySelectorAll('table.user-grade th.level2 a').length` が `th.level2` の件数と一致することを確認）。手動で追加した評定項目（活動に紐付かない項目）がある場合にリンクが無くなるかどうかは、今回のコースには該当が無かったため未確認。

## 合計行・カテゴリ行の区別

評定項目の行（`th.level2`）と、カテゴリ名・合計を表す行（`th.level1`）はクラス名で区別できる。

セレクタ：`table.user-grade th.level1`（1コースあたり2件：カテゴリ見出し1件＋コース合計1件）

```html
<!-- カテゴリ見出し行（先頭） -->
<tr>
  <th class="level1 d1 b1b b1t category column-itemname cell c0 lastcol">
    ソフトウェア工学（2026）
  </th>
</tr>

<!-- コース合計行（末尾） -->
<tr class="cat_4298 lastrow">
  <th class="level1 d1 baggt b2b column-itemname cell c0">
    総計コース合計
  </th>
  <td class="level1 d1 baggt b2b itemcenter column-weight cell c1">-</td>
  <td class="level1 d1 baggt b2b itemcenter column-grade cell c2">-</td>
  <td class="level1 d1 baggt b2b itemcenter column-range cell c3">0–26</td>
  <td class="level1 d1 baggt b2b itemcenter column-percentage cell c4">-</td>
  <td class="level1 d1 baggt b2b feedbacktext column-feedback cell c5"></td>
  <td class="level1 d1 baggt b2b itemcenter column-contributiontocoursetotal cell c6 lastcol">-</td>
</tr>
```

カテゴリ見出し行は `th.category` を持ち、他の列（得点等）を持たない1セルだけの行。コース合計行は `th.baggt` を持ち、他の評定項目行と同じ7列構成で、項目名が「総計」＋カテゴリ名（採取例では「コース合計」）になる。`tr.lastrow` がコース合計の行に付くクラスで、これもコース合計行を特定する手がかりになる。

評定項目の行との区別：`th.level2` が評定項目、`th.level1` がカテゴリ見出し・合計。今回採取した4コースはいずれも単一カテゴリで、サブカテゴリの小計行（`level` がさらに深い階層）は現れなかったため、複数カテゴリのコースでの表示は未確認。

区切り行として `tr.cat_<カテゴリID>.spacer` も存在する（中身は空、レイアウト用）。

## 評定が未入力の場合

`td.column-grade` の textContent が `-` になる。同時に `column-weight`・`column-percentage`・`column-contributiontocoursetotal` も `-` になる。`column-range`（満点表示）は得点の有無に関わらず表示される。

**得点が未入力でもフィードバックだけ入っている場合がある。** ソフトウェア工学（2026）の「授業内課題」で確認した。

```html
<tr class="cat_4298">
  <th class="level2 item b1b column-itemname cell c0">課題授業内課題</th>
  <td class="... column-weight ...">-</td>
  <td class="... column-grade ...">-</td>
  <td class="... column-range ...">0–100</td>
  <td class="... column-percentage ...">-</td>
  <td class="... feedbacktext column-feedback ...">
    教員コメント（省略）
  </td>
  <td class="... column-contributiontocoursetotal ...">-</td>
</tr>
```

得点欄の `-` だけを「未提出」の判定に使うと、フィードバックが入っているのに得点が無い項目を見落とす。

## 気付いた注意点

- **`/grade/report/index.php` は学生アカウントでは `/grade/report/user/index.php` にリダイレクトされる。** 4コースすべてで確認した。評定表を fetch する場合はリダイレクト先の追跡が要る（`fetch(url, {redirect: 'follow'})` 等）か、最初から `/grade/report/user/index.php?id=<courseid>` を直接開く。
- **単一カテゴリのコースしか採取できなかった。** サブカテゴリを持つコースでの `th.level1` の階層表現（`level1` より深い階層が出るか等）は未確認。
- **手動追加の評定項目（活動に紐付かない項目）は今回のコースに存在せず、リンクの有無を確認できなかった。** 34件の評定項目は全件が `/mod/<種別>/view.php?id=<cmid>` へのリンクを持っていた。
- **加重（`column-weight`）とコース合計への寄与（`column-contributiontocoursetotal`）の実際の表示値は確認できなかった。** 今回採取した4コースはいずれも `-` のままだった。
