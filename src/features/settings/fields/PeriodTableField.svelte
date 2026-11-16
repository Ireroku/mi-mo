<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { PeriodSlot } from "@/utils/periods";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";

  let { value, onChange }: CustomFieldProps<PeriodSlot[]> = $props();

  let items = $derived(value ?? []);

  function createPeriodSlot(): PeriodSlot {
    const maxPeriod = items.reduce((max, cur) => Math.max(max, cur.period), 0);
    return {
      period: maxPeriod + 1,
      start: "",
      end: "",
    };
  }
</script>

<ListField
  {items}
  {onChange}
  createItem={createPeriodSlot}
  addLabel="時限を追加"
>
  {#snippet row(item, update)}
    <div class="flex items-center gap-2">
      <div class="w-16 shrink-0 flex items-center gap-1">
        <Input
          type="number"
          min={1}
          max={20}
          value={item.period}
          class="w-12 text-center"
          oninput={(e) =>
            update({
              ...item,
              period: parseInt((e.target as HTMLInputElement).value, 10) || 1,
            })}
        />
        <span class="text-note text-muted-foreground">限</span>
      </div>
      <Input
        type="time"
        value={item.start}
        class="flex-1"
        oninput={(e) =>
          update({ ...item, start: (e.target as HTMLInputElement).value })}
      />
      <span class="text-note text-muted-foreground">〜</span>
      <Input
        type="time"
        value={item.end}
        class="flex-1"
        oninput={(e) =>
          update({ ...item, end: (e.target as HTMLInputElement).value })}
      />
    </div>
  {/snippet}
</ListField>
