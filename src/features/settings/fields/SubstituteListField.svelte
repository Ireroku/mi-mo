<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { TimetableSubstitute, Weekday } from "@/features/timetable/types";
  import ListField from "./ListField.svelte";
  import StackedInputs from "../controls/StackedInputs.svelte";
  import DatePicker from "../controls/DatePicker.svelte";
  import * as Select from "$lib/components/ui/select";

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
    <StackedInputs>
      <DatePicker value={item.date} onChange={(date) => update({ ...item, date })} />
      <Select.Root
        type="single"
        value={item.weekday}
        onValueChange={(next) => update({ ...item, weekday: next as Weekday })}
      >
        <Select.Trigger aria-label="振り替える授業の曜日">
          <span data-slot="select-value">
            {WEEKDAY_OPTIONS.find((opt) => opt.value === item.weekday)?.label ?? ""}
          </span>
        </Select.Trigger>
        <Select.Content align="start">
          {#each WEEKDAY_OPTIONS as opt (opt.value)}
            <Select.Item value={opt.value} label={opt.label} />
          {/each}
        </Select.Content>
      </Select.Root>
    </StackedInputs>
  {/snippet}
</ListField>
