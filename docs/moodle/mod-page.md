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

- 本文のセレクタは `#region-main .generalbox > .no-overflow`。採取した10ページすべてで1件
- ページの見出しは `#region-main h2` か `.page-header-headings h1` のどちらかに出る。どちらに出るかは個別に確かめていない。ページ名はコースページ側の `.instancename` から取る方が確実

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

## 注意点

- **ページを取得すると、Moodle はそのページを「閲覧済み」として記録する。** 活動完了の条件が「閲覧」のページは、取得した時点で完了になる。`fetch` でも同じ
- **本文の HTML は教員が書いたもので、構造を仮定できない。** `span` に直接 `style` を当てた装飾や、空の `p` が混じる
