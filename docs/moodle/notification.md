# Moodle 通知

通知ドロップダウン（ナビゲーションメニューのベルアイコンから開く領域）と、通知全件ページ（`/message/output/popup/notifications.php`）のDOM構造リファレンス。実画面から採取したもの。

参照する仕様書は [`../features/ui/notification.md`](../features/ui/notification.md)。ベルアイコン自体と閉じた状態のポップオーバーは [`navbar.md`](./navbar.md) に既に採取済みのため、ここでは重複させず参照する。

採取時点で対象アカウントの通知は0件（未読・既読とも）だった。そのため通知1件分の要素構造は確認できていない。詳細は各節の「未確認」を参照。

## 通知ドロップダウン（ポップオーバー）について

### トリガー（ベルアイコン）

セレクタ：`#nav-notification-popover-container .popover-region-toggle`

閉じた状態のHTML全体（`aria-expanded="false"`、コンテナ側 `aria-hidden="true"`）は [`navbar.md`](./navbar.md#幅があるときはここが見える) に採取済み。[`ui/notification.md`](../features/ui/notification.md) が対象とするのは、このボタンをクリックして開くポップオーバーの中身。

### 開いた状態

セレクタ：`#nav-notification-popover-container .popover-region-container`

ベルアイコンを `element.click()` で操作すると、次の属性が変化する。

| 要素 | 属性 | 閉 | 開 |
|---|---|---|---|
| `.popover-region-toggle` | `aria-expanded` | `false` | `true` |
| `.popover-region-container` | `aria-hidden` | `true` | `false` |

開いた状態でも、対象アカウントの通知が0件のため中身の構造（ヘッダー・本文・フッター）は [`navbar.md`](./navbar.md) に採取済みの閉じた状態と同一だった。新たに現れた要素はない。

### 通知0件時の表示

セレクタ：`#nav-notification-popover-container [data-region="empty-message"]`

```html
<div class="all-notifications" data-region="all-notifications" role="log" aria-busy="false" aria-atomic="false" aria-relevant="additions"></div>
<div class="empty-message" tabindex="0" data-region="empty-message">あなたに通知はありません。</div>
```

`[data-region="all-notifications"]` が空（子要素0件）のとき、`[data-region="empty-message"]` が表示される。[`ui/notification.md`](../features/ui/notification.md) が余白調整の対象とする通知一覧は、この `[data-region="all-notifications"]` の子要素として並ぶ想定。

### 通知1件を表す要素（未確認）

対象アカウントに通知が1件も無いため、`[data-region="all-notifications"]` の子要素（個々の通知アイテム）の構造を採取できなかった。既読・既読のクラス名・属性の違いも確認できていない。推測では埋めない。

実装前に別アカウントで通知がある状態を確認するか、通知を発生させてから再採取する必要がある。

### すべて既読にするボタン

セレクタ：`#nav-notification-popover-container .mark-all-read-button`（`data-action="mark-all-read"`）

HTML全体は [`navbar.md`](./navbar.md) に採取済み。セレクタと存在は確認できたが、対象アカウントに未読が無いため、クリック後の実際の挙動（アイテムのクラス変化など）は未確認。

## 通知全件ページについて

セレクタ：`body.path-message-output-popup`

対象URL：`https://lms-m41.mie-u.ac.jp/message/output/popup/notifications.php`

### body クラス

```
format-site path-message path-message-output path-message-output-popup chrome dir-ltr lang-ja yui-skin-sam yui3-skin-sam lms-m41-mie-u-ac-jp pagelayout-admin course-1 context-14104 theme uses-drawers drawer-open-index jsenabled
```

### 構成

セレクタ：`[data-region="notification-area"]`（1件）

一覧（左ペイン）と詳細（右ペイン）の2ペイン構成。

```
div.notification-area[data-region="notification-area"]
  div.control-area[data-region="control-area"]: 通知一覧（左ペイン）
    div.header
    div.content[data-region="content"]: 通知アイテムが並ぶ場所（採取時点で空）
    div.empty-text: 0件時のメッセージ
  div.content-area[data-region="content-area"]: 選択した通知の詳細（右ペイン）
    div.toggle-mode > button[data-action="toggle-mode"]: 「戻る」ボタン（一覧⇔詳細の切り替え。狭幅時用と推測されるが未確認）
    div.header[data-region="header"]
    div.content[data-region="content"]: 詳細本文が入る場所（採取時点で空）
    div.empty-text: 未選択時のメッセージ
    div.footer[data-region="footer"]
```

```html
<div class="notification-area" data-region="notification-area" data-user-id="1334">
    <div class="control-area" data-region="control-area">
        <div class="header"></div>
        <div class="content" data-region="content"></div>
        <div class="empty-text">あなたに通知はありません。</div>
        <span class="loading-icon icon-no-margin">…</span>
    </div>
    <div class="content-area" data-region="content-area">
        <div class="toggle-mode">
            <button class="btn btn-link" data-action="toggle-mode">戻る</button>
        </div>
        <div class="header" data-region="header"></div>
        <div class="content" data-region="content"></div>
        <div class="empty-text">詳細を表示するにはサイドの通知一覧から選択してください。</div>
        <div class="footer" data-region="footer"></div>
    </div>
</div>
```

### 通知0件時の表示

左ペインは `.control-area .empty-text`（「あなたに通知はありません。」）、右ペインは `.content-area .empty-text`（「詳細を表示するにはサイドの通知一覧から選択してください。」）をそれぞれ表示する。両方とも `document.querySelectorAll('.notification-area .empty-text')` で2件ヒットする。

### 通知1件を表す要素・詳細ペインの中身（未確認）

ポップオーバーと同じ理由で、`.control-area [data-region="content"]` に並ぶ通知アイテムの構造、および `.content-area` に表示される詳細本文の構造は採取できなかった。

## 気付いた注意点

- **通知が1件も無いアカウントで採取した。** ポップオーバー・全件ページとも、個々の通知アイテムのDOM（既読/未読のクラス名や属性の違いを含む）は確認できていない。実装前に別途確認が必要。
- **モバイル表示は確認できなかった。** [`home.md`](./home.md) と同様、`resize_window` でも `window.innerWidth` が変わらず、狭幅時のレイアウトを再現できなかった。全件ページの「戻る」ボタン（`[data-action="toggle-mode"]`）は狭幅時に一覧⇔詳細を切り替えるためのものと推測されるが未確認。
- ベルアイコンのコンテナ（`#nav-notification-popover-container`）には、`navbar.md` に採取したHTML上 `d-none` や `d-md-*` のような幅依存クラスが付いていない。常時表示の可能性があるが、モバイル表示を確認できていないため未確定。
- ベルアイコンは `#theme_boost-drawers-primary`（モバイル用ドロワー）の中には存在しない（`document.querySelectorAll('#theme_boost-drawers-primary [data-region="popover-region"]')` は0件）。トップバー側の `#usernavigation` にのみ存在する。
