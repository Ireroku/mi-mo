<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { TimetableHoliday } from "@/features/timetable/types";
  import ListField from "./ListField.svelte";
  import StackedInputs from "../controls/StackedInputs.svelte";
  import DatePicker from "../controls/DatePicker.svelte";
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
    <StackedInputs>
      <DatePicker value={item.date} onChange={(date) => update({ ...item, date })} />
      <Input
        type="text"
        aria-label="休講の理由"
        placeholder="理由・名称（任意）"
        value={item.label ?? ""}
        oninput={(e) =>
          update({
            ...item,
            label: e.currentTarget.value || undefined,
          })}
      />
    </StackedInputs>
  {/snippet}
</ListField>
