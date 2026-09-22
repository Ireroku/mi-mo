<script lang="ts">
  import { settingsGroups } from "./fields";
  import {
    CATEGORY_LABELS,
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
  import { Separator } from "$lib/components/ui/separator";

  const categories: SettingsCategory[] = [
    "ui",
    "home",
    "myCourses",
    "coursePage",
  ];

  let selectedTab = $state<SettingsCategory>("ui");
  let groupValues = $state<Record<string, Record<string, unknown>>>({});
  let loaded = $state(false);

  $effect(() => {
    Promise.all(
      settingsGroups.map(async (group) => {
        const val = await group.read();
        return { title: group.title, val };
      }),
    ).then((results) => {
      const map: Record<string, Record<string, unknown>> = {};
      for (const res of results) {
        map[res.title] = res.val;
      }
      groupValues = map;
      loaded = true;
    });
  });

  async function handleFieldChange(
    group: SettingsGroup,
    key: string,
    nextVal: unknown,
  ) {
    const current = groupValues[group.title] ?? {};
    groupValues = {
      ...groupValues,
      [group.title]: {
        ...current,
        [key]: nextVal,
      },
    };
    await group.write(key, nextVal);
  }
</script>

<div class="mx-auto w-full min-w-96 max-w-3xl p-4 font-sans text-foreground">
  <header class="mb-4 flex items-center justify-between pb-2 border-b">
    <div class="flex items-center gap-2">
      <span class="text-base font-bold tracking-tight">mi-mo 設定</span>
    </div>
    <span class="text-xs text-muted-foreground">Moodle 4 拡張機能</span>
  </header>

  {#if !loaded}
    <div class="flex h-40 items-center justify-center text-xs text-muted-foreground">
      設定を読み込み中...
    </div>
  {:else}
    <Tabs bind:value={selectedTab} class="w-full">
      <TabsList class="grid w-full grid-cols-4 mb-4">
        {#each categories as cat}
          <TabsTrigger value={cat} class="text-xs">
            {CATEGORY_LABELS[cat]}
          </TabsTrigger>
        {/each}
      </TabsList>

      {#each categories as cat}
        <TabsContent value={cat} class="flex flex-col gap-6 outline-hidden">
          {@const groups = settingsGroups.filter((g) => g.category === cat)}
          {#each groups as group, idx}
            {@const values = groupValues[group.title] ?? {}}
            <div class="rounded-xl border bg-card p-4 shadow-2xs">
              <h4 class="text-sm font-semibold tracking-tight mb-3">
                {group.title}
              </h4>

              <div class="flex flex-col divide-y divide-border/60">
                {#each Object.entries(group.fields) as [fieldKey, meta]}
                  <FieldRow
                    {meta}
                    value={values[fieldKey]}
                    onChange={(next) =>
                      handleFieldChange(group, fieldKey, next)}
                  />
                {/each}
              </div>

              {#if group.footer}
                {@const FooterComponent = group.footer}
                <div class="mt-3 pt-3 border-t">
                  <FooterComponent />
                </div>
              {/if}
            </div>
          {/each}
        </TabsContent>
      {/each}
    </Tabs>
  {/if}
</div>
