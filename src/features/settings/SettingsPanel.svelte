<script lang="ts">
  import { onDestroy, tick, type Component } from "svelte";
  import { slide } from "svelte/transition";
  import { MediaQuery } from "svelte/reactivity";
  import { extensionGroup, settingsGroups } from "./fields";
  import {
    CATEGORY_LABELS,
    rowId,
    type FieldMeta,
    type FooterProps,
    type SettingsCategory,
    type SettingsGroup,
  } from "./types";
  import FieldRow from "./FieldRow.svelte";
  import BackupButtons from "./BackupButtons.svelte";
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";

  // このキーのトグルを持つグループは、先頭の行のスイッチで機能全体を入り切りする
  const MASTER_KEY = "enabled";
  // 画面の入れ替わり（200ms）の7割。入れ替わりの終わり際には押せるようにする
  const SWITCH_LOCK_MS = 140;

  interface Row {
    id: string;
    section: string;
    group: SettingsGroup;
    key: string;
    meta: FieldMeta;
  }

  interface Footer {
    id: string;
    section: string;
    footer: Component<FooterProps>;
  }

  interface Section {
    title: string;
    items: (Row | Footer)[];
  }

  // 別の画面で開いている行と、そこまでの道筋
  interface Page {
    row: Row;
    trail: string[];
  }

  // 入れ子の項目の1つの枠。title が空なら見出しを出さない
  interface NestedBlock {
    title: string;
    entries: [string, FieldMeta][];
  }

  type Values = Record<string, Record<string, unknown>>;

  const categories = Object.keys(CATEGORY_LABELS) as SettingsCategory[];
  const allGroups = [extensionGroup, ...settingsGroups];

  let selectedTab = $state<SettingsCategory>(categories[0]!);
  let groupValues = $state<Values>({});
  let status = $state<"loading" | "ready" | "failed">("loading");
  let saveError = $state("");
  let page = $state<Page | null>(null);
  // 一覧へ戻ってきた直後だけ、戻る向きの動きを付ける
  let cameBack = $state(false);
  let scrollBack = 0;
  let switchLocked = $state(false);
  let switchTimer: ReturnType<typeof setTimeout> | undefined;
  const reducedMotion = new MediaQuery("prefers-reduced-motion: reduce");
  // ポップアップとオプション画面でスクロールする要素が違うため、パネルが自分で持つ
  let scroller: HTMLDivElement;

  // 書き込みは「読む→差し替える→書く」の3手で、並行すると後勝ちで変更が消える。1本に直列化する
  let saveQueue: Promise<void> = Promise.resolve();

  // 別の画面の部品が、残りの高さに収まる形を求めているか
  let pageFills = $derived(
    page?.row.meta.control.kind === "custom" && Boolean(page.row.meta.control.fill),
  );

  let extensionEnabled = $derived(
    Boolean(groupValues[extensionGroup.id]?.[MASTER_KEY]),
  );

  function isMasterOff(group: SettingsGroup): boolean {
    return (
      group.fields[MASTER_KEY]?.control.kind === "toggle" &&
      !groupValues[group.id]?.[MASTER_KEY]
    );
  }

  function groupItems(group: SettingsGroup): (Row | Footer)[] {
    const off = isMasterOff(group);
    const items: (Row | Footer)[] = [];
    let section = group.title;

    for (const [key, meta] of Object.entries(group.fields)) {
      section = meta.section ?? group.title;
      if (off && key !== MASTER_KEY) {
        continue;
      }
      if (meta.when && !meta.when(groupValues[group.id] ?? {})) {
        continue;
      }

      const id = rowId(group.id, key);
      items.push({ id, section, group, key, meta });
      for (const guest of settingsGroups) {
        if (guest.after === id) {
          items.push(...groupItems(guest));
        }
      }
    }

    if (group.footer && !off) {
      items.push({ id: `${group.id}:footer`, section, footer: group.footer });
    }
    return items;
  }

  // 見出しが同じで隣り合う行を、1枚のカードへまとめる
  function buildSections(category: SettingsCategory): Section[] {
    const sections: Section[] = [];
    for (const group of settingsGroups) {
      if (group.category !== category || group.after) {
        continue;
      }

      for (const item of groupItems(group)) {
        const last = sections.at(-1);
        if (last?.title === item.section) {
          last.items.push(item);
        } else {
          sections.push({ title: item.section, items: [item] });
        }
      }
    }
    return sections;
  }

  async function load() {
    // 取り込みの後の読み直しでは一覧を残す。消すと、取り込みの結果の文言も一緒に消える
    if (status !== "ready") {
      status = "loading";
    }

    try {
      const entries = await Promise.all(
        allGroups.map(async (group) => [group.id, await group.read()] as const),
      );
      groupValues = Object.fromEntries(entries);
      status = "ready";
    } catch (error) {
      console.error("[mi-mo] settings", error);
      status = "failed";
    }
  }

  function setValue(groupId: string, key: string, value: unknown) {
    groupValues = {
      ...groupValues,
      [groupId]: { ...groupValues[groupId], [key]: value },
    };
  }

  function handleFieldChange(
    group: SettingsGroup,
    key: string,
    next: unknown,
    label: string,
  ) {
    const previous = groupValues[group.id]?.[key];
    setValue(group.id, key, next);
    saveError = "";

    // groupValues は $state のため、そこから組んだ値には Proxy が混ざる。
    // Firefox の storage は structured clone で値を写し、Proxy を写せずに失敗するため、素の値へ直してから渡す
    const plain = $state.snapshot(next);
    saveQueue = saveQueue
      .then(() => group.write(key, plain))
      .catch((error: unknown) => {
        console.error("[mi-mo] settings", error);
        setValue(group.id, key, previous);
        saveError = `「${label}」を保存できませんでした。もう一度操作してください。`;
      });
  }

  async function restore(values: Values) {
    // 保存の途中の変更が、取り込んだ値を上書きしないよう順番を待つ
    await saveQueue;
    await Promise.all(
      allGroups
        .filter((group) => values[group.id])
        .map((group) => group.replace(values[group.id]!)),
    );
    await load();
  }

  // 入れ子の項目を、section が変わる所で区切る。続く行の section が同じなら1つの枠に入れる
  function nestedBlocks(fields: Record<string, FieldMeta>): NestedBlock[] {
    const blocks: NestedBlock[] = [];
    for (const [key, meta] of Object.entries(fields)) {
      const title = meta.section ?? "";
      const last = blocks.at(-1);
      if (last?.title === title) {
        last.entries.push([key, meta]);
      } else {
        blocks.push({ title, entries: [[key, meta]] });
      }
    }
    return blocks;
  }

  // 画面が入れ替わる動きの間は「有効」を押せなくする。戻るの連打が、出てきたスイッチに当たらないように
  function lockSwitch() {
    clearTimeout(switchTimer);
    if (reducedMotion.current) {
      switchLocked = false;
      return;
    }

    switchLocked = true;
    switchTimer = setTimeout(() => {
      switchLocked = false;
    }, SWITCH_LOCK_MS);
  }

  function openPage(row: Row) {
    scrollBack = scroller.scrollTop;
    page = {
      row,
      trail: [CATEGORY_LABELS[selectedTab], row.section, row.meta.label],
    };
    lockSwitch();
    scroller.scrollTop = 0;
  }

  // 閉じる前に、部品の決めた形へ値を整える。変わった時だけ保存する
  function pruneValue(row: Row) {
    const control = row.meta.control;
    if (control.kind !== "custom" || !control.prune) {
      return;
    }

    const value = groupValues[row.group.id]?.[row.key];
    const next = control.prune(value);
    if (JSON.stringify(next) !== JSON.stringify(value)) {
      handleFieldChange(row.group, row.key, next, row.meta.label);
    }
  }

  async function closePage() {
    if (page) {
      pruneValue(page.row);
    }

    page = null;
    cameBack = true;
    lockSwitch();
    await tick();
    scroller.scrollTop = scrollBack;
  }

  onDestroy(() => clearTimeout(switchTimer));

  load();
</script>

<div
  bind:this={scroller}
  class="h-dvh overflow-x-hidden overflow-y-auto bg-muted font-sans text-foreground [scrollbar-gutter:stable] dark:bg-background"
>
  <!-- 見出しとタブは画面に残るため、切り替えた先は先頭から見せる -->
  <Tabs
    bind:value={selectedTab}
    onValueChange={() => {
      cameBack = false;
      scroller.scrollTop = 0;
    }}
    class={["mx-auto w-full max-w-2xl gap-0", pageFills && "h-full"]}
  >
    <header class="sticky top-0 z-10 bg-muted px-4 pt-3 pb-3 dark:bg-background">
      {#if page}
        <div class="-ml-2 flex h-9 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="shrink-0 gap-0.5 px-2"
            onclick={closePage}
          >
            <ChevronLeft class="size-4" />
            戻る
          </Button>
          <nav
            aria-label="現在の場所"
            class="flex min-w-0 items-center gap-1 text-note text-muted-foreground"
          >
            {#each page.trail as crumb, i (i)}
              {@const current = i === page.trail.length - 1}
              {#if i > 0}
                <ChevronRight class="size-3 shrink-0" />
              {/if}
              <span
                class={[
                  "whitespace-nowrap",
                  current ? "truncate font-semibold text-foreground" : "shrink-0",
                ]}
                aria-current={current ? "page" : undefined}
              >
                {crumb}
              </span>
            {/each}
          </nav>
        </div>
      {:else if status === "ready"}
        <div class="flex h-9 items-center gap-3">
          <Label for="mimo-enabled" class="cursor-pointer text-row font-semibold">
            有効
          </Label>
          <Switch
            id="mimo-enabled"
            checked={extensionEnabled}
            disabled={switchLocked}
            onCheckedChange={(checked) =>
              handleFieldChange(extensionGroup, MASTER_KEY, checked, "有効")}
          />
        </div>
        <p class="mt-0.5 text-note text-muted-foreground">
          変更を適用するにはページを再読み込みしてください
        </p>

        <TabsList
          class="relative mt-3 grid w-full grid-cols-3 bg-foreground/8 group-data-horizontal/tabs:h-10"
        >
          <!-- 選択中の印を1枚だけ置き、タブの間を滑らせる -->
          <span
            aria-hidden="true"
            class="absolute inset-y-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-md bg-background shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-input/60"
            style:transform={`translateX(${categories.indexOf(selectedTab) * 100}%)`}
          ></span>
          {#each categories as cat (cat)}
            <TabsTrigger
              value={cat}
              class="z-10 data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
            >
              {CATEGORY_LABELS[cat]}
            </TabsTrigger>
          {/each}
        </TabsList>
      {/if}

      {#if saveError}
        <p
          class="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-note text-destructive"
          role="alert"
        >
          {saveError}
        </p>
      {/if}
    </header>

    {#if status === "loading"}
      <p class="py-16 text-center text-note text-muted-foreground">
        設定を読み込み中...
      </p>
    {:else if status === "failed"}
      <div class="flex flex-col items-center gap-3 py-16" role="alert">
        <p class="text-row">設定を読み込めませんでした。</p>
        <Button type="button" variant="outline" onclick={load}>再試行</Button>
      </div>
    {:else if page}
      {@const { row } = page}
      {@const value = groupValues[row.group.id]?.[row.key]}
      <div
        class={[
          "px-4 pt-1 pb-8 duration-200 animate-in fade-in slide-in-from-right-4 motion-reduce:animate-none",
          pageFills && "flex min-h-0 flex-1 flex-col",
        ]}
      >
        {#if row.meta.control.kind === "nested"}
          {@const objValue = (value as Record<string, unknown>) ?? {}}
          {@const fields = row.meta.control.fields as unknown as Record<string, FieldMeta>}
          <div class="flex flex-col gap-6">
            {#each nestedBlocks(fields) as block, i (i)}
              <section>
                {#if block.title}
                  <h2 class="mb-1.5 px-4 text-row font-semibold">{block.title}</h2>
                {/if}
                <div
                  class="divide-y divide-border rounded-xl bg-card pl-4 text-card-foreground"
                >
                  {#each block.entries as [key, subMeta] (key)}
                    <FieldRow
                      meta={subMeta}
                      value={objValue[key]}
                      onChange={(next) =>
                        handleFieldChange(
                          row.group,
                          row.key,
                          { ...objValue, [key]: next },
                          row.meta.label,
                        )}
                    />
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        {:else if row.meta.control.kind === "custom"}
          {@const CustomComponent = row.meta.control.component}
          <div
            class={[
              "rounded-xl bg-card p-4 text-card-foreground",
              pageFills && "flex min-h-0 flex-col",
            ]}
          >
            <CustomComponent
              {value}
              onChange={(next) =>
                handleFieldChange(row.group, row.key, next, row.meta.label)}
            />
          </div>
        {/if}
      </div>
    {:else}
      {#each categories as cat (cat)}
        <TabsContent
          value={cat}
          class={[
            "flex flex-col gap-6 px-4 pt-1 pb-8 outline-hidden transition-opacity duration-200 animate-in fade-in motion-reduce:animate-none",
            cameBack && "slide-in-from-left-4",
            !extensionEnabled && "opacity-50",
          ]}
        >
          {#each buildSections(cat) as section (section.title)}
            <section>
              <h2 class="mb-1.5 px-4 text-row font-semibold">{section.title}</h2>
              <div
                class="divide-y divide-border rounded-xl bg-card pl-4 text-card-foreground"
              >
                {#each section.items as item (item.id)}
                  <div transition:slide={{ duration: 150 }}>
                    {#if "footer" in item}
                      {@const FooterComponent = item.footer}
                      <div class="py-3 pr-4">
                        <FooterComponent values={groupValues} onRestore={restore} />
                      </div>
                    {:else}
                      <FieldRow
                        meta={item.meta}
                        value={groupValues[item.group.id]?.[item.key]}
                        onChange={(next) =>
                          handleFieldChange(
                            item.group,
                            item.key,
                            next,
                            item.meta.label,
                          )}
                        onOpen={() => openPage(item)}
                      />
                    {/if}
                  </div>
                {/each}
              </div>
            </section>
          {/each}

          <!-- 保存項目を持たない操作のため、グループの外に置く -->
          {#if cat === "general"}
            <section>
              <h2 class="mb-1.5 px-4 text-row font-semibold">バックアップ</h2>
              <div class="rounded-xl bg-card p-4 text-card-foreground">
                <BackupButtons values={groupValues} onRestore={restore} />
              </div>
            </section>
          {/if}
        </TabsContent>
      {/each}
    {/if}
  </Tabs>
</div>
