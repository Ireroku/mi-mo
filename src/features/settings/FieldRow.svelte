<script lang="ts">
  import type { FieldMeta } from "./types";
  import { Switch } from "$lib/components/ui/switch";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import DatePicker from "./controls/DatePicker.svelte";
  import OpenRow from "./controls/OpenRow.svelte";

  interface Props {
    meta: FieldMeta;
    value: unknown;
    onChange: (next: unknown) => void;
    onOpen?: () => void; // 別の画面で開く種類の行が押された時
  }

  let { meta, value, onChange, onOpen }: Props = $props();

  const id = `field-${crypto.randomUUID().slice(0, 8)}`;
</script>

{#snippet inputHeading(clickable = false)}
  <div class="flex min-w-0 flex-col gap-0.5">
    <Label for={id} class={["text-row font-normal", clickable && "cursor-pointer"]}>
      {meta.label}
    </Label>
    {#if meta.description}
      <p class="text-note text-muted-foreground">{meta.description}</p>
    {/if}
  </div>
{/snippet}

<div class="flex min-h-12 flex-col justify-center py-3 pr-4">
  {#if meta.control.kind === "toggle"}
    <div class="flex items-center justify-between gap-4">
      {@render inputHeading(true)}
      <Switch
        {id}
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(checked)}
      />
    </div>

  {:else if meta.control.kind === "number"}
    <div class="flex items-center justify-between gap-4">
      {@render inputHeading()}
      <div class="flex items-center gap-1.5 shrink-0">
        <Input
          {id}
          type="number"
          min={meta.control.min}
          max={meta.control.max}
          step={meta.control.step}
          value={typeof value === "number" ? value : 0}
          class="w-24 text-right"
          onchange={(e) => {
            const input = e.target as HTMLInputElement;
            const num = parseFloat(input.value);
            if (isNaN(num) || meta.control.kind !== "number") {
              input.value = String(value);
              return;
            }

            const clamped = Math.min(
              meta.control.max,
              Math.max(meta.control.min, num),
            );
            input.value = String(clamped);
            onChange(clamped);
          }}
        />
        {#if meta.control.unit}
          <span class="text-note text-muted-foreground">{meta.control.unit}</span>
        {/if}
      </div>
    </div>

  {:else if meta.control.kind === "text"}
    <div class="flex flex-col gap-1.5">
      {@render inputHeading()}
      <Input
        {id}
        type="text"
        placeholder={meta.control.placeholder}
        value={typeof value === "string" ? value : ""}
        oninput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    </div>

  {:else if meta.control.kind === "date"}
    <div class="flex items-center justify-between gap-4">
      {@render inputHeading()}
      <DatePicker
        {id}
        value={typeof value === "string" ? value : ""}
        onChange={(next) => onChange(next)}
      />
    </div>

  {:else if meta.control.kind === "select"}
    {@const options = meta.control.options}
    {@const selected = String(value ?? "")}
    <div class="flex items-center justify-between gap-4">
      {@render inputHeading()}
      <Select.Root type="single" value={selected} onValueChange={(next) => onChange(next)}>
        <Select.Trigger {id} class="max-w-48 shrink-0">
          <span data-slot="select-value">
            {options.find((opt) => opt.value === selected)?.label ?? ""}
          </span>
        </Select.Trigger>
        <!-- 選択肢の文言を省略させないよう、幅は中身に合わせる -->
        <Select.Content align="end">
          {#each options as opt (opt.value)}
            <Select.Item value={opt.value} label={opt.label} />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

  {:else}
    <!-- 入れ子の項目と、一覧や表の編集は別の画面で開く。行には件数だけを先に見せる -->
    <OpenRow
      class="-my-3 -mr-4"
      label={meta.label}
      description={meta.description}
      count={Array.isArray(value) ? value.length : undefined}
      onclick={() => onOpen?.()}
    />
  {/if}
</div>
