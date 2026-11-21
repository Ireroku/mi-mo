# greeting モジュール

## 概要

ホームへ挨拶を出す。名前の前の言葉とログインしているユーザーの名前を「こんにちは、〇〇さん」の形で並べ、候補から選んだ一言を添える。一言はページを開くたびに選び直す。候補は、拡張機能に同梱した既定の一言（`public/greetings.txt`）と、利用者が足した一言の2つを合わせたもの。利用者の一言は、設定画面でテキストファイルとして出し入れできる。

## 関連

- 使う: [`./container.md`](./container.md) — ホームへ差し込む器
- 使う: [`../moodle/user.md`](../moodle/user.md) — 表示名の読み取り
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 使う: [`../utils/download.md`](../utils/download.md) — `saveBlob` でメッセージファイルを保存する
- 使う: [`../settings/panel.md`](../settings/panel.md) — 設定画面の行の定義と `CustomFieldProps`
- 使う: [`../settings/menuFields.md`](../settings/menuFields.md) — 一覧の編集に使う `ListField`
- 資料: [`../../features/home/greeting.md`](../../features/home/greeting.md) — 一言の例と、常時表示にする動機
- 参考: [`../menu/clock.md`](../menu/clock.md) — `createShadowRootUi` で要素を差し込む書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/home/greeting.logic.ts` | 名前の前の言葉、一言の選び方、メッセージファイルの読み書き |
| `src/features/home/greeting.logic.test.ts` | 上の単体テスト |
| `src/features/home/greeting.ts` | 設定の型と差し込み |
| `src/features/home/defaultMessages.ts` | 既定の一言を background で読み、候補から1件選ぶ |
| `public/greetings.txt` | 既定の一言。1行1件 |
| `src/entrypoints/background.ts` | `GREETING_MESSAGE_TYPE` のメッセージを受け、`pickFromAll` の結果を返す |
| `src/features/home/Greeting.svelte` | 挨拶の描画 |
| `src/features/settings/fields/GreetingMessagesField.svelte` | 設定画面での一言の編集と、ファイルの出し入れ |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼び、出した一言を保存する |

## インターフェース

```ts
// src/features/home/greeting.logic.ts
export type SalutationMode = "time" | "fixed" | "none";

export const FIXED_SALUTATION = "ごきげんよう";
export const MESSAGES_FILENAME = "mi-mo-greetings.txt";

export function pickSalutation(date: Date, mode?: SalutationMode): string;
export function pickMessage(
  messages: string[],
  last: string,
  random?: () => number,
): string | undefined;
export function parseMessages(text: string): string[];
export function formatMessages(messages: string[]): string;
```

```ts
// src/features/home/greeting.ts
export interface GreetingConfig {
  enabled: boolean;
  salutation?: SalutationMode;
  useDefaultMessages: boolean; // 既定の一言も候補に入れるか
  messages: string[]; // 利用者が足した一言
}

// 出した一言を返す
export async function initGreeting(
  ctx: ContentScriptContext,
  config: GreetingConfig,
  lastMessage: string,
): Promise<string | undefined>;
```

```ts
// src/features/home/defaultMessages.ts
export const GREETING_MESSAGE_TYPE = "mimo:greeting";

export interface GreetingRequest {
  type: typeof GREETING_MESSAGE_TYPE;
  custom: string[];
  useDefaults: boolean;
  last: string;
}

// content script から呼ぶ
export async function requestMessage(
  request: Omit<GreetingRequest, "type">,
): Promise<string | undefined>;

// background から呼ぶ
export async function pickFromAll(
  request: GreetingRequest,
): Promise<string | undefined>;
```

```ts
// Greeting.svelte の Props
interface Props {
  salutation: string; // 置かない場合は空文字
  userName: string | undefined;
  message: string | undefined;
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const homeGreetingSetting = defineSetting<GreetingConfig>(
  "local:home.greeting",
  {
    fallback: {
      enabled: true,
      salutation: "time",
      useDefaultMessages: false,
      messages: [],
    },
  },
);

// 直前に出した一言
export const homeGreetingLastMessage = defineSetting<string>(
  "local:home.greeting.last",
  { fallback: "" },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触らない。

```ts
// src/entrypoints/shared.content.ts
if (loggedIn && greetingConfig.enabled) {
  await runFeature("greeting", async () => {
    const shown = await initGreeting(
      ctx,
      greetingConfig,
      await homeGreetingLastMessage.getValue(),
    );
    if (shown !== undefined) {
      await homeGreetingLastMessage.setValue(shown);
    }
  });
}
```

設定画面の行:

```ts
// src/features/settings/fields.ts
defineGroup("home", "挨拶", homeGreetingSetting, {
  enabled: { label: "挨拶を表示する", /* ... */ control: { kind: "toggle" } },
  salutation: {
    label: "名前の前の言葉",
    description: "「こんにちは、〇〇さん」の形で出します",
    control: {
      kind: "select",
      options: [
        { value: "time", label: "時間帯に合わせる" },
        { value: "fixed", label: FIXED_SALUTATION },
        { value: "none", label: "なし" },
      ],
    },
  },
  useDefaultMessages: {
    label: "mi-mo の一言を使う",
    description: "mi-mo に入っている一言も候補に入れます",
    control: { kind: "toggle" },
  },
  messages: {
    label: "自分の一言",
    description: "mi-mo の一言と合わせて、毎回1つ選ばれます",
    control: { kind: "custom", component: GreetingMessagesField },
  },
}),
```

## 処理の流れ

### initGreeting

1. `ensureHomeContainer()` を呼ぶ。`undefined` なら何もせず `undefined` を返す
2. `readUserName()` で表示名を読む
3. `pickSalutation(new Date(), config.salutation)` で名前の前の言葉を決める
4. `requestMessage({ custom: config.messages, useDefaults: config.useDefaultMessages, last: lastMessage })` で一言を選ぶ
5. `createShadowRootUi` で `Greeting.svelte` をマウントする
6. 選んだ一言を返す

| 設定 | 値 |
|---|---|
| `name` | `mimo-greeting` |
| `position` | `inline` |
| `anchor` | `ensureHomeContainer()` の戻り値 |
| `append` | `last` |

### pickSalutation

| `mode` | 戻り値 |
|---|---|
| `"none"` | 空文字 |
| `"fixed"` | `FIXED_SALUTATION` |
| `"time"` または未指定 | 下の表に従う |

時刻は端末の時刻の「時」だけを見る。境界は開始の時を含む。

| 時 | 戻り値 |
|---|---|
| 5 以上 11 未満 | `おはようございます` |
| 11 以上 18 未満 | `こんにちは` |
| 18 以上、または 5 未満 | `こんばんは` |

### pickFromAll

background で動く。

1. `useDefaults` が true なら、`browser.runtime.getURL("/greetings.txt")` を `fetch` で読み、`parseMessages` へ通す。false なら空の一覧にする
2. 既定の一言の後ろへ `custom` をつなぎ、重複を最初の1件にまとめる
3. `pickMessage(候補, last)` の結果を返す

background の受け口は、`type` が `GREETING_MESSAGE_TYPE` のメッセージだけを扱う。`custom` のうち文字列でない要素を捨て、`last` を文字列へ直してから `pickFromAll` を呼ぶ。読み込みに失敗した場合は `console.error("[mi-mo] greeting", 理由)` を出し、`undefined` で応答する。応答は `sendResponse` で返し、リスナーは `true` を返す（理由は [`../utils/download.md`](../utils/download.md) と同じ）。

### pickMessage

1. `messages` から `last` と同じ文字列を除く
2. 残りが1件以上あれば、その中から無作為に1件を選ぶ
3. 残りが無ければ、`messages` の全体から選ぶ。`messages` が空なら `undefined` を返す

`random` は 0 以上 1 未満を返す関数で、既定は `Math.random`。テストが結果を固定するために差し替える。

### メッセージファイル

文字コードは UTF-8、1行が1件のテキスト。ファイル名は `MESSAGES_FILENAME`。

- `formatMessages` は、各メッセージの末尾へ改行を付けて連結する
- `parseMessages` は、改行（`\n` と `\r\n`）で分け、各行の前後の空白を除き、空行を捨て、重複した行を最初の1件にまとめる

### Greeting.svelte

1. `salutation` と「<名前>さん」のうち、あるものを「、」でつないで大きく出す。両方あれば「こんにちは、〇〇さん」、名前が無ければ「こんにちは」、言葉が無ければ「〇〇さん」になる
2. `message` があれば、その下に一言を小さく添える
3. どれも無い場合は何も描かない

### GreetingMessagesField

上から、ファイルの操作、説明の1行、一覧の順に置く。

1. 「ファイルへ書き出す」は、今の一覧を `formatMessages` で文字列にし、`saveBlob` で保存する
2. 「ファイルから読み込む」は、隠した `<input type="file">`（`accept="text/plain,.txt"`）を開く。選ばれたファイルを `parseMessages` へ通し、結果で一覧を置き換える
3. ボタンの横へ、今の件数を「N件」と出す
4. 説明の1行は、普段は「ファイルは1行に1件です。読み込むと、今の一覧と入れ替わります」を出す。読み込んだ後は「N件を読み込みました」へ変わる
5. 読み込んだ結果が0件の場合は、一覧を変えず、「このファイルにはメッセージがありません」を `text-destructive` で出す
6. 一覧は `ListField` で編集する。行はテキスト入力1つ

## 決めごと

- **一言はページを開くたびに選び直す。** 仕様書が「毎回同じ文面では飽きる」としており、遷移のたびに変わる方が動機に合う
- **直前に出した1件だけを覚え、続けて同じ一言を出さない。** 候補が少ないと、無作為の選択では同じ一言が続く。覚えるのは1件で、履歴は持たない
- **直前の一言は、設定とは別の保存項目に持つ。** 利用者が決める値ではなく、設定画面にもバックアップにも出さない。保存は entrypoint が行い、機能側は `src/utils/settings.ts` を参照しない
- **名前の前の言葉と一言を別のものとして扱う。** 言葉は時刻で決まる定型の呼びかけ、一言は利用者が書く文面で、時間帯の判定は言葉にだけ効く。一言がいつ出るかは時刻に左右されない
- **時間帯の区切りは固定にし、設定へ出さない。** 区切りを変えたい場面より、設定の行が増える害の方が大きい
- **`salutation` を省略可能にする。** この項目が増える前に保存された設定には無い。無い場合は `"time"` として扱う
- **既定の一言は、コードとストレージに入れず `public/greetings.txt` に置き、background が読む。** 件数を増やしても、Moodle の全ページで読む content script と、保存の領域が大きくならない。content script が受け取るのは選んだ1件だけ。ファイルは拡張機能の中から読むため、`web_accessible_resources` へ出さずに済む
- **既定の一言は毎回読み、手元に残さない。** background は止まると中身を失い、覚えても次に使える保証が無い。ホームを開く時に1回読むだけで、重さは問題にならない
- **既定の一言と利用者の一言は混ぜて選ぶ。** 利用者の一言は足すためのもので、既定のものを使いたくない場合は `useDefaultMessages` で切る
- **既定の一言は複数行にしない。** 1行1件の形式を、利用者のメッセージファイルと共有する。長い一言は表示の側で折り返す
- **既定の一言へ、時間帯を含む文面を入れない。** 名前の前の言葉が「こんばんは」の時に「おはようございます！」が並ぶと食い違う
- **名前が取れない場合も挨拶を出す。** Moodle 側の構造の変化で読めない場合がある。言葉と一言だけでも表示は成立する
- **候補が1つでも同じ選択の手順を通す。** 分岐を減らす。結果は常に同じ1つになる
- **`enabled` が false の時は entrypoint 側で呼ばない。** 名前の読み取りまで走らせない
- **未ログインの間は entrypoint 側で呼ばない。** 呼びかける相手がいない。`loggedIn` は entrypoint が `isLoggedIn()`（[`../moodle/user.md`](../moodle/user.md)）で1度だけ求め、時間割の判定にも使う
- **[`./container.md`](./container.md) の器へ入れる。** 時間割と同じ場所へ出るため、並び順を entrypoint の呼び出し順で決められるようにする
- **メッセージファイルは JSON ではなく、1行1件のテキストにする。** メモ帳で書け、他の人へそのまま渡せる。一言は改行を含まない
- **ファイルの読み込みは、追加ではなく置き換えにする。** 追加にすると、同じファイルを読み直すたびに何が残るかを考える必要が出る。置き換えは結果がファイルの中身と一致する。前の一覧を残したい場合は、先に書き出せる
- **ファイルの操作を一覧より上に置く。** 件数が増えると一覧が長くなり、下に置いた操作へ届かない
