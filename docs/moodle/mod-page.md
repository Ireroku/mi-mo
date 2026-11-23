# ページ資料（mod_page）

対象URL: `/mod/page/view.php?id=<id>`

必要とする機能: [ページ資料の本文を保存](../features/course-page/page-save.md)

採取したコースは2つ。スライドを画像で並べるコース（`/course/view.php?id=1881`、6ページ）と、本文を文章で書くコース（`/course/view.php?id=4736`、69ページ）。

## コースページ側の入口

```text
li.activity.modtype_page
  .activityname a[href*="/mod/page/view.php?id="]   ページへのリンク
    .instancename                                    ページ名。末尾に視覚的に隠した「ページ」の語が付く
```

- 本文はコースページには出ない。採取した2コースでは、説明文をコースページへ出す設定のページは0件
- ページ名の取り方は、他の活動と同じ。[`course-page.md`](./course-page.md) の活動の共通構造に従う

## ページ本体

`body#page-mod-page-view` の中。

```text
#region-main
  div.box.py-3.generalbox.center.clearfix   本文の入れ物。1件
    div.no-overflow                         本文。教員がエディタで書いた HTML がそのまま入る
  .modified                                 「最終更新日時: 2026年 09月 11日(金曜日) 09:50」
```

- body は `id="page-mod-page-view"` で、クラスに `path-mod-page pagelayout-incourse cm-type-page cmid-<cmid>` を持つ。`pagelayout-incourse` は他の活動の画面と共有する
- 本文のセレクタは `#region-main .generalbox > .no-overflow`。採取した10ページすべてで1件
- ページの見出しは `#region-main h2` か `.page-header-headings h1` のどちらかに出る。どちらに出るかは個別に確かめていない。ページ名はコースページ側の `.instancename` から取る方が確実

## 完了の帯

完了の条件があるページでは、見出しと本文の間に灰色の帯が出る。

```text
#region-main div.activity-header[data-for="page-activity-header"]   灰色の帯（背景 #f8f9fa、角丸）。display: block
  span.sr-only                                                     「完了要件」
  div.activity-information[data-region="activity-information"][data-activityname="<ページ名>"]
    div.completion-info[data-region="completion-info"]             上下 1rem の余白と、下線（border-bottom）
      button.btn.btn-outline-secondary.btn-sm.text-nowrap[data-action="toggle-manual-completion"]   「完了マークする」
```

- Moodle の CSS は `.path-mod .activity-header:not(:empty) > div:last-child > div:last-child { border-bottom: 0 }` で、帯の最後の要素の中の下線を消している。帯の末尾へ要素を足すと、この規則が外れて下線が出る
- 完了の条件が無いページで帯が出るかは確かめていない

## 本文に現れる要素

教員が自由に書くため、決まった形は無い。採取で見つかったものは次の通り。

| ページの型 | 現れたタグ | 備考 |
|---|---|---|
| スライドを並べる | `div` `p` `img` | 文字は0字。1ページに画像が21〜30枚 |
| 文章 | `p` `br` `span` `ul` `li` `a` `pre` `blockquote` `hr` `img` | 最長で8337字、画像12枚 |
| 音声つき | `audio` > `source`、`a` | 音声ファイルは `pluginfile.php` を指す |

`iframe` は採取した範囲には無い。

## 埋め込まれたファイルの URL

画像・音声・添付ファイルは、どれも同じ形の URL を持つ。

```text
/pluginfile.php/<contextid>/mod_page/content/<revision>/<ファイル名>
```

- 同じオリジンにあり、ログイン中の Cookie で取得できる
- 末尾が元のファイル名で、拡張子もそのまま入る（採取例は `.PNG`）
- `img` の `src`、`source` の `src`、`a` の `href` に現れる

画像は、本文へ `data:image/png;base64,…` の形で直に入っている場合もある（`/mod/page/view.php?id=161243` の4枚。1枚で数万〜十数万バイト）。ファイルとしては Moodle に置かれていない。

## 注意点

- **ページを取得すると、Moodle はそのページを「閲覧済み」として記録する。** 活動完了の条件が「閲覧」のページは、取得した時点で完了になる。`fetch` でも同じ
- **本文の HTML は教員が書いたもので、構造を仮定できない。** `span` に直接 `style` を当てた装飾や、空の `p` が混じる
