<script lang="ts">
  // 押すと別の画面へ進む行。右端の矢印で、その場では変わらないことを示す
  import { ChevronRight } from "@lucide/svelte";
  import type { ClassValue } from "svelte/elements";

  interface Props {
    label: string;
    description?: string;
    count?: number; // 一覧の件数。先に見せると、開かずに中身の量が分かる
    class?: ClassValue;
    onclick: () => void;
  }

  let { label, description, count, class: className, onclick }: Props = $props();
</script>

<button
  type="button"
  class={[
    "flex cursor-pointer items-center justify-between gap-4 py-3 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    className,
  ]}
  {onclick}
>
  <span class="flex min-w-0 flex-col gap-0.5">
    <span class="text-row">{label}</span>
    {#if description}
      <span class="text-note text-muted-foreground">{description}</span>
    {/if}
  </span>
  <span class="flex shrink-0 items-center gap-1 text-note text-muted-foreground">
    {#if count !== undefined}
      {count}件
    {/if}
    <ChevronRight class="size-4" />
  </span>
</button>
