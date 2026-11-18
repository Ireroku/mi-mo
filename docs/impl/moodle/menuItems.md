# menuItems モジュール

## 概要

Moodle のナビゲーションバーに出ている項目の名前を読み取る。設定画面が「隠す項目」の候補として使うため、読み取った結果は entrypoint がストレージへ控える。

## 関連

- 資料: [`../../moodle/navbar.md`](../../moodle/navbar.md) — ナビゲーションバーの DOM と、幅が足りない時に出る「さらに」のドロップダウン
- 使う: [`../utils/settings.md`](../utils/settings.md) — 控えを置くストレージ項目
- 参考: [`./courseList.md`](./courseList.md) — 同じ形で控えを持つ読み取り
- 参考: [`../settings/menuFields.md`](../settings/menuFields.md) — 控えを候補に出す `HiddenMenuItemsField`

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/moodle/menuItems.ts` | メニュー項目名の読み取り |
| `src/utils/settings.ts` | 控えのストレージ項目 |
| `src/entrypoints/shared.content.ts` | 読み取って控えを更新する |

## インターフェース

```ts
// src/moodle/menuItems.ts
export function readMenuItemNames(): string[];
```

控えの定義:

```ts
// src/utils/settings.ts
export interface MenuItemsCache {
  names: string[];
  updatedAt: string; // ISO の日時
}

export const menuItemsCacheSetting = defineSetting<MenuItemsCache>(
  "local:moodle.menuItems",
  { fallback: { names: [], updatedAt: "" } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触らない。

```ts
// src/entrypoints/shared.content.ts。initMenu より前に置く
await runFeature("menuItemsCache", async () => {
  if (!loggedIn) {
    return;
  }
  const names = readMenuItemNames();
  const cached = await menuItemsCacheSetting.getValue();
  if (names.length > 0 && names.join("\n") !== cached.names.join("\n")) {
    await menuItemsCacheSetting.setValue({
      names,
      updatedAt: new Date().toISOString(),
    });
  }
});
await runFeature("menu", () => initMenu(menuConfig));
```

## 処理の流れ

### readMenuItemNames

1. `nav.navbar ul.more-nav, nav.navbar ul.navbar-nav` の最初の1つを取る。無ければ空の配列を返す
2. その中の、最上段の項目のリンク（`:scope > li.nav-item:not(.dropdownmoremenu) > a`）と、ドロップダウンの中のリンク（`.dropdown-menu a.dropdown-item`）を、DOM の順にすべて取る
3. 各リンクの `textContent` から、頭の空白と「-」を除き、前後の空白を除いたものを名前にする。空の名前は飛ばす
4. 同じ名前が複数あれば最初の1つだけを残す

## 決めごと

- **`initMenu` より前に読む。** `initMenu` が項目を隠した後や、mi-mo の足した項目が入った後では、Moodle の元の項目名がそろわない。隠した項目こそ候補に残したい
- **「さらに」の開閉ボタン（`li.dropdownmoremenu`）の名前は読まない。** 項目ではなく、幅に応じて Moodle が出す入れ物。中の項目は `.dropdown-menu` から読む
- **未ログインのページでは控えない。** 未ログインのナビゲーションバーには一部の項目しか出ず、控えると候補が減る
- **名前が前と同じなら書き込まない。** 全ページで動くため、変わらない値を毎回書かない
- **読めなかった場合に控えを上書きしない。** ナビゲーションバーの無いページで空の配列が返る。それで控えを潰すと、設定画面から候補が消える
- **控えは設定画面に出さない。** ユーザーが編集するものではなく、隠す項目を書く時の候補として使うだけ。`settingsGroups` には入れない
- **`src/moodle/` に置く。** Moodle の DOM を読む処理で、設定画面と content script の両方の都合から独立させる。[`./courseList.md`](./courseList.md) と同じ置き方にそろえる
