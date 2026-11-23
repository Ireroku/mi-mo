# 課題（mod_assign）

対象URL: `/mod/assign/view.php?id=<id>`

必要とする機能: [ページ資料の本文を保存](../features/course-page/page-save.md)（課題の画面の「資料を保存」）

採取した課題は3つ。開始と期限と説明のある課題（`id=224633`）、期限と説明があり提出済みの課題（`id=161248`）、期限と説明とファイルの種類の制限があり未提出の課題（`id=161249`）。

## 画面の判定

- body のクラスに `path-mod-assign pagelayout-incourse` を持つ。`pagelayout-incourse` は他の活動の画面と共有する
- 課題名は `.page-header-headings h1` に出る

## 説明と日付の帯

見出しの下に、ページ資料の画面（[`mod-page.md`](./mod-page.md)）と同じ灰色の帯が出る。

```text
#region-main div.activity-header[data-for="page-activity-header"]
  span.sr-only                                                    「完了要件」
  div.activity-information[data-region="activity-information"]
    div.completion-info[data-region="completion-info"]            完了の条件がある課題だけ
      button[data-action="toggle-manual-completion"]               「完了マークする」
    div.activity-dates[data-region="activity-dates"]
      div  <strong>開始:</strong> 2026年 10月 23日(金曜日) 12:00     開始日がある課題だけ
      div  <strong>期限:</strong> 2026年 11月 24日(火曜日) 00:00
  div.activity-description#intro                                  説明がある課題だけ
    div.box.generalbox > div.no-overflow                          説明。教員がエディタで書いた HTML
```

- 日付の見出し（`strong`）は、日本語の表示では「開始:」「期限:」。他の言語の表示は確かめていない
- 日付の文字列は `YYYY年 MM月 DD日(曜日) HH:MM` の形。時刻は24時間制
- 採取した3つの説明には、添付ファイルが無い。添付のある課題の形は確かめていない

## 提出の状況

帯の下に、提出の状況の表と、提出を操作するボタンが並ぶ。

```text
#region-main
  form[method="get"]  input[name="action"][value="editsubmission"]          「提出を編集する」または「提出を追加する」
  form[method="get"]  input[name="action"][value="removesubmissionconfirm"] 「提出を削除する」。提出済みの課題だけ
```

- どちらも GET のフォームで、押すと確認や編集の画面へ移るだけ。提出の変更・削除は、その先の画面で `sesskey` を付けた POST を送った時に起きる
- 採取した3つでは、`editsubmission` のフォームがどれにも出た。期限の過ぎた課題で出るかは確かめていない

## 提出できるファイルの種類

ファイルの種類の制限は、課題の画面には出ない。提出の編集の画面（`/mod/assign/view.php?id=<id>&action=editsubmission`）のファイルの欄の下にだけ出る。

```text
div.form-filetypes-descriptions
  ul
    li  PDFドキュメント <small>.pdf</small>
    li  オーディオファイル (WAV) <small>.wav</small>
```

- 拡張子は `.form-filetypes-descriptions li small` の文字列。採取した課題では、1つの `small` に拡張子が1つ入る
- 制限の無い課題での形は確かめていない
- 編集の画面を GET で開くだけでは、提出は変わらない。提出済みの課題で、開く前後の提出の状況・最終更新日時・ファイルが同じことを確認した

## 注意点

- **課題の画面を取得すると、Moodle はその課題を「閲覧済み」として記録する。** ページ資料と同じ
- **`sesskey` を付けた要求を送らない。** 提出・削除・完了の切り替えは、どれも `sesskey` を要求する。提出済みの課題を消すと元に戻せない
