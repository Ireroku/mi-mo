<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { TimetableSubstitute, Weekday } from "@/features/timetable/types";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";

  let { value, onChange }: CustomFieldProps<TimetableSubstitute[]> = $props();

  let items = $derived(value ?? []);

  const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
    { value: "mon", label: "月曜の授業" },
    { value: "tue", label: "火曜の授業" },
    { value: "wed", label: "水曜の授業" },
    { value: "thu", label: "木曜の授業" },
    { value: "fri", label: "金曜の授業" },
  ];
</script>

<ListField
  {items}
  {onChange}
  createItem={(): TimetableSubstitute => ({ date: "", weekday: "mon" })}
  addLabel="振替日を追加"
>
  {#snippet row(item, update)}
    <div class="flex items-center gap-2">
      <Input
        type="date"
        value={item.date}
        class="w-40 shrink-0"
        oninput={(e) =>
          update({ ...item, date: (e.target as HTMLInputElement).value })}
      />
      <select
        class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={item.weekday}
        onchange={(e) =>
          update({
            ...item,
            weekday: (e.target as HTMLSelectElement).value as Weekday,
          })}
      >
        {#each WEEKDAY_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
  {/snippet}
</ListField>
