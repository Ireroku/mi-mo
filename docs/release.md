# リリース

版の番号の付け方と、ストアへ出すまでの手順。ストアの欄へ写す文は [`store/`](../store/) に置く。

## 版の番号

`package.json` の `version` に、リリースする日を `年.月.日` で書く。月と日は 0 で埋めない（`2026.11.19`、`2027.1.5`）。WXT がこの値を manifest の `version` へ写す。

同じ日に2回目を出す場合は、末尾に `.1` を足し、3回目は `.2` にする（`2026.11.19.1`）。

0 で埋めないのは、Chrome と Firefox の manifest が、0 で始まる数（`01`）を版の番号として受け付けないため。

## 手順

1. `package.json` の `version` を、上の決まりで書き換える
2. [`verify.md`](./verify.md) の確認を通し、`chore: release <版>` でコミットする
3. 版と同じ名前のタグ（`v2026.11.19`）を付け、GitHub へ push する
4. GitHub Actions（`.github/workflows/release.yml`）が、タグと `version` が一致することを確かめ、単体テストを通し、Chrome 向けと Firefox 向けの ZIP を作って GitHub の Release へ添える
5. Release の ZIP を、Chrome Web Store と Firefox Add-ons へ上げる。Firefox には、`-sources.zip` を審査用のソースコードとして添える

## ストアへ写す文

| ファイル | 中身 | 写す先 |
|---|---|---|
| [`store/description.md`](../store/description.md) | 名前、短い説明、詳しい説明 | 両方のストアの掲載情報 |
| [`store/permissions.md`](../store/permissions.md) | 単一用途と、権限ごとの理由 | Chrome Web Store の「プライバシーへの取り組み」、Firefox の審査向けのメモ |
| [`store/privacy.md`](../store/privacy.md) | プライバシーポリシー | 両方のストアのプライバシーポリシーの欄 |

権限を足した時と、機能を足して説明文と食い違った時は、同じ変更の中でこれらの文も直す。

## 決めごと

- **版の番号を日付にする。** 利用者にとって意味があるのは「いつの版か」で、互換性の区切りを番号で伝える相手がいない
- **ZIP は GitHub Actions で作り、ストアへは手で上げる。** ストアの API の鍵を GitHub に預けずに済む。自動で上げる場合は WXT の `wxt submit` を使う
