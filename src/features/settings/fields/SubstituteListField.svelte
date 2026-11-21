<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import {
    WEEKDAYS,
    WEEKDAY_LABELS,
    type TimetableSubstitute,
    type Weekday,
  } from "@/features/timetable/types";
  import ListField from "./ListField.svelte";
  import StackedInputs from "../controls/StackedInputs.svelte";
  import DatePicker from "../controls/DatePicker.svelte";
  import * as Select from "$lib/components/ui/select";

  let { value, onChange }: CustomFieldProps<TimetableSubstitute[]> = $props();

  let items = $derived(value ?? []);

  const WEEKDAY_OPTIONS = WEEKDAYS.map((value) => ({
    value,
    label: `${WEEKDAY_LABELS[value]}曜の授業`,
  }));
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
