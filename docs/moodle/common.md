# Moodle 全ページ共通の要素

ページ種別を問わず出る要素のうち、上部のナビゲーションバー以外を置く。実画面から採取したもの。ナビゲーションバーは [`navbar.md`](./navbar.md) が持つ。

採取はコースページ（`/course/view.php?id=2163`）で行った。ページ種別ごとの有無は個別に確認していない。

## フローティングヒントボタン

[`floating-hint.md`](../features/ui/floating-hint.md) が隠す対象。

セレクタ：`#page-footer .btn-footer-popover`（1件）

画面右下に重なって出る円形のボタン。`fa-question` の「?」アイコンを持ち、押すとフッターの内容がポップオーバーで開く。

```html
<div id="page-wrapper" class="d-print-block">
  <div id="page" class="drawers show-drawer-left drag-container stateready">
    <footer id="page-footer" class="footer-popover bg-white">
      <div>
        <button class="btn btn-icon bg-secondary icon-no-margin btn-footer-popover"
                data-action="footer-popover" aria-label="フッタを表示する">
          <i class="icon fa fa-question fa-fw" aria-hidden="true"></i>
        </button>
      </div>
      <!-- ポップオーバーで開くフッターの中身が続く -->
    </footer>
  </div>
</div>
```

`position: fixed` が付くのはボタンだけで、親の `footer#page-footer` は通常のフローに置かれる。ボタンを隠すとポップオーバーを開く手段が無くなるため、`footer` ごと消す必要はない。

`data-action="footer-popover"` と `.btn-footer-popover` はどちらもこのボタンに固有。クラス側は採取時点でページ内に1件だった。

## 採取時点で固定表示だった要素

`position: fixed` の要素を数えると4件で、内訳は次の通り。ドロワーの開閉状態によって数は変わる。

| 要素 | セレクタ | 用途 |
|---|---|---|
| 上部メニュー | `nav.navbar.fixed-top` | [`navbar.md`](./navbar.md) の対象 |
| 左ドロワー | `#theme_boost-drawers-courseindex` | コースインデックス。コースページのみ |
| 右ドロワーの開閉ボタン | `.drawer-toggler.drawer-right-toggle` | ブロックドロワを開く |
| ヒントボタン | `#page-footer .btn-footer-popover` | 上記 |
