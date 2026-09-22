<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { TimetableHoliday } from "@/features/timetable/types";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";

  let { value, onChange }: CustomFieldProps<TimetableHoliday[]> = $props();

  let items = $derived(value ?? []);
</script>

<ListField
  {items}
  {onChange}
  createItem={(): TimetableHoliday => ({ date: "" })}
  addLabel="休講日を追加"
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
      <Input
        type="text"
        placeholder="理由・名称（任意）"
        value={item.label ?? ""}
        class="flex-1"
        oninput={(e) =>
          update({
            ...item,
            label: (e.target as HTMLInputElement).value || undefined,
          })}
      />
    </div>
  {/snippet}
</ListField>
