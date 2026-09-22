# greeting モジュール

## 概要

ホームへ挨拶を出す。ログインしているユーザーの名前と、設定した候補から選んだ一言を並べる。一言はページを開くたびに選び直す。

## 関連

- 使う: [`./container.md`](./container.md) — ホームへ差し込む器
- 使う: [`../moodle/user.md`](../moodle/user.md) — 表示名の読み取り
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../features/home/greeting.md`](../../features/home/greeting.md) — 一言の例と、常時表示にする動機
- 参考: [`../menu/clock.md`](../menu/clock.md) — `createShadowRootUi` で要素を差し込む書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/home/greeting.ts` | 設定の型と差し込み |
| `src/features/home/Greeting.svelte` | 挨拶の描画 |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/home/greeting.ts
export interface GreetingConfig {
  enabled: boolean;
  messages: string[];
}

export async function initGreeting(
  ctx: ContentScriptContext,
  config: GreetingConfig,
): Promise<void>;
```

```ts
// Greeting.svelte の Props
interface Props {
  userName: string | undefined;
  message: string | undefined;
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const homeGreetingSetting = storage.defineItem<GreetingConfig>(
  "local:home.greeting",
  {
    fallback: {
      enabled: true,
      messages: [
        "おはようございます！",
        "あんた、宿題やったの！？",
        "睡眠時間を減らすと効率が落ちるそうですよ。寝ましょう。",
      ],
    },
  },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initGreeting } from "@/features/home/greeting";
import { homeGreetingSetting } from "@/utils/settings";

const config = await homeGreetingSetting.getValue();
if (config.enabled) {
  await initGreeting(ctx, config);
}
```

## 処理の流れ

1. `ensureHomeContainer()` を呼ぶ。`undefined` なら何もせず戻る
2. `readUserName()` で表示名を読む
3. `config.messages` から1つを無作為に選ぶ。空の配列なら `undefined` にする
4. `createShadowRootUi` で `Greeting.svelte` をマウントする

| 設定 | 値 |
|---|---|
| `name` | `mimo-greeting` |
| `position` | `inline` |
| `anchor` | `ensureHomeContainer()` の戻り値 |
| `append` | `last` |

### Greeting.svelte

1. `userName` があれば「<名前> さん」を大きく出す。無ければ名前の部分を省く
2. `message` があれば、その下に一言を小さく添える
3. どちらも無い場合は何も描かない

## 決めごと

- **一言はページを開くたびに選び直す。** 仕様書が「毎回同じ文面では飽きる」としており、遷移のたびに変わる方が動機に合う。保存も記録もしない
- **名前が取れない場合も挨拶を出す。** 未ログインや Moodle 側の構造の変化で読めない場合がある。一言だけでも表示は成立する
- **時間帯で文面を切り替えない。** 一言の中身はユーザーが決めるもので、「おはよう」を昼に出したくなければ候補から外せばよい。時間帯の判定を持つと、設定した文面がいつ出るのか読めなくなる
- **候補が1つでも無作為の選択を通す。** 分岐を減らす。結果は常に同じ1つになる
- **既定値に仕様書の例をそのまま入れる。** 初めて開いた時点で何が出るか分かる状態にする
- **`enabled` が false の時は entrypoint 側で呼ばない。** 名前の読み取りまで走らせない
- **[`./container.md`](./container.md) の器へ入れる。** 最終アクセスや時間割と同じ場所へ出るため、並び順を entrypoint の呼び出し順で決められるようにする
