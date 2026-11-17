<script lang="ts">
  import type { FieldMeta } from "./types";
  import { Switch } from "$lib/components/ui/switch";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { ChevronRight } from "@lucide/svelte";

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
      <Input
        {id}
        type="date"
        value={typeof value === "string" ? value : ""}
        class="w-44"
        oninput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    </div>

  {:else if meta.control.kind === "select"}
    <div class="flex items-center justify-between gap-4">
      {@render inputHeading()}
      <select
        {id}
        class="h-9 max-w-48 shrink-0 rounded-md border border-input bg-background px-3 text-base shadow-xs md:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={String(value ?? "")}
        onchange={(e) => onChange((e.target as HTMLSelectElement).value)}
      >
        {#each meta.control.options as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

  {:else}
    <!-- 入れ子の項目と、一覧や表の編集は別の画面で開く。行には件数だけを先に見せる -->
    <button
      type="button"
      class="-my-3 -mr-4 flex cursor-pointer items-center justify-between gap-4 py-3 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      onclick={onOpen}
    >
      <span class="flex min-w-0 flex-col gap-0.5">
        <span class="text-row">{meta.label}</span>
        {#if meta.description}
          <span class="text-note text-muted-foreground">{meta.description}</span>
        {/if}
      </span>
      <span class="flex shrink-0 items-center gap-1 text-note text-muted-foreground">
        {#if Array.isArray(value)}
          {value.length}件
        {/if}
        <ChevronRight class="size-4" />
      </span>
    </button>
  {/if}
</div>
