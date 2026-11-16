<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { CountdownConfig } from "@/features/menu/countdownBadge.logic";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";

  let { value, onChange }: CustomFieldProps<CountdownConfig[]> = $props();

  let items = $derived(value ?? []);

  function createCountdown(): CountdownConfig {
    return {
      id: crypto.randomUUID(),
      label: "",
      source: { kind: "nextPeriod" },
    };
  }
</script>

<ListField
  {items}
  {onChange}
  createItem={createCountdown}
  addLabel="カウントダウンを追加"
>
  {#snippet row(item, update)}
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Input
        type="text"
        placeholder="ラベル（例: 次の時限まで）"
        value={item.label}
        class="flex-1"
        oninput={(e) =>
          update({ ...item, label: (e.target as HTMLInputElement).value })}
      />

      <div class="flex items-center gap-2 shrink-0">
        <select
          class="h-9 rounded-md border border-input bg-background px-2 text-base shadow-xs md:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={item.source.kind}
          onchange={(e) => {
            const kind = (e.target as HTMLSelectElement).value;
            if (kind === "nextPeriod") {
              update({ ...item, source: { kind: "nextPeriod" } });
            } else {
              update({
                ...item,
                source: { kind: "fixedDate", at: "" },
              });
            }
          }}
        >
          <option value="nextPeriod">次の時限</option>
          <option value="fixedDate">日時を指定</option>
        </select>

        {#if item.source.kind === "fixedDate"}
          <Input
            type="datetime-local"
            value={item.source.at}
            class="w-48"
            oninput={(e) => {
              if (item.source.kind === "fixedDate") {
                update({
                  ...item,
                  source: {
                    kind: "fixedDate",
                    at: (e.target as HTMLInputElement).value,
                  },
                });
              }
            }}
          />
        {/if}
      </div>
    </div>
  {/snippet}
</ListField>
