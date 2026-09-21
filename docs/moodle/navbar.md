# Moodle ナビゲーションバー

Moodle 4.5 のナビゲーションメニューのDOM構造リファレンス。実画面から採取したもの。

PC表示のトップバー（`nav.navbar`）とモバイル表示のドロワー（`#theme_boost-drawers-primary`）でマークアップが異なるため、両方を記載する。

このDOMを操作するモジュールの指示書は [`docs/impl/menu/navbar.md`](../impl/menu/navbar.md)。

## ナビゲーションバーについて
セレクタ：`nav.navbar`

### 構成
nav.navbar > div.container-fluid
- button.navbar-toggle: 幅が狭い時のドロワボタン
- a.navbar-brand: ロゴ

#### 幅があるときはここが見える
- div.primary-navigation > nav.moremenu > ul.nav: メインナビゲーション
  - li.nav-item: 通常のボタン要素（data-key: ページ名, role: none, data-forceintomoremenu: bool）
  - li.dropdown: ドロップダウン要素
    - a.dropdown-item:
- div#usernavigation: 通知・メッセージ・ユーザメニュー等
  - div#nav-notification-popover-container: 通知ボタン
  - div.popover-region: メッセージボタン
  - div.usermenu-container: ユーザメニュー
    - div.usermenu > div.dropdown: ユーザメニューの要素
      - a#user-menu-toggle: メニュー開閉ボタン
        - span.userbutton > span.avatars > span.avatar: アバター
      - div#user-action-menu: ユーザメニュー
        - div#usermenu-carousel > div.carousel-inner >
          - div#carousel-item-main: メニュー内容
            - a.dropdown-item: ボタン（href: リンク, role: menuitem, tabindex: -1）
            - div.dropdown-divider: 分割線
          - div#carousel-item-6a773597221b1 かつ div.submenu: 追加ページ(言語セレクタ)

```html<nav class="navbar fixed-top navbar-light bg-white navbar-expand" aria-label="サイトナビゲーション" id="yui_3_18_1_1_1786197399171_26">
        <div class="container-fluid" id="yui_3_18_1_1_1786197399171_25">
            <button class="navbar-toggler aabtn d-block d-md-none px-1 my-1 border-0" data-toggler="drawers" data-action="toggle" data-target="theme_boost-drawers-primary" data-disabled-toggle="undefined" data-toggle="undefined" data-original-title="" id="yui_3_18_1_1_1786197399171_31" data-lastused="true">
                <span class="navbar-toggler-icon" id="yui_3_18_1_1_1786197399171_30"></span>
                <span class="sr-only">サイドパネル</span>
            </button>

            <a href="https://lms-m41.mie-u.ac.jp/" class="navbar-brand d-none d-md-flex align-items-center m-0 me-4 p-0 aabtn">

                    <img src="https://lms-m41.mie-u.ac.jp/pluginfile.php/1/core_admin/logocompact/300x300/1781473252/Moodle45.png" class="logo me-1" alt="三重大学 Moodle 4">
            </a>
                <div class="primary-navigation" id="yui_3_18_1_1_1786197399171_36">
                    <nav class="moremenu navigation observed" id="yui_3_18_1_1_1786197399171_35">
                        <ul id="moremenu-6a77359721fd0-navbar-nav" role="menubar" class="nav more-nav navbar-nav">
                                    <li data-key="home" class="nav-item" role="none" data-forceintomoremenu="false">
                                                <a role="menuitem" class="nav-link active " href="https://lms-m41.mie-u.ac.jp/" aria-current="true" data-disableactive="true">
                                                    Home
                                                </a>
                                    </li>
                                    <li data-key="myhome" class="nav-item" role="none" data-forceintomoremenu="false">
                                                <a role="menuitem" class="nav-link  " href="https://lms-m41.mie-u.ac.jp/my/" data-disableactive="true" tabindex="-1">
                                                    ダッシュボード
                                                </a>
                                    </li>








                            <li data-key="mycourses" class="nav-item" role="none" data-forceintomoremenu="false">
                                                <a role="menuitem" class="nav-link" href="https://lms-m41.mie-u.ac.jp/my/courses.php" data-disableactive="true" tabindex="-1">
                                                    マイコース
                                                </a>
                                    </li><li class="dropdown nav-item" role="none" data-forceintomoremenu="false" id="yui_3_18_1_1_1786197399171_37">
                                        <a class="dropdown-toggle nav-link" id="drop-down-6a77359721ba5" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" aria-controls="drop-down-menu-6a77359721ba5" tabindex="-1">
                                            Office365
                                        </a>
                                        <div class="dropdown-menu" role="menu" id="drop-down-menu-6a77359721ba5" aria-labelledby="drop-down-6a77359721ba5">
                                                        <a class="dropdown-item" role="menuitem" href="https://portal.office.com/" data-disableactive="true" tabindex="-1">
                                                            Office365
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://teams.microsoft.com/_#/discover" data-disableactive="true" tabindex="-1">
                                                             - Teams
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://stream.office.com/" data-disableactive="true" tabindex="-1">
                                                             - Stream
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://outlook.office.com/calendar/view/month" data-disableactive="true" tabindex="-1">
                                                             - Outlook
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://to-do.office.com/tasks/" data-disableactive="true" tabindex="-1">
                                                             - ToDo
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://tasks.office.com/" data-disableactive="true" tabindex="-1">
                                                             - Planner
                                                        </a>
                                        </div>
                                    </li><li class="dropdown nav-item" role="none" data-forceintomoremenu="false">
                                        <a class="dropdown-toggle nav-link" id="drop-down-6a77359721da5" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" aria-controls="drop-down-menu-6a77359721da5" tabindex="-1">
                                            Google
                                        </a>
                                        <div class="dropdown-menu" role="menu" id="drop-down-menu-6a77359721da5" aria-labelledby="drop-down-6a77359721da5">
                                                        <a class="dropdown-item" role="menuitem" href="https://meet.google.com/?hs=197&amp;pli=1&amp;authuser=1" data-disableactive="true" tabindex="-1">
                                                             Google Meet
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://calendar.google.com/calendar/b/1/r" data-disableactive="true" tabindex="-1">
                                                             Google カレンダー
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://mail.google.com/mail/u/1/?tab=cm#inbox" data-disableactive="true" tabindex="-1">
                                                             Google Gmail
                                                        </a>
                                        </div>
                                    </li><li role="none" class="nav-item dropdown dropdownmoremenu" data-region="morebutton" id="yui_3_18_1_1_1786197399171_34">
                                <a class="dropdown-toggle nav-link " href="#" id="moremenu-dropdown-6a77359721fd0" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" tabindex="-1">
                                    さらに
                                </a>
                                <ul class="dropdown-menu dropdown-menu-left" data-region="moredropdown" aria-labelledby="moremenu-dropdown-6a77359721fd0" role="menu"><li class="dropdown nav-item" role="none" data-forceintomoremenu="false">
                                        <a class="dropdown-toggle dropdown-item" id="drop-down-6a77359721dc5" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" aria-controls="drop-down-menu-6a77359721dc5" tabindex="-1">
                                            サービス
                                        </a>
                                        <div class="dropdown-menu" role="menu" id="drop-down-menu-6a77359721dc5" aria-labelledby="drop-down-6a77359721dc5">
                                                        <a class="dropdown-item" role="menuitem" href="https://mail.google.com/mail/u/0/#inbox" data-disableactive="true" tabindex="-1">
                                                            学生用メール
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://unipa.mie-u.ac.jp/uprx/" data-disableactive="true" tabindex="-1">
                                                            ユニバーサルパスポート（履修・シラバス・休講）
                                                        </a>
                                                    <div class="dropdown-divider"></div>
                                                        <a class="dropdown-item" role="menuitem" href="https://eportfolio2.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            三重大学eポートフォリオ2
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://eportfolio.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            （旧）三重大学eポートフォリオ
                                                        </a>
                                                    <div class="dropdown-divider"></div>
                                                        <a class="dropdown-item" role="menuitem" href="https://www.mcgb.dhier.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            三重大学キャリア支援システム
                                                        </a>
                                                    <div class="dropdown-divider"></div>
                                                        <a class="dropdown-item" role="menuitem" href="https://www.cc.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            情報基盤センター
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="http://www.lib.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            附属図書館
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://anpic-mie-u.jecc.jp/mie-u/login/" data-disableactive="true" tabindex="-1">
                                                            ANPIC
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="http://www.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            三重大学
                                                        </a>
                                        </div>
                                    </li><li class="dropdown nav-item" role="none" data-forceintomoremenu="false">
                                        <a class="dropdown-toggle dropdown-item" id="drop-down-6a77359721e1c" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" aria-controls="drop-down-menu-6a77359721e1c" tabindex="-1">
                                            eラーニング
                                        </a>
                                        <div class="dropdown-menu" role="menu" id="drop-down-menu-6a77359721e1c" aria-labelledby="drop-down-6a77359721e1c">
                                                        <a class="dropdown-item" role="menuitem" href="https://lms-m41.mie-u.ac.jp/enrol/index.php?id=4888" data-disableactive="true" tabindex="-1">
                                                            INFOSS情報倫理2026年度版
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://lms-m41.mie-u.ac.jp/course/view.php?id=4896" data-disableactive="true" tabindex="-1">
                                                            INFOSS情報倫理2026年度版 ふりがな版
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://lms-m41.mie-u.ac.jp/course/view.php?id=4895" data-disableactive="true" tabindex="-1">
                                                            INFOSS情報倫理2026年度版 速習版
                                                        </a>
                                        </div>
                                    </li><li data-key="" class="nav-item" role="none" data-forceintomoremenu="false">
                                                <a role="menuitem" class="dropdown-item" href="https://scienv.mie-u.ac.jp/scilets/" data-disableactive="true" tabindex="-1">
                                                    Scilets
                                                </a>
                                    </li><li class="dropdown nav-item" role="none" data-forceintomoremenu="false">
                                        <a class="dropdown-toggle dropdown-item" id="drop-down-6a77359721e3e" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" aria-controls="drop-down-menu-6a77359721e3e" tabindex="-1">
                                            三重創生ファンタジスタ
                                        </a>
                                        <div class="dropdown-menu" role="menu" id="drop-down-menu-6a77359721e3e" aria-labelledby="drop-down-6a77359721e3e">
                                                        <a class="dropdown-item" role="menuitem" href="https://conso-mie.jp/miesfc/" data-disableactive="true" tabindex="-1">
                                                            コンソーシアム三重
                                                        </a>
                                                        <a class="dropdown-item" role="menuitem" href="https://www.cocpls.mie-u.ac.jp/" data-disableactive="true" tabindex="-1">
                                                            地域イノベーションを推進する三重創生ファンタジスタの養成
                                                        </a>
                                        </div>
                                    </li><li class="dropdown nav-item" role="none" data-forceintomoremenu="false">
                                        <a class="dropdown-toggle dropdown-item" id="drop-down-6a77359721e51" role="menuitem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" aria-controls="drop-down-menu-6a77359721e51" tabindex="-1">
                                            旧Moodle
                                        </a>
                                        <div class="dropdown-menu" role="menu" id="drop-down-menu-6a77359721e51" aria-labelledby="drop-down-6a77359721e51">
                                                        <a class="dropdown-item" role="menuitem" href="https://moodle.mie-u.ac.jp/moodle35/" data-disableactive="true" tabindex="-1">
                                                            Moodle3.5
                                                        </a>
                                        </div>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>


            <div id="usernavigation" class="navbar-nav ms-auto h-100">
                <div class="popover-region collapsed popover-region-notifications" id="nav-notification-popover-container" data-userid="1334" data-region="popover-region">
    <div class="popover-region-toggle nav-link icon-no-margin" data-region="popover-region-toggle" aria-controls="popover-region-container-6a7735972346b6a773597223ae2" aria-haspopup="true" aria-expanded="false" aria-label=" 新しい通知がない通知ウィンドウを表示する   " title=" 新しい通知がない通知ウィンドウを表示する   " tabindex="0" role="button">
                <i class="icon fa fa-bell fa-fw " aria-hidden="true"></i>
        <div class="count-container hidden" data-region="count-container" aria-hidden="true">
            0
        </div>

    </div>
    <div aria-modal="true" tabindex="-1" id="popover-region-container-6a7735972346b6a773597223ae2" class="popover-region-container" data-region="popover-region-container" aria-hidden="true" aria-label="通知ウィンドウ" role="dialog">
        <div class="popover-region-header-container">
            <h3 class="popover-region-header-text" data-region="popover-region-header-text">通知</h3>
            <div class="popover-region-header-actions" data-region="popover-region-header-actions">        <a class="mark-all-read-button btn btn-sm btn-link m-0 py-0 icon-no-margin" href="#" title="すべてを既読にする" data-action="mark-all-read" role="button" aria-label="すべてを既読にする">
            <span class="normal-icon"><i class="icon fa fa-check fa-fw " aria-hidden="true"></i></span>
            <span class="loading-icon icon-no-margin"><i class="icon fa fa-spinner fa-spin fa-fw " title="読み込み中" role="img" aria-label="読み込み中"></i></span>
            <span aria-live="polite" class="sr-only" data-region="notification-read-feedback"></span>
        </a>
            <a href="https://lms-m41.mie-u.ac.jp/message/notificationpreferences.php" title="通知プレファレンス" aria-label="通知プレファレンス" class="btn btn-sm btn-link m-0 py-0 icon-no-margin">
                <i class="icon fa fa-gear fa-fw " aria-hidden="true"></i></a>
        <button type="button" class="btn btn-sm btn-link m-0 py-0 icon-no-margin" aria-label="閉じる" title="閉じる" data-action="close-notification-popover">
            <i class="icon fa fa-xmark fa-fw " aria-hidden="true"></i>
        </button>
</div>
        </div>
        <div class="popover-region-content-container" data-region="popover-region-content-container">
            <div class="popover-region-content" data-region="popover-region-content">
                        <div class="all-notifications" data-region="all-notifications" role="log" aria-busy="false" aria-atomic="false" aria-relevant="additions"></div>
        <div class="empty-message" tabindex="0" data-region="empty-message">あなたに通知はありません。</div>

            </div>
            <span class="loading-icon icon-no-margin"><i class="icon fa fa-spinner fa-spin fa-fw " title="読み込み中" role="img" aria-label="読み込み中"></i></span>
        </div>
                <a class="see-all-link" href="https://lms-m41.mie-u.ac.jp/message/output/popup/notifications.php">
                    <div class="popover-region-footer-container">
                        <div class="popover-region-seeall-text">すべてを表示する</div>
                    </div>
                </a>
    </div>
</div><div class="popover-region collapsed" data-region="popover-region-messages">
    <a id="message-drawer-toggle-6a77359723b8e6a773597223ae3" class="nav-link popover-region-toggle position-relative icon-no-margin" href="#" aria-label="メッセージドロワを切り替える" title="メッセージドロワを切り替える" role="button" aria-expanded="false" aria-describedby="unread-messages-count-6a77359723b8e6a773597223ae3">
        <i class="icon fa fa-message fa-fw " aria-hidden="true"></i>
        <div class="count-container hidden" data-region="count-container">
            <span aria-hidden="true">0</span>
            <span class="sr-only" id="unread-messages-count-6a77359723b8e6a773597223ae3">0 件の未読会話があります。</span>
        </div>
    </a>
    <span class="sr-only sr-only-focusable" data-region="jumpto" tabindex="-1"></span></div>
                <div class="d-flex align-items-stretch usermenu-container" data-region="usermenu" id="yui_3_18_1_1_1786197399171_24">
                        <div class="usermenu" id="yui_3_18_1_1_1786197399171_23">
                                <div class="dropdown" id="yui_3_18_1_1_1786197399171_22">
                                    <a href="#" role="button" id="user-menu-toggle" data-toggle="dropdown" aria-label="ユーザメニュー" aria-haspopup="true" aria-controls="user-action-menu" class="btn dropdown-toggle" aria-expanded="false">
                                        <span class="userbutton">
                                            <span class="avatars">
                                                    <span class="avatar current">
                                                        <span class="userinitials size-35" title="小林 令" aria-label="小林 令" role="img">小</span>
                                                    </span>
                                            </span>
                                        </span>
                                    </a>
                                    <div id="user-action-menu" class="dropdown-menu dropdown-menu-right">
                                        <div id="usermenu-carousel" class="carousel slide" data-touch="false" data-interval="false" data-keyboard="false">
                                            <div class="carousel-inner">
                                                <div id="carousel-item-main" class="carousel-item active" role="menu" tabindex="-1" aria-label="ユーザ">
                                                            <a href="https://lms-m41.mie-u.ac.jp/user/profile.php" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                プロファイル
                                                            </a>

                                                            <a href="https://lms-m41.mie-u.ac.jp/grade/report/overview/index.php" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                評定
                                                            </a>

                                                            <a href="https://lms-m41.mie-u.ac.jp/calendar/view.php?view=month" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                カレンダー
                                                            </a>

                                                            <a href="https://lms-m41.mie-u.ac.jp/user/files.php" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                プライベートファイル
                                                            </a>

                                                            <a href="https://lms-m41.mie-u.ac.jp/reportbuilder/index.php" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                レポート
                                                            </a>

                                                        <div class="dropdown-divider"></div>
                                                            <a href="https://lms-m41.mie-u.ac.jp/user/preferences.php" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                プレファレンス
                                                            </a>

                                                            <a href="#" class="carousel-navigation-link dropdown-item" role="menuitem" tabindex="-1" data-carousel-target-id="carousel-item-6a773597221b1">

                                                                言語設定
                                                            </a>
                                                        <div class="dropdown-divider"></div>
                                                            <a href="https://lms-m41.mie-u.ac.jp/login/logout.php?sesskey=2xfjGAS0ek" class="dropdown-item" role="menuitem" tabindex="-1">

                                                                ログアウト
                                                            </a>

                                                </div>
                                                    <div id="carousel-item-6a773597221b1" role="menu" class="carousel-item submenu" tabindex="-1" aria-label="言語セレクタ" style="width: 233px; height: 277px;">
                                                        <div class="d-flex flex-column h-100">
                                                            <div class="header">
                                                                <button type="button" class="btn btn-icon carousel-navigation-link text-decoration-none text-body" data-carousel-target-id="carousel-item-main" aria-label="ユーザメニューに戻る">
                                                                    <span class="dir-rtl-hide"><img class="icon " alt="" aria-hidden="true" src="https://lms-m41.mie-u.ac.jp/theme/image.php/boost/core/1781473252/i/arrow-left"></span>
                                                                    <span class="dir-ltr-hide"><img class="icon " alt="" aria-hidden="true" src="https://lms-m41.mie-u.ac.jp/theme/image.php/boost/core/1781473252/i/arrow-right"></span>
                                                                </button>
                                                                <span class="ps-2" id="carousel-item-title-6a773597221b1">言語セレクタ</span>
                                                            </div>
                                                            <div class="dropdown-divider"></div>
                                                            <div class="items h-100 overflow-auto" role="menu" aria-labelledby="carousel-item-title-6a773597221b1">
                                                                        <a href="https://lms-m41.mie-u.ac.jp/?lang=en" class="dropdown-item ps-5" role="menuitem" tabindex="-1" lang="en">
                                                                            English ‎(en)‎
                                                                        </a>
                                                                        <a href="#" class="dropdown-item ps-5" role="menuitem" tabindex="-1" aria-current="true">
                                                                            日本語 ‎(ja)‎
                                                                        </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                </div>

            </div>
        </div>
    </nav>
```

#### 幅がないとき
div#theme_boost-drawers-primary: ドロワ
  - div.drawerheader: ロゴ等を表示するヘッダ
    - button.btn または button.drawertoggle: ドロワを閉じるボタン
    - a: ホームへのリンクボタン（画像）
  - div.drawercontent > div.list-group: ドロワのコンテンツ
    - a.list-group-item: リンク
    - a.list-group-item かつ a.collapsed
```html
<div class="drawer drawer-left drawer-primary d-print-none" data-region="fixed-drawer" id="theme_boost-drawers-primary" data-preference="" data-state="show-drawer-primary" data-forceopen="0" data-close-on-resize="1" aria-hidden="true">
    <div class="drawerheader" id="yui_3_18_1_1_1786197399171_40">
        <button class="btn drawertoggle icon-no-margin hidden" data-toggler="drawers" data-action="closedrawer" data-target="theme_boost-drawers-primary" data-placement="right" data-disabled-toggle="tooltip" data-toggle="tooltip" data-original-title="ドロワを閉じる" data-lastused="false" id="yui_3_18_1_1_1786197399171_39" data-aria-hidden-tab-index="" tabindex="-1">
            <i class="icon fa fa-xmark fa-fw " aria-hidden="true" id="yui_3_18_1_1_1786197399171_38"></i>
        </button>
                <a href="https://lms-m41.mie-u.ac.jp/" title="三重大学 Moodle 4" data-region="site-home-link" class="aabtn text-reset d-flex align-items-center py-1 h-100" data-aria-hidden-tab-index="" tabindex="-1">
                <img src="https://lms-m41.mie-u.ac.jp/pluginfile.php/1/core_admin/logocompact/300x300/1781473252/Moodle45.png" class="logo py-1 h-100" alt="三重大学 Moodle 4">
        </a>

        <div class="drawerheadercontent hidden">

        </div>
    </div>
    <div class="drawercontent drag-container" data-usertour="scroller" id="yui_3_18_1_1_1786197399171_42">
                <div class="list-group" id="yui_3_18_1_1_1786197399171_41">
                <a href="https://lms-m41.mie-u.ac.jp/" class="list-group-item list-group-item-action active " aria-current="true" data-aria-hidden-tab-index="" tabindex="-1">
                    Home
                </a>
                <a href="https://lms-m41.mie-u.ac.jp/my/" class="list-group-item list-group-item-action  " data-aria-hidden-tab-index="" tabindex="-1">
                    ダッシュボード
                </a>
                <a href="https://lms-m41.mie-u.ac.jp/my/courses.php" class="list-group-item list-group-item-action  " data-aria-hidden-tab-index="" tabindex="-1">
                    マイコース
                </a>
                <a id="drop-down-1" href="#" class="list-group-item list-group-item-action icons-collapse-expand d-flex collapsed" data-toggle="collapse" data-target="#drop-down-menu-1" aria-expanded="false" aria-controls="drop-down-menu-1" data-aria-hidden-tab-index="" tabindex="-1">
                    Office365
                    <span class="ms-auto expanded-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-down fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            折りたたむ
                        </span>
                    </span>
                    <span class="ms-auto collapsed-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-right fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            展開する
                        </span>
                    </span>
                </a>
                <div class="list-group-item p-0 border-0 collapse" role="menu" id="drop-down-menu-1" aria-labelledby="drop-down-1" style="">
                             <a href="https://portal.office.com/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">Office365</a>
                             <a href="https://teams.microsoft.com/_#/discover" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> - Teams</a>
                             <a href="https://stream.office.com/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> - Stream</a>
                             <a href="https://outlook.office.com/calendar/view/month" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> - Outlook</a>
                             <a href="https://to-do.office.com/tasks/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> - ToDo</a>
                             <a href="https://tasks.office.com/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> - Planner</a>
                </div>
                <a id="drop-down-8" href="#" class="list-group-item list-group-item-action icons-collapse-expand collapsed d-flex" data-toggle="collapse" data-target="#drop-down-menu-8" aria-expanded="false" aria-controls="drop-down-menu-8" data-aria-hidden-tab-index="" tabindex="-1">
                    Google
                    <span class="ms-auto expanded-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-down fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            折りたたむ
                        </span>
                    </span>
                    <span class="ms-auto collapsed-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-right fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            展開する
                        </span>
                    </span>
                </a>
                <div class="collapse list-group-item p-0 border-0" role="menu" id="drop-down-menu-8" aria-labelledby="drop-down-8">
                             <a href="https://meet.google.com/?hs=197&amp;pli=1&amp;authuser=1" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> Google Meet</a>
                             <a href="https://calendar.google.com/calendar/b/1/r" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> Google カレンダー</a>
                             <a href="https://mail.google.com/mail/u/1/?tab=cm#inbox" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1"> Google Gmail</a>
                </div>
                <a id="drop-down-12" href="#" class="list-group-item list-group-item-action icons-collapse-expand collapsed d-flex" data-toggle="collapse" data-target="#drop-down-menu-12" aria-expanded="false" aria-controls="drop-down-menu-12" data-aria-hidden-tab-index="" tabindex="-1">
                    サービス
                    <span class="ms-auto expanded-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-down fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            折りたたむ
                        </span>
                    </span>
                    <span class="ms-auto collapsed-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-right fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            展開する
                        </span>
                    </span>
                </a>
                <div class="collapse list-group-item p-0 border-0" role="menu" id="drop-down-menu-12" aria-labelledby="drop-down-12">
                             <a href="https://mail.google.com/mail/u/0/#inbox" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">学生用メール</a>
                             <a href="https://unipa.mie-u.ac.jp/uprx/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">ユニバーサルパスポート（履修・シラバス・休講）</a>
                             <a href="https://eportfolio2.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">三重大学eポートフォリオ2</a>
                             <a href="https://eportfolio.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">（旧）三重大学eポートフォリオ</a>
                             <a href="https://www.mcgb.dhier.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">三重大学キャリア支援システム</a>
                             <a href="https://www.cc.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">情報基盤センター</a>
                             <a href="http://www.lib.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">附属図書館</a>
                             <a href="https://anpic-mie-u.jecc.jp/mie-u/login/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">ANPIC</a>
                             <a href="http://www.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">三重大学</a>
                </div>
                <a id="drop-down-25" href="#" class="list-group-item list-group-item-action icons-collapse-expand collapsed d-flex" data-toggle="collapse" data-target="#drop-down-menu-25" aria-expanded="false" aria-controls="drop-down-menu-25" data-aria-hidden-tab-index="" tabindex="-1">
                    eラーニング
                    <span class="ms-auto expanded-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-down fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            折りたたむ
                        </span>
                    </span>
                    <span class="ms-auto collapsed-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-right fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            展開する
                        </span>
                    </span>
                </a>
                <div class="collapse list-group-item p-0 border-0" role="menu" id="drop-down-menu-25" aria-labelledby="drop-down-25">
                             <a href="https://lms-m41.mie-u.ac.jp/enrol/index.php?id=4888" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">INFOSS情報倫理2026年度版</a>
                             <a href="https://lms-m41.mie-u.ac.jp/course/view.php?id=4896" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">INFOSS情報倫理2026年度版 ふりがな版</a>
                             <a href="https://lms-m41.mie-u.ac.jp/course/view.php?id=4895" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">INFOSS情報倫理2026年度版 速習版</a>
                </div>
                <a href="https://scienv.mie-u.ac.jp/scilets/" class="list-group-item list-group-item-action  " data-aria-hidden-tab-index="" tabindex="-1">
                    Scilets
                </a>
                <a id="drop-down-30" href="#" class="list-group-item list-group-item-action icons-collapse-expand collapsed d-flex" data-toggle="collapse" data-target="#drop-down-menu-30" aria-expanded="false" aria-controls="drop-down-menu-30" data-aria-hidden-tab-index="" tabindex="-1">
                    三重創生ファンタジスタ
                    <span class="ms-auto expanded-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-down fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            折りたたむ
                        </span>
                    </span>
                    <span class="ms-auto collapsed-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-right fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            展開する
                        </span>
                    </span>
                </a>
                <div class="collapse list-group-item p-0 border-0" role="menu" id="drop-down-menu-30" aria-labelledby="drop-down-30">
                             <a href="https://conso-mie.jp/miesfc/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">コンソーシアム三重</a>
                             <a href="https://www.cocpls.mie-u.ac.jp/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">地域イノベーションを推進する三重創生ファンタジスタの養成</a>
                </div>
                <a id="drop-down-33" href="#" class="list-group-item list-group-item-action icons-collapse-expand collapsed d-flex" data-toggle="collapse" data-target="#drop-down-menu-33" aria-expanded="false" aria-controls="drop-down-menu-33" data-aria-hidden-tab-index="" tabindex="-1">
                    旧Moodle
                    <span class="ms-auto expanded-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-down fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            折りたたむ
                        </span>
                    </span>
                    <span class="ms-auto collapsed-icon icon-no-margin mx-2">
                        <i class="icon fa fa-chevron-right fa-fw " aria-hidden="true"></i>
                        <span class="sr-only">
                            展開する
                        </span>
                    </span>
                </a>
                <div class="collapse list-group-item p-0 border-0" role="menu" id="drop-down-menu-33" aria-labelledby="drop-down-33">
                             <a href="https://moodle.mie-u.ac.jp/moodle35/" class="ps-5 bg-light list-group-item list-group-item-action" data-aria-hidden-tab-index="" tabindex="-1">Moodle3.5</a>
                </div>
        </div>

    </div>
</div>
```
