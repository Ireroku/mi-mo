<script lang="ts">
  import type { FieldMeta } from "./types";
  import FieldRow from "./FieldRow.svelte";
  import { Switch } from "$lib/components/ui/switch";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  interface Props {
    meta: FieldMeta;
    value: unknown;
    onChange: (next: unknown) => void;
  }

  let { meta, value, onChange }: Props = $props();

  const id = `field-${crypto.randomUUID().slice(0, 8)}`;
</script>

{#snippet inputHeading(clickable = false)}
  <div class="flex flex-col gap-0.5">
    <Label for={id} class={clickable ? "text-sm font-medium cursor-pointer" : "text-sm font-medium"}>
      {meta.label}
    </Label>
    {#if meta.description}
      <p class="text-xs text-muted-foreground">{meta.description}</p>
    {/if}
  </div>
{/snippet}

<div class="py-2.5">
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
          oninput={(e) => {
            const num = parseFloat((e.target as HTMLInputElement).value);
            onChange(isNaN(num) ? 0 : num);
          }}
        />
        {#if meta.control.unit}
          <span class="text-xs text-muted-foreground">{meta.control.unit}</span>
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      {@render inputHeading()}
      <select
        {id}
        class="h-9 w-40 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={String(value ?? "")}
        onchange={(e) => onChange((e.target as HTMLSelectElement).value)}
      >
        {#each meta.control.options as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

  {:else if meta.control.kind === "nested"}
    {@const objValue = (value as Record<string, unknown>) || {}}
    <div class="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
      <div class="flex flex-col gap-0.5">
        <span class="text-sm font-medium">{meta.label}</span>
        {#if meta.description}
          <p class="text-xs text-muted-foreground">{meta.description}</p>
        {/if}
      </div>
      <div class="flex flex-col divide-y divide-border/50">
        {#each Object.entries(meta.control.fields) as [k, subMeta]}
          <FieldRow
            meta={subMeta as unknown as FieldMeta}
            value={objValue[k]}
            onChange={(subVal) => onChange({ ...objValue, [k]: subVal })}
          />
        {/each}
      </div>
    </div>

  {:else if meta.control.kind === "custom"}
    {@const CustomComponent = meta.control.component}
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-0.5">
        <Label class="text-sm font-medium">
          {meta.label}
        </Label>
        {#if meta.description}
          <p class="text-xs text-muted-foreground">{meta.description}</p>
        {/if}
      </div>
      <!-- @ts-expect-error CustomFieldProps generic mismatch handled at defineGroup -->
      <CustomComponent {value} {onChange} />
    </div>
  {/if}
</div>
