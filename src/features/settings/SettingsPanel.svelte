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
  import { Switch } from "$lib/components/ui/switch";
  import { Button } from "$lib/components/ui/button";

  // このキーのトグルを持つグループは、カード見出しのスイッチで機能全体を入り切りする
  const MASTER_KEY = "enabled";

  interface ToggleRow {
    group: SettingsGroup;
    key: string;
    meta: FieldMeta;
  }

  type Block =
    | { kind: "toggles"; rows: ToggleRow[] }
    | { kind: "card"; group: SettingsGroup; master: FieldMeta | undefined };

  const categories = Object.keys(CATEGORY_LABELS) as SettingsCategory[];

  // トグル1つだけのグループは、隣り合うもの同士を1枚のカードへまとめる
  function buildBlocks(category: SettingsCategory): Block[] {
    const blocks: Block[] = [];
    for (const group of settingsGroups) {
      if (group.category !== category) {
        continue;
      }

      const entries = Object.entries(group.fields);
      const only = entries.length === 1 ? entries[0] : undefined;
      if (only && only[1].control.kind === "toggle" && !group.footer) {
        const row = { group, key: only[0], meta: only[1] };
        const last = blocks.at(-1);
        if (last?.kind === "toggles") {
          last.rows.push(row);
        } else {
          blocks.push({ kind: "toggles", rows: [row] });
        }
        continue;
      }

      const master = group.fields[MASTER_KEY];
      blocks.push({
        kind: "card",
        group,
        master: master?.control.kind === "toggle" ? master : undefined,
      });
    }
    return blocks;
  }

  let selectedTab = $state<SettingsCategory>("ui");
  let groupValues = $state<Record<string, Record<string, unknown>>>({});
  let status = $state<"loading" | "ready" | "failed">("loading");
  let saveError = $state("");

  // 書き込みは「読む→差し替える→書く」の3手で、並行すると後勝ちで変更が消える。1本に直列化する
  let saveQueue: Promise<void> = Promise.resolve();

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

{#snippet card(group: SettingsGroup, master: FieldMeta | undefined)}
  {@const values = groupValues[group.id] ?? {}}
  {@const active = !master || Boolean(values[MASTER_KEY])}
  <section class="rounded-xl border {active ? 'bg-card' : 'bg-muted/40'}">
    <div class="flex items-center justify-between gap-4 px-4 py-3">
      <div class="flex flex-col gap-0.5">
        <h2 class="text-sm font-semibold tracking-tight">{group.title}</h2>
        {#if master}
          <p class="text-xs text-muted-foreground">{master.label}</p>
        {/if}
      </div>
      {#if master}
        <Switch
          aria-label={`${group.title}: ${master.label}`}
          checked={active}
          onCheckedChange={(checked) =>
            handleFieldChange(group, MASTER_KEY, checked)}
        />
      {/if}
    </div>

    {#if active}
      <div class="flex flex-col divide-y divide-border/60 border-t px-4">
        {#each Object.entries(group.fields) as [fieldKey, meta] (fieldKey)}
          {#if !master || fieldKey !== MASTER_KEY}
            <FieldRow
              {meta}
              value={values[fieldKey]}
              onChange={(next) => handleFieldChange(group, fieldKey, next)}
            />
          {/if}
        {/each}
      </div>

      {#if group.footer}
        {@const FooterComponent = group.footer}
        <div class="border-t px-4 py-3">
          <FooterComponent />
        </div>
      {/if}
    {/if}
  </section>
{/snippet}

<div class="mx-auto w-full max-w-3xl p-4 font-sans text-foreground">
  <header class="mb-4">
    <h1 class="text-base font-bold tracking-tight">mi-mo 設定</h1>
    <p class="text-xs text-muted-foreground">
      変更はすぐ保存されます。Moodle のページを再読み込みすると反映されます。
    </p>
  </header>

  {#if status === "loading"}
    <p class="py-16 text-center text-xs text-muted-foreground">
      設定を読み込み中...
    </p>
  {:else if status === "failed"}
    <div class="flex flex-col items-center gap-3 py-16" role="alert">
      <p class="text-sm">設定を読み込めませんでした。</p>
      <Button type="button" variant="outline" size="sm" onclick={load}>
        再試行
      </Button>
    </div>
  {:else}
    {#if saveError}
      <p
        class="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        role="alert"
      >
        {saveError}
      </p>
    {/if}

    <Tabs bind:value={selectedTab} class="w-full">
      <TabsList class="mb-4 grid w-full grid-cols-4">
        {#each categories as cat (cat)}
          <TabsTrigger value={cat} class="text-xs">
            {CATEGORY_LABELS[cat]}
          </TabsTrigger>
        {/each}
      </TabsList>

      {#each categories as cat (cat)}
        <TabsContent value={cat} class="flex flex-col gap-3 outline-hidden">
          {#each buildBlocks(cat) as block}
            {#if block.kind === "card"}
              {@render card(block.group, block.master)}
            {:else}
              <section
                class="flex flex-col divide-y divide-border/60 rounded-xl border bg-card px-4"
              >
                {#each block.rows as row (row.group.id)}
                  <FieldRow
                    meta={row.meta}
                    value={groupValues[row.group.id]?.[row.key]}
                    onChange={(next) =>
                      handleFieldChange(row.group, row.key, next)}
                  />
                {/each}
              </section>
            {/if}
          {/each}
        </TabsContent>
      {/each}
    </Tabs>
  {/if}
</div>
