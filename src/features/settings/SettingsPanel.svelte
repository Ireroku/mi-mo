<script lang="ts">
  import { settingsGroups } from "./fields";
  import {
    CATEGORY_LABELS,
    type FieldMeta,
    type SettingsCategory,
    type SettingsGroup,
  } from "./types";
  import FieldRow from "./FieldRow.svelte";
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button";

  // このキーのトグルを持つグループは、先頭の行のスイッチで機能全体を入り切りする
  const MASTER_KEY = "enabled";

  interface Row {
    group: SettingsGroup;
    key: string;
    meta: FieldMeta;
  }

  interface Block {
    id: string;
    title?: string;
    rows: Row[];
    footer?: SettingsGroup["footer"];
  }

  const categories = Object.keys(CATEGORY_LABELS) as SettingsCategory[];

  let selectedTab = $state<SettingsCategory>(categories[0]!);
  let groupValues = $state<Record<string, Record<string, unknown>>>({});
  let status = $state<"loading" | "ready" | "failed">("loading");
  let saveError = $state("");

  // 書き込みは「読む→差し替える→書く」の3手で、並行すると後勝ちで変更が消える。1本に直列化する
  let saveQueue: Promise<void> = Promise.resolve();

  function isMasterOff(group: SettingsGroup): boolean {
    return (
      group.fields[MASTER_KEY]?.control.kind === "toggle" &&
      !groupValues[group.id]?.[MASTER_KEY]
    );
  }

  // トグル1つだけのグループは、隣り合うもの同士を見出しの無い1枚のカードへまとめる
  function buildBlocks(category: SettingsCategory): Block[] {
    const blocks: Block[] = [];
    for (const group of settingsGroups) {
      if (group.category !== category) {
        continue;
      }

      const off = isMasterOff(group);
      const rows = Object.entries(group.fields)
        .filter(([key]) => !off || key === MASTER_KEY)
        .map(([key, meta]) => ({ group, key, meta }));

      const only = Object.values(group.fields);
      const single =
        only.length === 1 && only[0]!.control.kind === "toggle" && !group.footer;
      const last = blocks.at(-1);
      if (single && last && !last.title) {
        last.rows.push(...rows);
        continue;
      }

      blocks.push({
        id: group.id,
        title: single ? undefined : group.title,
        rows,
        footer: off ? undefined : group.footer,
      });
    }
    return blocks;
  }

  async function load() {
    status = "loading";
    try {
      const entries = await Promise.all(
        settingsGroups.map(
          async (group) => [group.id, await group.read()] as const,
        ),
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

  function handleFieldChange(group: SettingsGroup, key: string, next: unknown) {
    const previous = groupValues[group.id]?.[key];
    setValue(group.id, key, next);
    saveError = "";

    saveQueue = saveQueue
      .then(() => group.write(key, next))
      .catch((error: unknown) => {
        console.error("[mi-mo] settings", error);
        setValue(group.id, key, previous);
        saveError = `「${group.title}」を保存できませんでした。もう一度操作してください。`;
      });
  }

  load();
</script>

<div class="min-h-dvh bg-muted font-sans text-foreground dark:bg-background">
  <!-- 見出しとタブは画面に残るため、切り替えた先は先頭から見せる -->
  <Tabs
    bind:value={selectedTab}
    onValueChange={() => window.scrollTo(0, 0)}
    class="mx-auto w-full max-w-2xl gap-0"
  >
    <header class="sticky top-0 z-10 bg-muted px-4 pt-4 pb-3 dark:bg-background">
      <h1 class="text-lg font-semibold tracking-tight">mi-mo の設定</h1>
      <p class="mt-0.5 text-note text-muted-foreground">
        変更はすぐ保存されます。Moodle を再読み込みすると反映されます。
      </p>

      {#if status === "ready"}
        <TabsList
          class="mt-3 grid w-full grid-cols-3 bg-foreground/8 group-data-horizontal/tabs:h-10"
        >
          {#each categories as cat (cat)}
            <TabsTrigger value={cat}>{CATEGORY_LABELS[cat]}</TabsTrigger>
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
    {:else}
      {#each categories as cat (cat)}
        <TabsContent
          value={cat}
          class="flex flex-col gap-6 px-4 pt-1 pb-8 outline-hidden"
        >
          {#each buildBlocks(cat) as block (block.id)}
            <section>
              {#if block.title}
                <h2 class="mb-1.5 px-4 text-note font-medium text-muted-foreground">
                  {block.title}
                </h2>
              {/if}
              <div
                class="divide-y divide-border rounded-xl bg-card pl-4 text-card-foreground"
              >
                {#each block.rows as row (`${row.group.id}.${row.key}`)}
                  <FieldRow
                    meta={row.meta}
                    value={groupValues[row.group.id]?.[row.key]}
                    onChange={(next) =>
                      handleFieldChange(row.group, row.key, next)}
                  />
                {/each}

                {#if block.footer}
                  {@const FooterComponent = block.footer}
                  <div class="py-3 pr-4">
                    <FooterComponent />
                  </div>
                {/if}
              </div>
            </section>
          {/each}
        </TabsContent>
      {/each}
    {/if}
  </Tabs>
</div>
