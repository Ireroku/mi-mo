<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { CountdownConfig } from "@/features/menu/countdownBadge.logic";
  import ListField from "./ListField.svelte";
  import StackedInputs from "../controls/StackedInputs.svelte";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";

  let { value, onChange }: CustomFieldProps<CountdownConfig[]> = $props();

  let items = $derived(value ?? []);

  type SourceKind = CountdownConfig["source"]["kind"];

  const SOURCE_OPTIONS: { value: SourceKind; label: string }[] = [
    { value: "nextPeriod", label: "今の時限の残り時間" },
    { value: "fixedDate", label: "日時を指定" },
  ];

  function createCountdown(): CountdownConfig {
    return {
      id: crypto.randomUUID(),
      label: "",
      source: { kind: "fixedDate", at: "" },
    };
  }

  function withSource(item: CountdownConfig, kind: SourceKind): CountdownConfig {
    if (kind === "nextPeriod") {
      return { ...item, source: { kind: "nextPeriod" } };
    }
    return { ...item, source: { kind: "fixedDate", at: "" } };
  }
</script>

<ListField
  {items}
  {onChange}
  createItem={createCountdown}
  addLabel="カウントダウンを追加"
>
  {#snippet row(item, update)}
    <!-- 時限の対象はラベルを自動で決めるため、ラベルの欄は日時の対象だけに出す。
         380px では対象と日時を横に並べると日時が欠けるため、日時は3段目に積む -->
    <div class="flex min-w-0 flex-col gap-1">
      <StackedInputs>
        <Select.Root
          type="single"
          value={item.source.kind}
          onValueChange={(next) => {
            if (next !== item.source.kind) {
              update(withSource(item, next as SourceKind));
            }
          }}
        >
          <Select.Trigger aria-label="数える先">
            <span data-slot="select-value">
              {SOURCE_OPTIONS.find((opt) => opt.value === item.source.kind)?.label ?? ""}
            </span>
          </Select.Trigger>
          <Select.Content align="start">
            {#each SOURCE_OPTIONS as opt (opt.value)}
              <Select.Item value={opt.value} label={opt.label} />
            {/each}
          </Select.Content>
        </Select.Root>
        {#if item.source.kind === "fixedDate"}
          <Input
            type="text"
            aria-label="ラベル"
            placeholder="ラベル（例: 定期試験 開始まで）"
            value={item.label}
            oninput={(e) => update({ ...item, label: e.currentTarget.value })}
          />
          <Input
            type="datetime-local"
            aria-label="日時"
            value={item.source.at}
            oninput={(e) =>
              update({
                ...item,
                source: { kind: "fixedDate", at: e.currentTarget.value },
              })}
          />
        {/if}
      </StackedInputs>
      {#if item.source.kind === "fixedDate"}
        <p class="text-note text-muted-foreground">ラベルは空白の位置で改行します</p>
      {/if}
    </div>
  {/snippet}
</ListField>
