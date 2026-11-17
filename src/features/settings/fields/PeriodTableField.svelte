<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import { defaultPeriodName, nextPeriodNumber, type PeriodSlot } from "@/utils/periods";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { GripVertical, Plus, Trash2 } from "@lucide/svelte";
  import { dragHandle, dragHandleZone, type DndEvent } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { MediaQuery } from "svelte/reactivity";
  import { timetableSetting } from "@/utils/settings";
  import TimePicker from "../controls/TimePicker.svelte";

  let { value, onChange }: CustomFieldProps<PeriodSlot[]> = $props();

  // 並べ替えの部品は id を持つ項目を求める。時限の番号は変わらないため、そのまま id に使う
  interface Item {
    id: number;
    slot: PeriodSlot;
  }

  // ドラッグの途中は部品から受け取った並びで上書きし、保存した値が戻れば作り直す
  let items = $derived<Item[]>((value ?? []).map((slot) => ({ id: slot.period, slot })));

  const reducedMotion = new MediaQuery("prefers-reduced-motion: reduce");
  let flipDurationMs = $derived(reducedMotion.current ? 0 : 150);

  function save(next: Item[]) {
    onChange(next.map((item) => item.slot));
  }

  function update(index: number, patch: Partial<PeriodSlot>) {
    save(items.map((item, i) => (i === index ? { ...item, slot: { ...item.slot, ...patch } } : item)));
  }

  function remove(index: number) {
    save(items.filter((_, i) => i !== index));
  }

  // 時間割に授業の入っている時限の番号。時限を消しても授業は残るため、足す時にこの番号を避ける。
  // 時間割は別の画面で直すため、開いた時に一度だけ読む
  let taken: number[] = [];

  $effect(() => {
    timetableSetting.getValue().then((table) => {
      taken = Object.values(table.grid).flatMap((column) =>
        column.flatMap((slot, index) => (slot ? [index + 1] : [])),
      );
    });
  });

  function add() {
    const period = nextPeriodNumber(value ?? [], taken);
    onChange([...(value ?? []), { period, start: "", end: "" }]);
  }

  function handleConsider(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items;
  }

  function handleFinalize(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items;
    save(items);
  }
</script>

<div class="flex w-full flex-col gap-2">
  <ul
    aria-label="時限の並び"
    class="flex flex-col gap-2"
    use:dragHandleZone={{ items, flipDurationMs, dropTargetStyle: {} }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
  >
    {#each items as item, index (item.id)}
      {@const fallbackName = defaultPeriodName(item.slot.period)}
      {@const name = item.slot.name?.trim() || fallbackName}
      <li
        aria-label={name}
        class="flex items-start gap-1.5 rounded-lg bg-background"
        animate:flip={{ duration: flipDurationMs }}
      >
        <!-- 持ち手。フォーカスして Enter か Space で掴み、矢印キーで動かす -->
        <div
          use:dragHandle
          aria-label={`${name}を並べ替える`}
          class="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical class="size-4" />
        </div>
        <!-- 狭い画面では時刻を名前の下へ折り返し、広い画面では1行に並べる -->
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Input
            type="text"
            aria-label={`${fallbackName}の名前`}
            placeholder={fallbackName}
            value={item.slot.name ?? ""}
            class="min-w-28 flex-1"
            oninput={(e) => update(index, { name: e.currentTarget.value || undefined })}
          />
          <div class="flex shrink-0 items-center gap-1">
            <TimePicker
              label={`${name}の開始時刻`}
              value={item.slot.start}
              onChange={(start) => update(index, { start })}
            />
            <span class="text-note text-muted-foreground">〜</span>
            <TimePicker
              label={`${name}の終了時刻`}
              value={item.slot.end}
              onChange={(end) => update(index, { end })}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`${name}を削除`}
          onclick={() => remove(index)}
        >
          <Trash2 class="size-4" />
        </Button>
      </li>
    {/each}
  </ul>

  <div>
    <Button type="button" variant="outline" class="gap-1" onclick={add}>
      <Plus class="size-3.5" />
      時限を追加
    </Button>
  </div>
</div>
