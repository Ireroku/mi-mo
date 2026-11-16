# 既知の課題

実装済みの機能に残っている課題の一覧。着手する前にここを読み、直した項目はこの一覧から消す。機能が実装済みかどうかは、リポジトリ直下の [README.md](../README.md) だけが持つ。

各項目は「起きること」「場所」「直す方向」の順に書く。直す方向は提案で、確定した設計ではない。着手する時点で対応する [実装指示書](./impl/README.md) を先に更新する。

## 実機での確認が済んでいないもの

次の項目は型検査とビルドだけを通しており、実際の Moodle では確かめていない。確認の手順は [verify.md](./verify.md) にある。確かめた項目はこの表から消す。

| 対象 | 確かめること |
|---|---|
| 資料の保存・セクションの書き出し | Chrome では、資料・フォルダ・ページの保存と、説明文を含む書き出しを確認済み。残りは次の2点。保存を開始できない場合にボタンの文言が「保存に失敗しました」へ変わること。Firefox でも動くこと（フォルダ付きの保存名と、`data:` の URL の保存を含む） |
| 時計の時限表示 | 設定画面の「時限表」を変えると、時計・カウントダウン・時間割のすべてに反映されること |
| カスタムフォント | 「本文のみ」で `#region-main` にだけ効き、上部メニューには効かないこと |
| `.ics` の書き出し | カレンダーへ取り込み、授業が日本時間の正しい時刻に入ること |
| マイコースの今日順 | コース一覧の再描画が繰り返されず、並びが落ち着くこと |
| 上部メニュー | モバイル表示（ドロワー）で項目の非表示と追加が効くこと |

## 表示

### コースインデックスのトグルボタンが周りの見た目と揃っていない

- 起きること: ドロワー上部の「すべて閉じる」が、白い背景・角丸・影の付いたボタンで描かれ、Moodle のドロワーの中で浮いて見える。隣の閉じるボタン（×）は枠の無いアイコンになっている
- 場所: `src/features/coursePage/IndexToggle.svelte`。shadcn-svelte の `Button` を `variant="outline"` で使っている
- 直す方向: 枠と影の無い `variant="ghost"` にし、文字の代わりに開閉を表すアイコンを置く案がある。Moodle の配色に寄せる場合は、Shadow DOM の中で使う色を Moodle の CSS 変数から引く

### ページ資料の保存でダウンロードの表示が大量に出る

- 起きること: 画像を数十枚含むページを保存すると、ファイルの数だけブラウザのダウンロードの演出が走り、ダウンロード欄も埋まる
- 場所: `src/features/coursePage/pageSave.logic.ts` の `buildPageDownloads`。画像1枚を1件の保存として依頼している
- 直す方向: 1ページ、または1セクションを ZIP にまとめ、保存を1件にする。content script で画像を取得して圧縮し（[fflate](https://github.com/101arrowz/fflate) など）、Blob を background へ渡す経路を決める。`data:` の URL では大きさが足りないため、[`impl/utils/download.md`](./impl/utils/download.md) の契約も合わせて見直す。[`impl/coursePage/pageSave.md`](./impl/coursePage/pageSave.md) の「1ページを1フォルダにし、画像を別のファイルとして保存する」の決めごとを置き換える

### 折りたたんだセクションの書き出しで段落が繋がる

- 起きること: セクションを折りたたんだまま「書き出す」を押すと、説明文とラベルの段落の区切りが落ち、文章が1行に繋がる
- 場所: `src/features/coursePage/export.logic.ts` の `readText`。`innerText` は描画されていない要素に対して `textContent` と同じ結果を返す
- 直す方向: [ページ資料の保存](./impl/coursePage/pageSave.md) で Turndown を入れた後、説明文とラベルの変換も Turndown へ寄せる。描画の有無に左右されなくなる

## 信頼性

### 設定画面を2つ同時に開くと後から保存した側が勝つ

- 起きること: ポップアップと設定ページで同じグループの別の項目を変えると、先に保存した変更が消える場合がある
- 場所: `src/features/settings/types.ts` の `defineGroup` が作る `write`。読む・差し替える・書くの3手になっている
- 直す方向: 1つの画面の中では `SettingsPanel` が保存を直列化している。画面をまたぐ競合は、実際に困る利用が出るまで扱わない

### 日付をまたいでも表示が更新されない

- 起きること: ページを開いたまま日付が変わると、時間割の「今日」とマイコースの今日順が前日のまま残る
- 場所: `src/features/timetable/Timetable.svelte`、`src/features/myCourses/todayOrder.ts`
- 直す方向: ページを読み込み直すと直る。タブへ戻った時に日付を取り直す処理は、必要性が確かめられてから足す

## 保守性

### 自動テストが無い

- 起きること: 日程計算や書き出しの整形のような純粋な計算を、変更のたびに手で確かめることになる
- 場所: `*.logic.ts` の全般。特に `src/features/timetable/schedule.logic.ts`、`src/features/timetable/ics.ts`、`src/features/coursePage/export.logic.ts`
- 直す方向: Vitest を入れ、`*.logic.ts` の隣に `*.logic.test.ts` を置く。DOM に触れる部分は対象にしない

### カウントダウンの粒度を切り替える閾値を設定できない

- 起きること: 秒刻み・分刻み・日数表示へ切り替わる残り時間（15分・24時間・7日）が固定値になっている
- 場所: `src/features/menu/countdownBadge.logic.ts` の `formatRemaining`
- 直す方向: `CountdownConfig` へ閾値を足し、[`impl/settings/menuFields.md`](./impl/settings/menuFields.md) のカウントダウン編集へ入力欄を足す

## 対応しない環境

- **Safari では資料の保存とセクションの書き出しが動かない。** `browser.downloads` が無いため。理由と差し替えの方針は [`impl/utils/download.md`](./impl/utils/download.md) にある
