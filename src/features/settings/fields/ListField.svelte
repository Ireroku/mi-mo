<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { GripVertical, Trash2, Plus } from "@lucide/svelte";
  import { dragHandle, dragHandleZone, type DndEvent } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { MediaQuery } from "svelte/reactivity";

  interface Props {
    items: readonly T[];
    onChange: (next: T[]) => void;
    createItem: () => T;
    addLabel: string;
    row: Snippet<[T, (next: T) => void, number]>; // 3つ目は行の位置。行ごとに違う id を作るのに使う
    // 行の左に持ち手を出し、ドラッグで並べ替えられるようにする。listLabel は並び全体の名前
    sortable?: { listLabel: string; itemLabel: (item: T) => string };
  }

  let { items, onChange, createItem, addLabel, row, sortable }: Props = $props();

  // 並べ替えの部品は、行ごとに変わらない id を求める。値そのものは同じ文字列が並ぶ場合があるため、
  // 位置ごとの id をここで控え、足す・消す・並べ替える時に値と一緒に動かす。
  // 外から値が差し替わって数が変われば、足りない分を足し、余りを捨てる
  let ids: number[] = [];
  let nextId = 0;

  interface Keyed {
    id: number;
    item: T;
  }

  // ドラッグの途中は部品から受け取った並びで上書きし、保存した値が戻れば作り直す
  let keyed = $derived.by<Keyed[]>(() => {
    while (ids.length < items.length) ids.push(nextId++);
    ids.length = items.length;
    return items.map((item, i) => ({ id: ids[i]!, item }));
  });

  const reducedMotion = new MediaQuery("prefers-reduced-motion: reduce");
  let flipDurationMs = $derived(reducedMotion.current ? 0 : 150);

  function handleUpdate(index: number, nextItem: T) {
    const next = [...items];
    next[index] = nextItem;
    onChange(next);
  }

  function handleRemove(index: number) {
    ids.splice(index, 1);
    onChange(items.filter((_, i) => i !== index));
  }

  function handleAdd() {
    onChange([...items, createItem()]);
  }

  function handleConsider(e: CustomEvent<DndEvent<Keyed>>) {
    keyed = e.detail.items;
  }

  function handleFinalize(e: CustomEvent<DndEvent<Keyed>>) {
    keyed = e.detail.items;
    ids = keyed.map((entry) => entry.id);
    onChange(keyed.map((entry) => entry.item));
  }
</script>

<div class="flex flex-col gap-2 w-full">
  {#if items.length > 0}
    <!-- 削除ボタンは行の外の右上に置く。行が2段に積まれても、中の欄と重ならない -->
    {#if sortable}
      <ul
        aria-label={sortable.listLabel}
        class="flex flex-col gap-3"
        use:dragHandleZone={{ items: keyed, flipDurationMs, dropTargetStyle: {} }}
        onconsider={handleConsider}
        onfinalize={handleFinalize}
      >
        {#each keyed as entry, index (entry.id)}
          {@const label = sortable.itemLabel(entry.item)}
          <li
            aria-label={label}
            class="flex items-start gap-1.5 rounded-lg bg-background"
            animate:flip={{ duration: flipDurationMs }}
          >
            <!-- 持ち手。フォーカスして Enter か Space で掴み、矢印キーで動かす -->
            <div
              use:dragHandle
              aria-label={`${label}を並べ替える`}
              class="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GripVertical class="size-4" />
            </div>
            <div class="flex-1 min-w-0">
              {@render row(entry.item, (nextItem) => handleUpdate(index, nextItem), index)}
            </div>
            {@render removeButton(index)}
          </li>
        {/each}
      </ul>
    {:else}
      <div class="flex flex-col gap-3">
        {#each items as item, index}
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              {@render row(item, (nextItem) => handleUpdate(index, nextItem), index)}
            </div>
            {@render removeButton(index)}
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  <div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      class="gap-1"
      onclick={handleAdd}
    >
      <Plus class="size-3.5" />
      {addLabel}
    </Button>
  </div>
</div>

{#snippet removeButton(index: number)}
  <Button
    type="button"
    variant="ghost"
    size="icon"
    class="size-8 text-muted-foreground hover:text-destructive shrink-0"
    onclick={() => handleRemove(index)}
    aria-label="削除"
  >
    <Trash2 class="size-4" />
  </Button>
{/snippet}
