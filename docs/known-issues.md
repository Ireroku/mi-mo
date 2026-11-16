# 既知の課題

実装済みの機能に残っている課題の一覧。着手する前にここを読み、直した項目はこの一覧から消す。機能が実装済みかどうかは、リポジトリ直下の [README.md](../README.md) だけが持つ。

各項目は「起きること」「場所」「直す方向」の順に書く。直す方向は提案で、確定した設計ではない。着手する時点で対応する [実装指示書](./impl/README.md) を先に更新する。

## 実機での確認が済んでいないもの

次の項目は型検査とビルドだけを通しており、実際の Moodle では確かめていない。確認の手順は [verify.md](./verify.md) にある。確かめた項目はこの表から消す。

| 対象 | 確かめること |
|---|---|
| 資料の一括保存・セクションの書き出し | Chrome では保存がエラーなく始まることを確認済み。残りは次の3点。保存されたファイルの名前と中身が正しいこと。保存を開始できない場合にボタンの文言が「保存に失敗しました」へ変わること。Firefox でも動くこと |
| 埋め込み表示の資料の保存 | 表示設定が「埋め込み」の資料で、HTML でなくファイル本体が保存されること。`redirect=1` で本体へ転送されることは `fetch` で確認済み |
| 時計の時限表示 | 設定画面の「時限表」を変えると、時計・カウントダウン・時間割のすべてに反映されること |
| カスタムフォント | 「本文のみ」で `#region-main` にだけ効き、上部メニューには効かないこと |
| `.ics` の書き出し | カレンダーへ取り込み、授業が日本時間の正しい時刻に入ること |
| マイコースの今日順 | コース一覧の再描画が繰り返されず、並びが落ち着くこと |
| 上部メニュー | モバイル表示（ドロワー）で項目の非表示と追加が効くこと |

## 信頼性

### MutationObserver を解除していない

- 起きること: 拡張機能の更新や無効化で content script が失効した後も、監視のコールバックが残る
- 場所: `src/features/myCourses/todayOrder.ts`、`src/features/myCourses/incrementalSearch.ts`、`src/features/coursePage/indexToggle.ts`
- 直す方向: 各 `init` 関数が `ContentScriptContext` を受け取り、`ctx.onInvalidated` で `disconnect` する。Svelte をマウントする機能は `onRemove` で既に片付けている

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

### navbar のマネージャーが style 要素を自前で作っている

- 起きること: style 要素の生成と差し替えの手順が `src/utils/styleSheet.ts` と重なる
- 場所: `src/features/menu/navbar/menu.manager.ts`
- 直す方向: `applyStyleSheet` へ委譲する。[`impl/utils/styleSheet.md`](./impl/utils/styleSheet.md) が共通の手順を持つ

### カウントダウンの粒度を切り替える閾値を設定できない

- 起きること: 秒刻み・分刻み・日数表示へ切り替わる残り時間（15分・24時間・7日）が固定値になっている
- 場所: `src/features/menu/countdownBadge.logic.ts` の `formatRemaining`
- 直す方向: `CountdownConfig` へ閾値を足し、[`impl/settings/menuFields.md`](./impl/settings/menuFields.md) のカウントダウン編集へ入力欄を足す

## 機能の不足

### フォルダの中身が一括保存の対象に入らない

- 起きること: 「資料を保存」が集めるのは資料（`modtype_resource`）だけで、フォルダ（`modtype_folder`）に置かれたファイルは保存されない
- 場所: `src/features/coursePage/bulkDownload.ts` の `collectResourceUrls`
- 直す方向: フォルダのページには、中身をまとめて ZIP で保存するボタンがある。その保存先（`/mod/folder/download_folder.php`）を一括保存の対象へ足す。URL モジュール（`modtype_url`）は外部の Web ページへのリンクで、ファイルではないため対象にしない

## 対応しない環境

- **Safari では資料の保存とセクションの書き出しが動かない。** `browser.downloads` が無いため。理由と差し替えの方針は [`impl/utils/download.md`](./impl/utils/download.md) にある
