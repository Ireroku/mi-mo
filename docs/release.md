# リリース

版の番号の付け方と、ストアへ出すまでの手順。ストアの欄へ写す文は [`store/`](../store/) に置く。

## 版の番号

`package.json` の `version` に、リリースする日を `年.月.日` で書く。月と日は 0 で埋めない（`2026.11.19`、`2027.1.5`）。WXT がこの値を manifest の `version` へ写す。

同じ日に2回目を出す場合は、末尾に `.1` を足し、3回目は `.2` にする（`2026.11.19.1`）。

0 で埋めないのは、Chrome と Firefox の manifest が、0 で始まる数（`01`）を版の番号として受け付けないため。

## 手順

1. `package.json` の `version` を、上の決まりで書き換える
2. [`verify.md`](./verify.md) の確認を通し、版の番号だけをメッセージにしてコミットする（`git commit -m "2026.11.19"`）
3. 版と同じ名前の注釈付きタグ（`git tag -a v2026.11.19`）を付け、注釈に[変更の一覧](#変更の一覧)を書く。main とタグを GitHub へ push する
4. GitHub Actions（`.github/workflows/release.yml`）が、タグと `version` が一致することを確かめ、単体テストを通し、Chrome 向けと Firefox 向けの ZIP を作って GitHub の Release へ添える。タグの注釈が Release の本文になる
5. Release の ZIP を、Chrome Web Store と Firefox Add-ons へ上げる。Firefox には、`-sources.zip` を審査用のソースコードとして添える

## 変更の一覧

タグの注釈には、利用者から見た変更を1行に1つずつ書く。行の頭に種類を付ける。

```
- [追加] 設定のリセット機能を追加
- [改善] 再読み込み時にメニューがチラつくのを軽減
- [修正] 複数の意図通りでない表示を調整
- [変更] デフォルトの設定を変更
```

種類は `[追加]`（新しい機能）、`[改善]`（既存の機能が良くなった）、`[修正]`（不具合を直した）、`[変更]`（挙動や既定値が変わった）の4つ。`-a` を付けずに軽量タグにすると、注釈の代わりにコミットの文が本文になる。

## ストアへ写す文

| ファイル | 中身 | 写す先 |
|---|---|---|
| [`store/description.md`](../store/description.md) | 名前、短い説明、詳しい説明 | 両方のストアの掲載情報 |
| [`store/permissions.md`](../store/permissions.md) | 単一用途と、権限ごとの理由 | Chrome Web Store の「プライバシーへの取り組み」、Firefox の審査向けのメモ |
| [`store/privacy.md`](../store/privacy.md) | プライバシーポリシー | 両方のストアのプライバシーポリシーの欄 |

権限を足した時と、機能を足して説明文と食い違った時は、同じ変更の中でこれらの文も直す。

## 決めごと

- **版の番号を日付にする。** 利用者にとって意味があるのは「いつの版か」で、互換性の区切りを番号で伝える相手がいない
- **Release の本文はタグの注釈から作る。** GitHub の自動生成は PR しか拾わず、main へ直接コミットする運用では1行しか出ない。本文をタグに書けば、Release の画面で後から書き直す手間と書き忘れがなくなる
- **Firefox の審査用の sources の ZIP には、ビルドに使うものだけを入れる。** 審査ではソースからビルドし直し、提出した拡張機能と同じになるかを確かめる。`AGENTS.md`・`CLAUDE.md`・`docs/`・`store/`・`scripts/` はビルドに使わないため、[wxt.config.ts](../wxt.config.ts) の `zip.excludeSources` で外す。WXT は `.gitignore` を見ないため、外さないと手元で作った ZIP に `docs/AGENTS/` の作業メモまで入る。sources の ZIP だけを展開してビルドした出力が、普段のビルドと一致することを確かめてある
- **Firefox Add-ons の自動検査に出る「Unsafe assignment to innerHTML」の警告は残す。** 出どころは Svelte の runtime で、コンポーネントの HTML の型紙を `<template>` へ入れる処理にある。入る値はビルドの時に決まった固定の HTML で、ページや利用者の入力は入らない。Svelte の `fragments: 'tree'` にすれば消えるが、画面の組み立てが遅くなり、両方のブラウザで画面を確かめ直す手間もかかる。警告があっても審査には出せる。審査向けのメモには [`store/permissions.md`](../store/permissions.md) の「自動検査の警告」を写す
- **shadcn の `calendar` から、年と月のドロップダウンを外す。** bits-ui の `MonthSelect` と `YearSelect` が Svelte の `customizable_select` を呼び、その中の innerHTML も上の警告になる。mi-mo は見出しを文字で出すだけでドロップダウンを使わないため、外して警告を1つ減らした
- **ZIP は GitHub Actions で作り、ストアへは手で上げる。** ストアの API の鍵を GitHub に預けずに済む。自動で上げる場合は WXT の `wxt submit` を使う
