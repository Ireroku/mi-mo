# ストアの説明文

Chrome Web Store と Firefox Add-ons の掲載ページへ写す文。ストアの欄は Markdown を解釈しないため、見出しの下の本文だけを貼る。

## 名前

mi-mo

## 短い説明

[`package.json`](../package.json) の `description` を写す。WXT がこの値を manifest の `description` へ写し、Chrome Web Store は manifest の値を短い説明として出す。Firefox Add-ons の概要の欄へも同じ文を貼る。

## 詳しい説明

三重大学 Moodle 4（lms-m41.mie-u.ac.jp）に、いくつかの機能を追加する拡張機能です。

【主な機能】
ホーム
・今週の時間割を表示できます。休講日と授業振替日の設定が可能
・一部の要素を非表示に

上部メニュー
・不要なメニュー項目を非表示に

コースページ
・資料をまとめて保存。ページ資料と課題の本文もMarkdownで保存
・セクションの内容をMarkdownで書き出し
・出席ボタンを表示
・出席率を表示


【時間割設定】
時間割をjsonで読み込むことができます。LLMに時間割を作成してもらうと良いと思います。
詳細はGitHubのREADMEを参照してください。


GitHub: https://github.com/Ireroku/mi-mo

注：本ソフトウェアは、三重大学・Moodle HQ とは一切の関係のない非公式のソフトウェアです。